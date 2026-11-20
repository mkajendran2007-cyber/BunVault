import { MarketPriceItem } from '@/types/market';

export class RequestDeduplicator {
  private inFlightMap: Map<string, Promise<MarketPriceItem | null>> = new Map();

  async deduplicate(
    symbol: string,
    fetcher: () => Promise<MarketPriceItem | null>
  ): Promise<MarketPriceItem | null> {
    if (this.inFlightMap.has(symbol)) {
      return this.inFlightMap.get(symbol)!;
    }

    const promise = fetcher().finally(() => {
      this.inFlightMap.delete(symbol);
    });

    this.inFlightMap.set(symbol, promise);
    return promise;
  }

  getInFlightCount(): number {
    return this.inFlightMap.size;
  }
}

export const requestDeduplicator = new RequestDeduplicator();
