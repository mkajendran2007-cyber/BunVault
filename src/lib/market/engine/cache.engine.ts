import { MarketPriceItem } from '@/types/market';
import { ValidationEngine } from './validation.engine';

interface CacheRecord {
  data: MarketPriceItem;
  timestamp: number;
  expiresAt: number;
}

const CACHE_TTL_MS = 25 * 1000; // Layer 1 TTL: 25 seconds

export class ThreeLayerCacheEngine {
  // Layer 1: High-Speed Memory Cache
  private memoryCache: Map<string, CacheRecord> = new Map();

  // Layer 3: Immutable Last Known Good Price Registry
  private lastKnownGoodPrices: Map<string, MarketPriceItem> = new Map();

  get(symbol: string): { item: MarketPriceItem | null; isStale: boolean; layer: 1 | 2 | 3 } {
    const now = Date.now();

    // --- Layer 1 Check (Memory Cache) ---
    const memoryRecord = this.memoryCache.get(symbol);
    if (memoryRecord) {
      const isStale = now > memoryRecord.expiresAt;
      return {
        item: {
          ...memoryRecord.data,
          cached: isStale,
          cacheAgeMs: now - memoryRecord.timestamp,
          source: isStale ? 'Cached' : memoryRecord.data.source,
        },
        isStale,
        layer: 1,
      };
    }

    // --- Layer 2 Check (Persistent Browser Storage) ---
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`bv_mkt_l2_${symbol}`);
        if (raw) {
          const parsed = JSON.parse(raw) as CacheRecord;
          if (ValidationEngine.validate(parsed.data).isValid) {
            const ageMs = now - parsed.timestamp;
            const isStale = now > parsed.expiresAt;

            // Populate Layer 1 Memory Cache
            this.memoryCache.set(symbol, parsed);
            this.lastKnownGoodPrices.set(symbol, parsed.data);

            return {
              item: {
                ...parsed.data,
                cached: true,
                cacheAgeMs: ageMs,
                source: 'Cached',
              },
              isStale,
              layer: 2,
            };
          }
        }
      } catch (_) {}
    }

    // --- Layer 3 Check (Immutable Last Known Good Price) ---
    const lastGood = this.lastKnownGoodPrices.get(symbol);
    if (lastGood && ValidationEngine.validate(lastGood).isValid) {
      return {
        item: {
          ...lastGood,
          cached: true,
          cacheAgeMs: 999999,
          source: 'Cached',
          confidence: 40,
        },
        isStale: true,
        layer: 3,
      };
    }

    return { item: null, isStale: true, layer: 1 };
  }

  set(symbol: string, item: MarketPriceItem): void {
    // STRICT ZERO-OVERWRITE GUARANTEE: Never overwrite cache with invalid data!
    const validation = ValidationEngine.validate(item);
    if (!validation.isValid) {
      console.warn(`[CACHE_ENGINE] Rejected invalid payload for ${symbol}: ${validation.reason}`);
      return;
    }

    const now = Date.now();
    const record: CacheRecord = {
      data: item,
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS,
    };

    // Update Layer 1
    this.memoryCache.set(symbol, record);

    // Update Layer 3 (Immutable Last Known Good Price)
    this.lastKnownGoodPrices.set(symbol, item);

    // Update Layer 2 (Persistent Storage)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`bv_mkt_l2_${symbol}`, JSON.stringify(record));
      } catch (_) {}
    }
  }

  getAll(): Record<string, MarketPriceItem> {
    const result: Record<string, MarketPriceItem> = {};
    this.memoryCache.forEach((rec, sym) => {
      result[sym] = rec.data;
    });
    return result;
  }
}

export const marketCacheEngine = new ThreeLayerCacheEngine();
