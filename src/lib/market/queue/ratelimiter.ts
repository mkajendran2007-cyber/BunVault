export interface RateLimiterQuotas {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private requestsMap: Map<string, number[]> = new Map();

  private quotas: Record<string, RateLimiterQuotas> = {
    Yahoo: { maxRequests: 60, windowMs: 60000 },
    CoinGecko: { maxRequests: 30, windowMs: 60000 },
    BullionAPI: { maxRequests: 20, windowMs: 60000 },
    MFAPI: { maxRequests: 30, windowMs: 60000 },
    default: { maxRequests: 40, windowMs: 60000 },
  };

  canExecute(providerName: string): boolean {
    const now = Date.now();
    const quota = this.quotas[providerName] || this.quotas.default;
    const timestamps = this.requestsMap.get(providerName) || [];

    // Filter timestamps within the current sliding window
    const validTimestamps = timestamps.filter((t) => now - t < quota.windowMs);
    this.requestsMap.set(providerName, validTimestamps);

    return validTimestamps.length < quota.maxRequests;
  }

  recordRequest(providerName: string): void {
    const timestamps = this.requestsMap.get(providerName) || [];
    timestamps.push(Date.now());
    this.requestsMap.set(providerName, timestamps);
  }

  getUsage(providerName: string): { used: number; max: number } {
    const quota = this.quotas[providerName] || this.quotas.default;
    const timestamps = this.requestsMap.get(providerName) || [];
    const now = Date.now();
    const valid = timestamps.filter((t) => now - t < quota.windowMs);
    return { used: valid.length, max: quota.maxRequests };
  }
}

export const rateLimiter = new RateLimiter();
