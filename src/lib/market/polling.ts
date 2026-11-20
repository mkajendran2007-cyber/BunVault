export interface PollingOptions {
  intervalMs?: number;
  maxRetries?: number;
  onPoll: () => Promise<void>;
  onStatusChange?: (status: 'live' | 'refreshing' | 'offline' | 'cached', error?: string) => void;
}

export class SmartPollingEngine {
  private intervalMs: number;
  private maxRetries: number;
  private onPoll: () => Promise<void>;
  private onStatusChange?: (status: 'live' | 'refreshing' | 'offline' | 'cached', error?: string) => void;

  private timerId: ReturnType<typeof setInterval> | null = null;
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;
  private retryCount = 0;
  private isDocumentVisible = true;
  private isOnline = true;

  constructor(options: PollingOptions) {
    this.intervalMs = options.intervalMs || 30000; // 30s as specified
    this.maxRetries = options.maxRetries || 5;
    this.onPoll = options.onPoll;
    this.onStatusChange = options.onStatusChange;

    if (typeof window !== 'undefined') {
      this.isDocumentVisible = !document.hidden;
      this.isOnline = navigator.onLine;
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }

    this.executePoll();
    this.timerId = setInterval(() => {
      if (this.isDocumentVisible && this.isOnline) {
        this.executePoll();
      }
    }, this.intervalMs);
  }

  stop(): void {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }

  async triggerManualSync(): Promise<void> {
    await this.executePoll(true);
  }

  private handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    this.isDocumentVisible = !document.hidden;
    if (this.isDocumentVisible && this.isRunning && this.isOnline) {
      this.executePoll();
    }
  };

  private handleOnline = () => {
    this.isOnline = true;
    this.onStatusChange?.('live');
    if (this.isRunning && this.isDocumentVisible) {
      this.executePoll();
    }
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.onStatusChange?.('offline', 'Network connection lost. Using cached prices.');
  };

  private async executePoll(isManual = false): Promise<void> {
    if (!this.isOnline) {
      this.onStatusChange?.('offline', 'Network connection lost. Using cached prices.');
      return;
    }

    this.onStatusChange?.('refreshing');

    try {
      await this.onPoll();
      this.retryCount = 0;
      this.onStatusChange?.('live');
    } catch (err: any) {
      console.error('Polling error:', err);
      if (this.retryCount < this.maxRetries) {
        const backoffMs = this.getBackoffDelay(this.retryCount);
        this.retryCount++;
        this.onStatusChange?.('cached', `API retry ${this.retryCount}/${this.maxRetries} in ${backoffMs / 1000}s`);

        if (this.retryTimeoutId) clearTimeout(this.retryTimeoutId);
        this.retryTimeoutId = setTimeout(() => {
          if (this.isRunning && this.isOnline) {
            this.executePoll();
          }
        }, backoffMs);
      } else {
        this.onStatusChange?.('cached', 'Using cached prices after max retries');
      }
    }
  }

  private getBackoffDelay(retry: number): number {
    // 1s, 2s, 5s, 10s backoff sequence
    const delays = [1000, 2000, 5000, 10000, 10000];
    return delays[Math.min(retry, delays.length - 1)];
  }
}
