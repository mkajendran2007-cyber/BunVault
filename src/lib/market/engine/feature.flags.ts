export interface FeatureFlagConfig {
  ENABLE_PROVIDER_MANAGER: boolean;
  ENABLE_BATCH_REQUESTS: boolean;
  ENABLE_DEDUPLICATION: boolean;
  ENABLE_CIRCUIT_BREAKER: boolean;
  ENABLE_MARKET_HOURS: boolean;
  ENABLE_CONFIDENCE_ENGINE: boolean;
  ENABLE_DEBUG_PANEL: boolean;
}

export class FeatureFlags {
  private flags: FeatureFlagConfig = {
    ENABLE_PROVIDER_MANAGER: true,
    ENABLE_BATCH_REQUESTS: true,
    ENABLE_DEDUPLICATION: true,
    ENABLE_CIRCUIT_BREAKER: true,
    ENABLE_MARKET_HOURS: true,
    ENABLE_CONFIDENCE_ENGINE: true,
    ENABLE_DEBUG_PANEL: true,
  };

  isEnabled(flag: keyof FeatureFlagConfig): boolean {
    return this.flags[flag] ?? true;
  }

  setFlag(flag: keyof FeatureFlagConfig, value: boolean): void {
    this.flags[flag] = value;
  }

  getFlags(): FeatureFlagConfig {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlags();
