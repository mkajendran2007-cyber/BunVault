import { MarketPriceItem } from '@/types/market';

export class ConfidenceEngine {
  static calculate(item: MarketPriceItem, isPrimaryProvider = true): number {
    let confidence = 100;

    // Deduct for non-primary provider
    if (!isPrimaryProvider) {
      confidence -= 10;
    }

    // Deduct for cache age
    if (item.cached) {
      const ageMs = item.cacheAgeMs || (item.timestamp ? Date.now() - new Date(item.timestamp).getTime() : 30000);
      if (ageMs > 120000) {
        confidence -= 60; // Old cache
      } else if (ageMs > 25000) {
        confidence -= 30; // Medium cache
      } else {
        confidence -= 15; // Fresh cache
      }
    }

    return Math.max(10, Math.min(100, Math.round(confidence)));
  }
}
