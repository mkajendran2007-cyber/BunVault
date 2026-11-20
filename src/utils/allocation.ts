import { Holding } from '@/types/holdings';
import { AllocationBreakdownItem } from '@/types/portfolio';

const CATEGORY_COLORS: Record<string, string> = {
  Equity: '#00E676',
  'Mutual Fund': '#3B82F6',
  Commodity: '#F4C542',
  Crypto: '#A855F7',
  Debt: '#06B6D4',
  Cash: '#64748B',
  IT: '#3B82F6',
  Banking: '#10B981',
  Bullion: '#F4C542',
  Energy: '#EF4444',
  Other: '#94A3B8',
};

export function calculateAssetAllocation(holdings: Holding[]): AllocationBreakdownItem[] {
  const totalsByCategory: Record<string, { value: number; count: number }> = {};
  let overallPortfolioValue = 0;

  holdings.forEach((h) => {
    const val = (h.currentValue || (h.qty * (h.currentPrice || h.buy_price))) || 0;
    overallPortfolioValue += val;
    const cat = h.type || 'Other';

    if (!totalsByCategory[cat]) {
      totalsByCategory[cat] = { value: 0, count: 0 };
    }
    totalsByCategory[cat].value += val;
    totalsByCategory[cat].count += 1;
  });

  return Object.entries(totalsByCategory)
    .map(([cat, data]) => ({
      category: cat,
      value: data.value,
      percentage: overallPortfolioValue > 0 ? (data.value / overallPortfolioValue) * 100 : 0,
      color: CATEGORY_COLORS[cat] || '#94A3B8',
      itemCount: data.count,
    }))
    .sort((a, b) => b.value - a.value);
}

export function calculateSectorAllocation(holdings: Holding[]): AllocationBreakdownItem[] {
  const totalsBySector: Record<string, { value: number; count: number }> = {};
  let overallPortfolioValue = 0;

  holdings.forEach((h) => {
    const val = (h.currentValue || (h.qty * (h.currentPrice || h.buy_price))) || 0;
    overallPortfolioValue += val;
    let sector = h.sector || 'Other';
    if (h.type === 'Commodity') sector = 'Precious Metals / Bullion';
    if (h.type === 'Crypto') sector = 'Digital Assets';
    if (h.type === 'Debt') sector = 'Fixed Income';

    if (!totalsBySector[sector]) {
      totalsBySector[sector] = { value: 0, count: 0 };
    }
    totalsBySector[sector].value += val;
    totalsBySector[sector].count += 1;
  });

  return Object.entries(totalsBySector)
    .map(([sector, data]) => ({
      category: sector,
      value: data.value,
      percentage: overallPortfolioValue > 0 ? (data.value / overallPortfolioValue) * 100 : 0,
      color: CATEGORY_COLORS[sector] || CATEGORY_COLORS['Other'],
      itemCount: data.count,
    }))
    .sort((a, b) => b.value - a.value);
}
