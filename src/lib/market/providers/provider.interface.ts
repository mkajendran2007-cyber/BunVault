import { MarketPriceItem } from '@/types/market';

export interface IMarketProvider {
  readonly name: string;
  fetchQuote(symbol: string): Promise<MarketPriceItem | null>;
  fetchBatch(symbols: string[]): Promise<Record<string, MarketPriceItem>>;
}
