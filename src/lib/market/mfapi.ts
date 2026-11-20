import { MarketPriceItem } from '@/types/market';

export async function fetchMutualFundNav(schemeCode: string): Promise<MarketPriceItem | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, { next: { revalidate: 300 } }).catch(() => null);
    if (!res || !res.ok) return null;

    const data = await res.json().catch(() => null);
    if (data?.status === 'SUCCESS' && data?.data?.[0]) {
      const latestNav = parseFloat(data.data[0].nav);
      const prevNav = data.data[1] ? parseFloat(data.data[1].nav) : latestNav;
      const change = latestNav - prevNav;
      const changePercent = prevNav > 0 ? (change / prevNav) * 100 : 0;

      return {
        symbol: schemeCode,
        price: Math.round(latestNav * 100) / 100,
        previousClose: Math.round(prevNav * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        currency: 'INR',
        timestamp: new Date().toISOString(),
        source: 'MFAPI',
      };
    }
    return null;
  } catch (err) {
    console.error(`MFAPI fetch error for scheme ${schemeCode}:`, err);
    return null;
  }
}
