import { MarketPriceItem } from '@/types/market';

export interface MarketLogEntry {
  requestId: string;
  requestedSymbol: string;
  normalizedSymbol: string;
  provider: string;
  price?: number;
  previousClose?: number;
  latencyMs: number;
  retryCount: number;
  confidence: number;
  cacheHit: boolean;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED' | 'CACHED';
  error?: string;
}

export class StructuredLogger {
  private logs: MarketLogEntry[] = [];
  private maxLogs = 200;

  log(entry: Omit<MarketLogEntry, 'timestamp'>): void {
    const fullEntry: MarketLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[MARKET_LOG] [${fullEntry.status}] ${fullEntry.normalizedSymbol} | Provider: ${fullEntry.provider} | Price: ₹${fullEntry.price || 0} | Latency: ${fullEntry.latencyMs}ms | Confidence: ${fullEntry.confidence}%`
      );
    }
  }

  getRecentLogs(limit = 50): MarketLogEntry[] {
    return this.logs.slice(0, limit);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const structuredLogger = new StructuredLogger();
