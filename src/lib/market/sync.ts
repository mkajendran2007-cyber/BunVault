import { providerManager } from './engine/provider.manager';
import { MarketPriceMap } from '@/types/market';

export async function syncMarketPrices(symbols: string[]): Promise<MarketPriceMap> {
  return await providerManager.syncSymbols(symbols);
}
