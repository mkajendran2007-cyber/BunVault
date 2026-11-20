import { IMarketProvider } from './provider.interface';
import { MarketPriceItem } from '@/types/market';
import { ValidationEngine } from '../engine/validation.engine';

export class YahooProvider implements IMarketProvider {
  readonly name = 'Yahoo';

  async fetchQuote(symbol: string): Promise<MarketPriceItem | null> {
    try {
      let querySym = symbol;
      if (symbol.endsWith('-USD')) {
        querySym = symbol.replace('-USD', '-INR');
      }

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(querySym)}?interval=1d`,
        { headers, signal: controller.signal, next: { revalidate: 15 } }
      ).finally(() => clearTimeout(timeoutId)).catch(() => null);

      if (!res || !res.ok) return null;

      const data = await res.json().catch(() => null);
      const meta = data?.chart?.result?.[0]?.meta;

      if (!meta || meta.regularMarketPrice === undefined) return null;

      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || price;
      const change = price - prevClose;
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
      const currency = meta.currency || 'INR';

      const payload: MarketPriceItem = {
        symbol,
        price: Math.round(price * 100) / 100,
        previousClose: Math.round(prevClose * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        currency,
        timestamp: new Date().toISOString(),
        source: 'Yahoo',
        provider: 'Yahoo',
      };

      if (!ValidationEngine.validate(payload).isValid) return null;
      return payload;
    } catch (err) {
      return null;
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
