import { MarketPriceItem } from '@/types/market';

interface CacheEntry {
  data: MarketPriceItem;
  timestamp: number;
}

const CACHE_TTL_MS = 25 * 1000; // 25 seconds TTL as specified

class MemoryCacheManager {
  private cache: Map<string, CacheEntry> = new Map();

  get(symbol: string): { item: MarketPriceItem | null; isStale: boolean } {
    const entry = this.cache.get(symbol);
    if (!entry) {
      return { item: null, isStale: true };
    }
    const isStale = Date.now() - entry.timestamp > CACHE_TTL_MS;
    return {
      item: {
        ...entry.data,
        cached: isStale,
        source: isStale ? 'Cached' : entry.data.source,
      },
      isStale,
    };
  }

  set(symbol: string, item: MarketPriceItem): void {
    this.cache.set(symbol, {
      data: item,
      timestamp: Date.now(),
    });
  }

  getAll(): Record<string, MarketPriceItem> {
    const result: Record<string, MarketPriceItem> = {};
    this.cache.forEach((entry, symbol) => {
      result[symbol] = entry.data;
    });
    return result;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const marketCache = new MemoryCacheManager();
