"use client";

import { useEffect } from 'react';
import { useMarketPriceContext } from '@/context/MarketPriceProvider';
import { MarketPriceMap, SyncStatus } from '@/types/market';

export function useMarketPrices(symbols?: string[]): {
  prices: MarketPriceMap;
  status: SyncStatus;
  refreshPrices: () => Promise<void>;
} {
  const { prices, status, refreshPrices, registerSymbols } = useMarketPriceContext();

  useEffect(() => {
    if (symbols && symbols.length > 0) {
      registerSymbols(symbols);
    }
  }, [symbols, registerSymbols]);

  return { prices, status, refreshPrices };
}
