import { Holding } from './holdings';

export interface PortfolioSummaryMetrics {
  totalNetWorth: number;
  totalInvestment: number;
  totalCurrentValue: number;
  totalGain: number;
  totalGainPercent: number;
  todayGain: number;
  todayGainPercent: number;
  overallXirr: number;
  holdingCount: number;
}

export interface AllocationBreakdownItem {
  category: string;
  value: number;
  percentage: number;
  color: string;
  itemCount: number;
}

export interface PortfolioAllocation {
  byAssetType: AllocationBreakdownItem[];
  bySector: AllocationBreakdownItem[];
}
