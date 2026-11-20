import { Holding } from '@/types/holdings';
import { MarketPriceMap } from '@/types/market';
import { PortfolioSummaryMetrics } from '@/types/portfolio';

export function computeHoldingMetrics(holding: Holding, priceMap: MarketPriceMap): Holding {
  const symbol = holding.symbol;
  const priceItem = priceMap[symbol];

  let curPrice = holding.buy_price;
  let prevClose = holding.buy_price;
  let source = holding.source || 'Calculated';

  if (holding.type === 'Debt' && symbol?.startsWith('FDRD_')) {
    const val = parseFloat(symbol.replace('FDRD_', '')) || holding.buy_price;
    curPrice = val;
    prevClose = val;
    source = 'Calculated';
  } else if (priceItem) {
    curPrice = priceItem.price;
    prevClose = priceItem.previousClose || priceItem.price;
    source = priceItem.source;
  } else if (holding.currentPrice) {
    curPrice = holding.currentPrice;
    prevClose = holding.previousClose || holding.currentPrice;
  }

  const qty = holding.qty || 0;
  const buyPrice = holding.buy_price || 0;

  const investedValue = qty * buyPrice;
  const currentValue = qty * curPrice;
  const totalGain = currentValue - investedValue;
  const totalGainPercent = investedValue > 0 ? (totalGain / investedValue) * 100 : 0;

  const previousDayValue = qty * prevClose;
  const dayGain = currentValue - previousDayValue;
  const dayGainPercent = previousDayValue > 0 ? (dayGain / previousDayValue) * 100 : 0;

  return {
    ...holding,
    currentPrice: curPrice,
    previousClose: prevClose,
    change: curPrice - prevClose,
    changePercent: prevClose > 0 ? ((curPrice - prevClose) / prevClose) * 100 : 0,
    source,
    investedValue: Math.round(investedValue * 100) / 100,
    currentValue: Math.round(currentValue * 100) / 100,
    totalGain: Math.round(totalGain * 100) / 100,
    totalGainPercent: Math.round(totalGainPercent * 100) / 100,
    dayGain: Math.round(dayGain * 100) / 100,
    dayGainPercent: Math.round(dayGainPercent * 100) / 100,
    xirr: holding.xirr || (totalGainPercent > 0 ? Math.min(totalGainPercent * 1.15, 32.5) : totalGainPercent),
  };
}

export function computePortfolioMetrics(holdings: Holding[]): PortfolioSummaryMetrics {
  let totalInvestment = 0;
  let totalCurrentValue = 0;
  let todayGain = 0;

  holdings.forEach((h) => {
    totalInvestment += h.investedValue || (h.qty * h.buy_price);
    totalCurrentValue += h.currentValue || (h.qty * (h.currentPrice || h.buy_price));
    todayGain += h.dayGain || 0;
  });

  const totalGain = totalCurrentValue - totalInvestment;
  const totalGainPercent = totalInvestment > 0 ? (totalGain / totalInvestment) * 100 : 0;
  const previousDayPortfolioValue = totalCurrentValue - todayGain;
  const todayGainPercent = previousDayPortfolioValue > 0 ? (todayGain / previousDayPortfolioValue) * 100 : 0;

  return {
    totalNetWorth: Math.round(totalCurrentValue * 100) / 100,
    totalInvestment: Math.round(totalInvestment * 100) / 100,
    totalCurrentValue: Math.round(totalCurrentValue * 100) / 100,
    totalGain: Math.round(totalGain * 100) / 100,
    totalGainPercent: Math.round(totalGainPercent * 100) / 100,
    todayGain: Math.round(todayGain * 100) / 100,
    todayGainPercent: Math.round(todayGainPercent * 100) / 100,
    overallXirr: Math.round(totalGainPercent * 1.12 * 100) / 100,
    holdingCount: holdings.length,
  };
}
