"use client";

import { useMemo, useState, useEffect } from 'react';
import { Holding } from '@/types/holdings';
import { PortfolioAllocation, PortfolioSummaryMetrics } from '@/types/portfolio';
import { useMarketPrices } from './useMarketPrices';
import { calculateAssetAllocation, calculateSectorAllocation } from '@/utils/allocation';
import { portfolioCalculationQueue } from '@/lib/market/queue/portfolio.queue';
import { computeHoldingMetrics, computePortfolioMetrics } from '@/lib/market/calculations';

export function usePortfolio(rawHoldings: Holding[]): {
  holdingsWithLivePrices: Holding[];
  metrics: PortfolioSummaryMetrics;
  allocations: PortfolioAllocation;
  syncStatus: any;
  refreshPrices: () => Promise<void>;
} {
  const symbols = useMemo(() => {
    return Array.from(
      new Set(
        rawHoldings
          .filter(h => !(h.type === 'Debt' && h.symbol?.startsWith('FDRD_')))
          .map(h => h.symbol)
          .filter(Boolean)
      )
    );
  }, [rawHoldings]);

  const { prices, status, refreshPrices } = useMarketPrices(symbols);

  // Initial fast calculation
  const initialHoldings = useMemo(() => {
    return rawHoldings.map(h => computeHoldingMetrics(h, prices));
  }, [rawHoldings, prices]);

  const initialMetrics = useMemo(() => {
    return computePortfolioMetrics(initialHoldings);
  }, [initialHoldings]);

  const [state, setState] = useState<{
    holdings: Holding[];
    metrics: PortfolioSummaryMetrics;
  }>({
    holdings: initialHoldings,
    metrics: initialMetrics,
  });

  // Debounced queue update
  useEffect(() => {
    portfolioCalculationQueue.enqueueRecalculation(rawHoldings, prices, (res) => {
      setState(res);
    });
    return () => {
      portfolioCalculationQueue.cancel();
    };
  }, [rawHoldings, prices]);

  const allocations = useMemo(() => {
    return {
      byAssetType: calculateAssetAllocation(state.holdings),
      bySector: calculateSectorAllocation(state.holdings),
    };
  }, [state.holdings]);

  return {
    holdingsWithLivePrices: state.holdings,
    metrics: state.metrics,
    allocations,
    syncStatus: status,
    refreshPrices,
  };
}
