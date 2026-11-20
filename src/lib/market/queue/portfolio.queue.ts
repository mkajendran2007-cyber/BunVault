import { Holding } from '@/types/holdings';
import { MarketPriceMap } from '@/types/market';
import { PortfolioSummaryMetrics } from '@/types/portfolio';
import { computeHoldingMetrics, computePortfolioMetrics } from '../calculations';

export class PortfolioCalculationQueue {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private debounceMs = 80; // 80ms debouncing window for smooth 60 FPS renders

  enqueueRecalculation(
    holdings: Holding[],
    prices: MarketPriceMap,
    onCalculated: (result: { holdings: Holding[]; metrics: PortfolioSummaryMetrics }) => void
  ): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      try {
        const holdingsWithPrices = holdings.map((h) => computeHoldingMetrics(h, prices));
        const metrics = computePortfolioMetrics(holdingsWithPrices);
        onCalculated({ holdings: holdingsWithPrices, metrics });
      } catch (err) {
        console.error('[PORTFOLIO_QUEUE] Recalculation error:', err);
      }
    }, this.debounceMs);
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const portfolioCalculationQueue = new PortfolioCalculationQueue();
