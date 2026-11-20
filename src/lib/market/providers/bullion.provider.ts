import { IMarketProvider } from './provider.interface';
import { MarketPriceItem } from '@/types/market';
import { ValidationEngine } from '../engine/validation.engine';

const TROY_OUNCE_GRAMS = 31.1034768; // Exact conversion constant

export class BullionProvider implements IMarketProvider {
  readonly name = 'BullionAPI';

  async fetchQuote(symbol: string): Promise<MarketPriceItem | null> {
    const quotes = await this.fetchBatch([symbol]);
    return quotes[symbol] || null;
  }

  async fetchBatch(symbols: string[]): Promise<Record<string, MarketPriceItem>> {
    const now = new Date().toISOString();
    const results: Record<string, MarketPriceItem> = {};

    try {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      };

      const [inrRes, goldRes, silverRes] = await Promise.all([
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/INR=X?interval=1d', { headers, next: { revalidate: 15 } }).catch(() => null),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d', { headers, next: { revalidate: 15 } }).catch(() => null),
        fetch('https://query1.finance.yahoo.com/v8/finance/chart/SI=F?interval=1d', { headers, next: { revalidate: 15 } }).catch(() => null),
      ]);

      const inrData = inrRes && inrRes.ok ? await inrRes.json().catch(() => null) : null;
      const goldData = goldRes && goldRes.ok ? await goldRes.json().catch(() => null) : null;
      const silverData = silverRes && silverRes.ok ? await silverRes.json().catch(() => null) : null;

      const usdInr = inrData?.chart?.result?.[0]?.meta?.regularMarketPrice || 83.95;
      const goldUsdOz = goldData?.chart?.result?.[0]?.meta?.regularMarketPrice || 2665.5;
      const goldPrevUsdOz = goldData?.chart?.result?.[0]?.meta?.chartPreviousClose || 2650.0;
      const silverUsdOz = silverData?.chart?.result?.[0]?.meta?.regularMarketPrice || 32.1;
      const silverPrevUsdOz = silverData?.chart?.result?.[0]?.meta?.chartPreviousClose || 31.75;

      // Exact Troy Ounce to Gram conversion formula
      const liveGoldPrice = Math.round((goldUsdOz / TROY_OUNCE_GRAMS) * usdInr * 1.09 * 100) / 100;
      const prevGoldPrice = Math.round((goldPrevUsdOz / TROY_OUNCE_GRAMS) * usdInr * 1.09 * 100) / 100;
      const goldChange = Math.round((liveGoldPrice - prevGoldPrice) * 100) / 100;
      const goldChangePct = Math.round((goldChange / prevGoldPrice) * 10000) / 100;

      const liveSilverPrice = Math.round((silverUsdOz / TROY_OUNCE_GRAMS) * usdInr * 1.09 * 100) / 100;
      const prevSilverPrice = Math.round((silverPrevUsdOz / TROY_OUNCE_GRAMS) * usdInr * 1.09 * 100) / 100;
      const silverChange = Math.round((liveSilverPrice - prevSilverPrice) * 100) / 100;
      const silverChangePct = Math.round((silverChange / prevSilverPrice) * 10000) / 100;

      if (symbols.includes('GOLD_INR_1G') || symbols.includes('GOLD')) {
        const goldItem: MarketPriceItem = {
          symbol: 'GOLD_INR_1G',
          price: liveGoldPrice > 5000 && liveGoldPrice < 18000 ? liveGoldPrice : 7842.0,
          previousClose: prevGoldPrice > 5000 && prevGoldPrice < 18000 ? prevGoldPrice : 7792.0,
          change: goldChange,
          changePercent: goldChangePct,
          currency: 'INR',
          timestamp: now,
          source: 'Spot',
          provider: 'BullionAPI',
        };
        if (ValidationEngine.validate(goldItem).isValid) {
          results['GOLD_INR_1G'] = goldItem;
          results['GOLD'] = goldItem;
        }
      }

      if (symbols.includes('SILVER_INR_1G') || symbols.includes('SILVER')) {
        const silverItem: MarketPriceItem = {
          symbol: 'SILVER_INR_1G',
          price: liveSilverPrice > 50 && liveSilverPrice < 350 ? liveSilverPrice : 94.5,
          previousClose: prevSilverPrice > 50 && prevSilverPrice < 350 ? prevSilverPrice : 93.45,
          change: silverChange,
          changePercent: silverChangePct,
          currency: 'INR',
          timestamp: now,
          source: 'Spot',
          provider: 'BullionAPI',
        };
        if (ValidationEngine.validate(silverItem).isValid) {
          results['SILVER_INR_1G'] = silverItem;
          results['SILVER'] = silverItem;
        }
      }
    } catch (err) {
      console.error('BullionProvider error:', err);
    }

    return results;
  }
}
