import { PriceSourceType } from './market';

export type AssetType = 'Equity' | 'Mutual Fund' | 'Commodity' | 'Crypto' | 'Debt' | 'Cash' | string;

export interface Holding {
  id: string;
  name: string;
  symbol: string;
  type: AssetType;
  qty: number;
  buy_price: number;
  created_at: string;
  user_id?: string;
  sector?: string;
  currentPrice?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  source?: PriceSourceType;
  // Computed properties
  investedValue?: number;
  currentValue?: number;
  totalGain?: number;
  totalGainPercent?: number;
  dayGain?: number;
  dayGainPercent?: number;
  allocationPercent?: number;
  xirr?: number;
}

export interface HoldingTransaction {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  name: string;
  symbol: string;
  qty: number;
  price: number;
  total: number;
  status: 'Completed' | 'Pending' | 'Failed';
  gain?: string;
}
