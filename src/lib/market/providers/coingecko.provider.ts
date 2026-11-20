import { IMarketProvider } from './provider.interface';
import { MarketPriceItem } from '@/types/market';
import { ValidationEngine } from '../engine/validation.engine';
import { YahooProvider } from './yahoo.provider';

export class CoinGeckoProvider implements IMarketProvider {
  readonly name = 'CoinGecko';
  private yahooFallback = new YahooProvider();

  async fetchQuote(symbol: string): Promise<MarketPriceItem | null> {
    try {
      const cleanSym = symbol.replace('-INR', '').replace('-USD', '').toLowerCase();
      let coinId = 'bitcoin';
      if (cleanSym === 'eth' || cleanSym === 'ethereum') coinId = 'ethereum';
      if (cleanSym === 'sol' || cleanSym === 'solana') coinId = 'solana';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=inr&include_24hr_change=true`,
        { signal: controller.signal, next: { revalidate: 30 } }
      ).finally(() => clearTimeout(timeoutId)).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        const itemData = data?.[coinId];
        if (itemData && itemData.inr) {
          const price = itemData.inr;
          const changePercent = itemData.inr_24h_change || 0;
          const prevClose = price / (1 + changePercent / 100);

          const payload: MarketPriceItem = {
            symbol,
            price: Math.round(price * 100) / 100,
            previousClose: Math.round(prevClose * 100) / 100,
            change: Math.round((price - prevClose) * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            currency: 'INR',
            timestamp: new Date().toISOString(),
            source: 'CoinGecko',
            provider: 'CoinGecko',
          };

          if (ValidationEngine.validate(payload).isValid) return payload;
        }
      }

      // Fallback to Yahoo if CoinGecko rate-limited
      return await this.yahooFallback.fetchQuote(symbol);
    } catch (err) {
      return await this.yahooFallback.fetchQuote(symbol);
    }
  }

  async fetchBatch(symbols: string[]): Promise<Record<string, MarketPriceItem>> {
    const results: Record<string, MarketPriceItem> = {};
    const promises = symbols.map(s =>
      this.fetchQuote(s).then(item => {
        if (item) results[s] = item;
      })
    );
    await Promise.allSettled(promises);
    return results;
  }
}
