"use client";

import React from 'react';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { fmtINR } from '@/utils/currency';
import { fmtPct, getGainBadgeClass } from '@/utils/percentage';
import { TrendingUp, TrendingDown, Sparkles, Activity } from 'lucide-react';
import { MarketHoursDetector } from '@/lib/market/engine/market.hours';

const TICKER_ITEMS = [
  { symbol: 'NIFTY 50', key: '^NSEI', name: 'NIFTY 50', defaultPrice: 24320.5, defaultChange: 142.3, defaultPct: 0.59 },
  { symbol: 'SENSEX', key: '^BSESN', name: 'SENSEX', defaultPrice: 79840.2, defaultChange: 420.1, defaultPct: 0.53 },
  { symbol: 'BANK NIFTY', key: '^NSEBANK', name: 'BANK NIFTY', defaultPrice: 52140.0, defaultChange: -85.4, defaultPct: -0.16 },
  { symbol: 'GOLD 24K', key: 'GOLD_INR_1G', name: 'Gold 24K (1g)', defaultPrice: 7842.0, defaultChange: 50.0, defaultPct: 0.64 },
  { symbol: 'SILVER 999', key: 'SILVER_INR_1G', name: 'Silver 999 (1g)', defaultPrice: 94.5, defaultChange: 1.05, defaultPct: 1.12 },
  { symbol: 'BITCOIN', key: 'BTC-INR', name: 'Bitcoin', defaultPrice: 5420000.0, defaultChange: 125000.0, defaultPct: 2.36 },
  { symbol: 'ETHEREUM', key: 'ETH-INR', name: 'Ethereum', defaultPrice: 248000.0, defaultChange: -3400.0, defaultPct: -1.35 },
];

export function LiveMarketTicker() {
  const tickerKeys = TICKER_ITEMS.map(i => i.key);
  const { prices } = useMarketPrices(tickerKeys);
  const marketHours = MarketHoursDetector.getNSEMarketStatus();

  return (
    <div className="w-full bg-white/60 dark:bg-[#06080E]/70 border-b border-slate-200/60 dark:border-white/[0.06] backdrop-blur-2xl overflow-hidden py-2 px-3 text-xs select-none shadow-xs">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[11px] tracking-wider uppercase">
          <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
          <span>MARKETS</span>
          <span className="hidden sm:inline-block text-[10px] text-slate-500 dark:text-slate-400 font-normal ml-1">
            • {marketHours.state}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {TICKER_ITEMS.map((item) => {
            const liveData = prices[item.key];
            const price = liveData ? liveData.price : item.defaultPrice;
            const change = liveData && liveData.change !== undefined ? liveData.change : item.defaultChange;
            const pct = liveData && liveData.changePercent !== undefined ? liveData.changePercent : item.defaultPct;
            const isPositive = change >= 0;
            const isCached = liveData?.cached;

            return (
              <div
                key={item.key}
                title={`${item.name} | ${liveData?.provider || 'Spot'} (${liveData?.confidence || 100}% confidence)`}
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.07] hover:border-amber-400/50 dark:hover:border-amber-400/40 transition-all duration-200 shrink-0 cursor-default shadow-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                <span className="font-mono text-slate-950 dark:text-slate-100 font-bold">₹{fmtINR(price)}</span>

                <span
                  className={`flex items-center gap-0.5 text-[11px] font-bold font-mono px-1.5 py-0.5 rounded-lg border ${getGainBadgeClass(
                    change
                  )}`}
                >
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 shrink-0 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 shrink-0 text-rose-500" />
                  )}
                  <span>{fmtPct(pct, true, 2)}</span>
                </span>

                {isCached && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    CACHED
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
