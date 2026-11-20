import { fetchYahooQuote } from './yahoo';
import { MarketPriceItem } from '@/types/market';

export async function fetchCryptoPrice(symbol: string): Promise<MarketPriceItem | null> {
  const norm = symbol.endsWith('-INR') || symbol.endsWith('-USD') ? symbol : `${symbol}-INR`;
  const result = await fetchYahooQuote(norm);
  if (result) {
    return {
      ...result,
      source: 'Yahoo',
    };
  }
  return null;
}
