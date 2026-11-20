import { MarketPriceItem } from '@/types/market';

export class BatchRequestOptimizer {
  private queue: Set<string> = new Set();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private batchDelayMs = 50; // 50ms batching window

  async enqueueBatch(
    symbols: string[],
    batchFetcher: (uniqueSymbols: string[]) => Promise<Record<string, MarketPriceItem>>
  ): Promise<Record<string, MarketPriceItem>> {
    const unique = Array.from(new Set(symbols.filter(Boolean)));
    if (unique.length === 0) return {};

    return new Promise((resolve) => {
      unique.forEach((s) => this.queue.add(s));

      if (this.timer) clearTimeout(this.timer);

      this.timer = setTimeout(async () => {
        const batchSymbols = Array.from(this.queue);
        this.queue.clear();
        this.timer = null;

        try {
          const results = await batchFetcher(batchSymbols);
          resolve(results);
        } catch (err) {
          console.error('[BATCH_OPTIMIZER] Batch execution error:', err);
          resolve({});
        }
      }, this.batchDelayMs);
    });
  }

  getPendingQueueLength(): number {
    return this.queue.size;
  }
}

export const batchRequestOptimizer = new BatchRequestOptimizer();
