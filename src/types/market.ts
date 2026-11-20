export type PriceSourceType = 'Yahoo' | 'MFAPI' | 'CoinGecko' | 'Spot' | 'Calculated' | 'Cached';

export type ProviderHealthStatus = 'Healthy' | 'Slow' | 'Offline';

export interface MarketPriceItem {
  symbol: string;
  price: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  currency: string;
  timestamp: string;
  source: PriceSourceType;
  provider?: string;
  confidence?: number; // 0 - 100
  cached?: boolean;
  cacheAgeMs?: number;
}

export type MarketPriceMap = Record<string, MarketPriceItem>;

export type SyncStatusType = 'live' | 'refreshing' | 'offline' | 'cached';

export interface SyncStatus {
  status: SyncStatusType;
  lastUpdated: Date | null;
  error?: string | null;
  retryCount: number;
  confidence?: number;
  providerHealth?: Record<string, ProviderHealthStatus>;
}

export interface MarketTickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'index' | 'metal' | 'crypto' | 'equity';
}
