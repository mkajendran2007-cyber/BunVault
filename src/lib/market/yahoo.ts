import { MarketPriceItem } from '@/types/market';

export async function fetchYahooQuote(symbol: string): Promise<MarketPriceItem | null> {
  try {
    let querySym = symbol;
    let isCryptoUSD = symbol.endsWith('-USD');
    if (isCryptoUSD) {
      querySym = symbol.replace('-USD', '-INR');
    }

    let url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(querySym)}?interval=1d`;
    let res = await fetch(url, { next: { revalidate: 15 } }).catch(() => null);

    if (!res || !res.ok) {
      if (isCryptoUSD) {
        querySym = symbol;
        res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(querySym)}?interval=1d`).catch(() => null);
      }
    }

    if (!res || !res.ok) return null;

    const data = await res.json().catch(() => null);
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta || meta.regularMarketPrice === undefined) return null;

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || price;
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
    const currency = meta.currency || 'INR';

    return {
      symbol,
      price: Math.round(price * 100) / 100,
      previousClose: Math.round(prevClose * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      currency,
      timestamp: new Date().toISOString(),
      source: 'Yahoo',
    };
  } catch (err) {
    console.error(`Yahoo fetch error for ${symbol}:`, err);
    return null;
  }
}
