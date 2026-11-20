import { YahooProvider } from '../providers/yahoo.provider';
import { MFAPIProvider } from '../providers/mfapi.provider';
import { CoinGeckoProvider } from '../providers/coingecko.provider';
import { BullionProvider } from '../providers/bullion.provider';
import { ValidationEngine } from './validation.engine';
import { ConfidenceEngine } from './confidence.engine';
import { marketCacheEngine } from './cache.engine';
import { requestDeduplicator } from '../queue/deduplicator';
import { rateLimiter } from '../queue/ratelimiter';
import { circuitBreaker } from './circuit.breaker';
import { structuredLogger } from './structured.logger';
import { normalizeSymbol } from '../formatter';
import { MarketPriceItem, MarketPriceMap } from '@/types/market';

export class ProviderManager {
  private yahoo = new YahooProvider();
  private mfapi = new MFAPIProvider();
  private crypto = new CoinGeckoProvider();
  private bullion = new BullionProvider();

  async syncSymbols(symbols: string[]): Promise<MarketPriceMap> {
    if (!symbols || symbols.length === 0) {
      return marketCacheEngine.getAll();
    }

    const normalizedSymbols = Array.from(new Set(symbols.map(s => normalizeSymbol(s)).filter(Boolean)));
    const results: MarketPriceMap = {};
    const unhandledSymbols: string[] = [];

    // Step 1: Check Cache first
    normalizedSymbols.forEach(sym => {
      const { item, isStale } = marketCacheEngine.get(sym);
      if (item && !isStale) {
        results[sym] = item;
      } else {
        if (item) {
          results[sym] = item; // Retain cached fallback
        }
        unhandledSymbols.push(sym);
      }
    });

    if (unhandledSymbols.length === 0) {
      return results;
    }

    // Step 2: Categorize symbols to providers
    const bullionSymbols = unhandledSymbols.filter(s => s === 'GOLD_INR_1G' || s === 'SILVER_INR_1G');
    const mfSymbols = unhandledSymbols.filter(s => /^\d{5,6}$/.test(s));
    const cryptoSymbols = unhandledSymbols.filter(s => s.endsWith('-INR') || s.endsWith('-USD'));
    const yahooSymbols = unhandledSymbols.filter(
      s => s !== 'GOLD_INR_1G' && s !== 'SILVER_INR_1G' && !(/^\d{5,6}$/.test(s)) && !cryptoSymbols.includes(s)
    );

    const promises: Promise<void>[] = [];

    // Metals Provider
    if (bullionSymbols.length > 0) {
      promises.push(
        this.fetchWithResilience('BullionAPI', bullionSymbols, (syms) => this.bullion.fetchBatch(syms), results)
      );
    }

    // Mutual Funds Provider
    mfSymbols.forEach(code => {
      promises.push(
        this.fetchSymbolWithResilience('MFAPI', code, (sym) => this.mfapi.fetchQuote(sym), results)
      );
    });

    // Crypto Provider
    cryptoSymbols.forEach(sym => {
      promises.push(
        this.fetchSymbolWithResilience('CoinGecko', sym, (s) => this.crypto.fetchQuote(s), results)
      );
    });

    // Yahoo Provider (Equities & Indices)
    yahooSymbols.forEach(sym => {
      promises.push(
        this.fetchSymbolWithResilience('Yahoo', sym, (s) => this.yahoo.fetchQuote(s), results)
      );
    });

    await Promise.allSettled(promises);

    return { ...marketCacheEngine.getAll(), ...results };
  }

  private async fetchSymbolWithResilience(
    providerName: string,
    symbol: string,
    fetcher: (sym: string) => Promise<MarketPriceItem | null>,
    resultsMap: MarketPriceMap
  ): Promise<void> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Circuit Breaker check
    if (circuitBreaker.isOpen(providerName)) {
      structuredLogger.log({
        requestId,
        requestedSymbol: symbol,
        normalizedSymbol: symbol,
        provider: providerName,
        latencyMs: Date.now() - startTime,
        retryCount: 0,
        confidence: 50,
        cacheHit: true,
        status: 'CACHED',
        error: `Circuit breaker OPEN for ${providerName}`,
      });
      return;
    }

    // Rate Limiter check
    if (!rateLimiter.canExecute(providerName)) {
      console.warn(`[RATE_LIMIT] Provider ${providerName} quota exceeded. Using cache for ${symbol}`);
      return;
    }
    rateLimiter.recordRequest(providerName);

    // Request Deduplication & Backoff Retry Loop (1s, 2s, 5s, 10s backoff)
    const delays = [1000, 2000, 5000, 10000];
    let attempts = 0;
    let item: MarketPriceItem | null = null;

    while (attempts <= delays.length && !item) {
      try {
        item = await requestDeduplicator.deduplicate(symbol, () => fetcher(symbol));
        if (item) break;
      } catch (err) {
        console.error(`[RETRY] Attempt ${attempts + 1} failed for ${symbol} via ${providerName}`);
      }

      if (attempts < delays.length) {
        await new Promise(r => setTimeout(r, delays[attempts]));
      }
      attempts++;
    }

    const latencyMs = Date.now() - startTime;

    if (item && ValidationEngine.validate(item).isValid) {
      circuitBreaker.recordSuccess(providerName);
      const confidence = ConfidenceEngine.calculate(item, true);
      const enrichedItem: MarketPriceItem = { ...item, confidence, provider: providerName };

      marketCacheEngine.set(symbol, enrichedItem);
      resultsMap[symbol] = enrichedItem;

      structuredLogger.log({
        requestId,
        requestedSymbol: symbol,
        normalizedSymbol: symbol,
        provider: providerName,
        price: enrichedItem.price,
        previousClose: enrichedItem.previousClose,
        latencyMs,
        retryCount: attempts,
        confidence,
        cacheHit: false,
        status: 'SUCCESS',
      });
    } else {
      circuitBreaker.recordFailure(providerName);
      structuredLogger.log({
        requestId,
        requestedSymbol: symbol,
        normalizedSymbol: symbol,
        provider: providerName,
        latencyMs,
        retryCount: attempts,
        confidence: 40,
        cacheHit: true,
        status: 'FAILED',
        error: `Failed to fetch valid quote from ${providerName}`,
      });
    }
  }

  private async fetchWithResilience(
    providerName: string,
    symbols: string[],
    batchFetcher: (syms: string[]) => Promise<Record<string, MarketPriceItem>>,
    resultsMap: MarketPriceMap
  ): Promise<void> {
    const startTime = Date.now();
    if (circuitBreaker.isOpen(providerName)) return;

    if (!rateLimiter.canExecute(providerName)) return;
    rateLimiter.recordRequest(providerName);

    try {
      const quotes = await batchFetcher(symbols);
      circuitBreaker.recordSuccess(providerName);

      Object.entries(quotes).forEach(([sym, item]) => {
        if (item && ValidationEngine.validate(item).isValid) {
          const confidence = ConfidenceEngine.calculate(item, true);
          const enriched: MarketPriceItem = { ...item, confidence, provider: providerName };
          marketCacheEngine.set(sym, enriched);
          resultsMap[sym] = enriched;
        }
      });
    } catch (err: any) {
      circuitBreaker.recordFailure(providerName);
      console.error(`[BATCH_FETCH_FAILED] ${providerName}:`, err);
    }
  }
}

export const providerManager = new ProviderManager();
