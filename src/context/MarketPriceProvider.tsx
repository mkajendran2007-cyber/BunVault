"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { MarketPriceMap, SyncStatus, SyncStatusType } from '@/types/market';
import { syncMarketPrices } from '@/lib/market/sync';
import { SmartPollingEngine } from '@/lib/market/polling';

interface MarketPriceContextValue {
  prices: MarketPriceMap;
  status: SyncStatus;
  refreshPrices: () => Promise<void>;
  registerSymbols: (symbols: string[]) => void;
}

const MarketPriceContext = createContext<MarketPriceContextValue | null>(null);

const DEFAULT_SYMBOLS = [
  'NIFTY 50',
  '^NSEI',
  '^BSESN',
  '^NSEBANK',
  'GOLD_INR_1G',
  'SILVER_INR_1G',
  'BTC-INR',
  'ETH-INR',
  'RELIANCE.NS',
  '122639',
];

export function MarketPriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<MarketPriceMap>({});
  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set(DEFAULT_SYMBOLS));
  const [status, setStatus] = useState<SyncStatus>({
    status: 'live',
    lastUpdated: null,
    retryCount: 0,
  });

  const updateStatus = useCallback((statusType: SyncStatusType, error?: string) => {
    setStatus(prev => ({
      ...prev,
      status: statusType,
      error: error || null,
      lastUpdated: statusType === 'live' ? new Date() : prev.lastUpdated,
    }));
  }, []);

  const executeSync = useCallback(async () => {
    const symbolList = Array.from(subscribedSymbols);
    if (symbolList.length === 0) return;

    try {
      const updatedPrices = await syncMarketPrices(symbolList);
      setPrices(prev => ({ ...prev, ...updatedPrices }));
      updateStatus('live');
    } catch (err: any) {
      console.error('MarketPriceProvider sync error:', err);
      updateStatus('cached', 'Failed to update live market prices. Showing cached prices.');
    }
  }, [subscribedSymbols, updateStatus]);

  // Single Polling Engine Instance
  const pollingEngine = useMemo(() => {
    return new SmartPollingEngine({
      intervalMs: 30000,
      maxRetries: 5,
      onPoll: executeSync,
      onStatusChange: (s, err) => updateStatus(s, err),
    });
  }, [executeSync, updateStatus]);

  useEffect(() => {
    pollingEngine.start();
    return () => {
      pollingEngine.stop();
    };
  }, [pollingEngine]);

  const registerSymbols = useCallback((symbols: string[]) => {
    if (!symbols || symbols.length === 0) return;
    setSubscribedSymbols(prev => {
      const next = new Set(prev);
      let changed = false;
      symbols.forEach(s => {
        if (s && !next.has(s)) {
          next.add(s);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const refreshPrices = useCallback(async () => {
    await pollingEngine.triggerManualSync();
  }, [pollingEngine]);

  const contextValue = useMemo(() => ({
    prices,
    status,
    refreshPrices,
    registerSymbols,
  }), [prices, status, refreshPrices, registerSymbols]);

  return (
    <MarketPriceContext.Provider value={contextValue}>
      {children}
    </MarketPriceContext.Provider>
  );
}

export function useMarketPriceContext() {
  const ctx = useContext(MarketPriceContext);
  if (!ctx) {
    throw new Error('useMarketPriceContext must be used within a MarketPriceProvider');
  }
  return ctx;
}
