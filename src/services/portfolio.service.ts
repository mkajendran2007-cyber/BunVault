import { Holding } from '@/types/holdings';
import { PortfolioAllocation, PortfolioSummaryMetrics } from '@/types/portfolio';
import { computePortfolioMetrics } from '@/lib/market/calculations';
import { calculateAssetAllocation, calculateSectorAllocation } from '@/utils/allocation';

export function getPortfolioSummary(holdings: Holding[]): PortfolioSummaryMetrics {
  return computePortfolioMetrics(holdings);
}

export function getPortfolioAllocations(holdings: Holding[]): PortfolioAllocation {
  return {
    byAssetType: calculateAssetAllocation(holdings),
    bySector: calculateSectorAllocation(holdings),
  };
}
