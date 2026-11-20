import { IMarketProvider } from './provider.interface';
import { MarketPriceItem } from '@/types/market';
import { ValidationEngine } from '../engine/validation.engine';

export class MFAPIProvider implements IMarketProvider {
  readonly name = 'MFAPI';

  async fetchQuote(schemeCode: string): Promise<MarketPriceItem | null> {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { next: { revalidate: 300 } }).catch(() => null);
      if (!res || !res.ok) return null;

      const data = await res.json().catch(() => null);
      if (data?.status === 'SUCCESS' && data?.data?.[0]) {
        const latestNav = parseFloat(data.data[0].nav);
        const prevNav = data.data[1] ? parseFloat(data.data[1].nav) : latestNav;
        const change = latestNav - prevNav;
        const changePercent = prevNav > 0 ? (change / prevNav) * 100 : 0;

        const payload: MarketPriceItem = {
          symbol: schemeCode,
          price: Math.round(latestNav * 100) / 100,
          previousClose: Math.round(prevNav * 100) / 100,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          currency: 'INR',
          timestamp: new Date().toISOString(),
          source: 'MFAPI',
          provider: 'MFAPI',
        };

        if (!ValidationEngine.validate(payload).isValid) return null;
        return payload;
      }
      return null;
    } catch (err) {
      console.error(`MFAPIProvider error for scheme ${schemeCode}:`, err);
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
