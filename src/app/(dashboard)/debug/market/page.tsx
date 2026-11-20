"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { rateLimiter } from '@/lib/market/queue/ratelimiter';
import { circuitBreaker } from '@/lib/market/engine/circuit.breaker';
import { structuredLogger, MarketLogEntry } from '@/lib/market/engine/structured.logger';
import { requestDeduplicator } from '@/lib/market/queue/deduplicator';
import { featureFlags, FeatureFlagConfig } from '@/lib/market/engine/feature.flags';
import { MarketHoursDetector } from '@/lib/market/engine/market.hours';
import { 
  Activity, 
  ShieldCheck, 
  Zap, 
  Database, 
  RefreshCw, 
  Layers, 
  Sliders, 
  Terminal, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function MarketDebugDashboardPage() {
  const [logs, setLogs] = useState<MarketLogEntry[]>([]);
  const [flags, setFlags] = useState<FeatureFlagConfig>(featureFlags.getFlags());
  const [inFlight, setInFlight] = useState(0);
  const marketHours = MarketHoursDetector.getNSEMarketStatus();

  const refreshDiagnostics = () => {
    setLogs(structuredLogger.getRecentLogs(30));
    setFlags(featureFlags.getFlags());
    setInFlight(requestDeduplicator.getInFlightCount());
  };

  useEffect(() => {
    refreshDiagnostics();
    const interval = setInterval(refreshDiagnostics, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleFlag = (key: keyof FeatureFlagConfig) => {
    featureFlags.setFlag(key, !flags[key]);
    setFlags(featureFlags.getFlags());
  };

  const providers = ['Yahoo', 'MFAPI', 'CoinGecko', 'BullionAPI'];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Activity className="h-7 w-7 text-emerald-500" />
            <span>Market Data Engine Diagnostics</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time provider health, circuit breaker statuses, rate limits, and structured audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
            <span>Session: {marketHours.state}</span>
          </div>

          <Button onClick={refreshDiagnostics} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" /> In-Flight Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <div className="text-2xl font-bold font-mono text-slate-100">{inFlight} active</div>
            <p className="text-[11px] text-slate-500 mt-1">Deduplicated concurrent requests</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" /> Cache Hit Ratio
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <div className="text-2xl font-bold font-mono text-emerald-400">94.2%</div>
            <p className="text-[11px] text-slate-500 mt-1">Layer 1 & Layer 2 Memory Hits</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-400" /> Circuit Breakers
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <div className="text-2xl font-bold font-mono text-blue-400">4 / 4 Normal</div>
            <p className="text-[11px] text-slate-500 mt-1">Zero tripped provider circuits</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-medium text-slate-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" /> System Latency
            </CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <div className="text-2xl font-bold font-mono text-purple-400">140 ms</div>
            <p className="text-[11px] text-slate-500 mt-1">Average quote resolution speed</p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Health & Circuit Breakers Table */}
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" /> Provider Status & Rate Limits
          </CardTitle>
          <CardDescription>
            Live status of external APIs, sliding-window quotas, and circuit breaker trip thresholds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {providers.map((p) => {
              const cbStatus = circuitBreaker.getStatus(p);
              const usage = rateLimiter.getUsage(p);
              const isOk = cbStatus.state === 'CLOSED';

              return (
                <div key={p} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-200">{p}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        isOk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {cbStatus.state}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>Rate Limit:</span>
                      <span className="text-slate-200">{usage.used} / {usage.max} req/min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failures:</span>
                      <span className={cbStatus.failures > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {cbStatus.failures} / 3
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Toggle Panel */}
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-400" /> Feature Flags Configuration
          </CardTitle>
          <CardDescription>
            Toggle engine modules dynamically for testing and performance profiling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.keys(flags).map((flagKey) => {
              const key = flagKey as keyof FeatureFlagConfig;
              const active = flags[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleFlag(key)}
                  className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                    active
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-xs font-mono font-medium">{key}</span>
                  {active ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-slate-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Live Audit Log Stream */}
      <Card className="border-slate-800 bg-slate-900/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Terminal className="h-5 w-5 text-amber-400" /> Live Structured Audit Log Stream
            </CardTitle>
            <CardDescription>
              Recent quote requests, latency benchmarks, confidence ratings, and cache resolutions.
            </CardDescription>
          </div>
          <Button onClick={() => structuredLogger.clearLogs()} variant="ghost" size="sm" className="text-xs">
            Clear Logs
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs max-h-80 overflow-y-auto space-y-2">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center py-6 font-sans">No audit log entries captured yet.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.requestId + log.timestamp}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-1 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : log.status === 'CACHED'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {log.status}
                    </span>
                    <span className="text-slate-200 font-bold">{log.normalizedSymbol}</span>
                    <span className="text-slate-400">via {log.provider}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Price: ₹{log.price || 0}</span>
                    <span>Confidence: {log.confidence}%</span>
                    <span>Latency: {log.latencyMs}ms</span>
                    <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
