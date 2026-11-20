"use client";

import React from 'react';
import { SyncStatus } from '@/types/market';
import { RefreshCw, WifiOff, AlertTriangle, Activity } from 'lucide-react';
import { engine } from '@/lib/AudioEngine';
import { MarketHoursDetector } from '@/lib/market/engine/market.hours';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  onRefresh?: () => void;
  compact?: boolean;
}

export function SyncStatusBadge({ status, onRefresh, compact = false }: SyncStatusBadgeProps) {
  const marketHours = MarketHoursDetector.getNSEMarketStatus();

  const getTimeAgo = () => {
    if (!status.lastUpdated) return 'Just now';
    const seconds = Math.floor((Date.now() - status.lastUpdated.getTime()) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  const handleRefreshClick = () => {
    try {
      engine.playClick();
    } catch {}
    if (onRefresh) onRefresh();
  };

  const confidence = status.confidence || 100;

  return (
    <div className="flex items-center gap-2">
      {status.status === 'live' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold select-none shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>LIVE</span>
          <span className="text-[10px] opacity-75 font-mono ml-0.5">{confidence}%</span>
          {!compact && <span className="text-[10px] opacity-75 font-normal ml-0.5">• {getTimeAgo()}</span>}
        </div>
      )}

      {status.status === 'refreshing' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold select-none shadow-sm">
          <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
          <span>Syncing...</span>
        </div>
      )}

      {status.status === 'offline' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold select-none shadow-sm">
          <WifiOff className="h-3 w-3 text-rose-500" />
          <span>Offline</span>
        </div>
      )}

      {status.status === 'cached' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold select-none shadow-sm">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span>Cached</span>
          <span className="text-[10px] opacity-75 font-mono">{confidence}%</span>
        </div>
      )}

      {!compact && (
        <div className="hidden md:flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/50">
          <Activity className="h-3 w-3 text-indigo-500" />
          <span>{marketHours.state}</span>
        </div>
      )}

      {onRefresh && (
        <button
          onClick={handleRefreshClick}
          disabled={status.status === 'refreshing'}
          title="Manual Market Refresh"
          className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${status.status === 'refreshing' ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}
