import { MarketPriceItem } from '@/types/market';

export interface TickSubscriber {
  (tick: MarketPriceItem): void;
}

class WebSocketPriceStream {
  private subscribers: Map<string, Set<TickSubscriber>> = new Map();
  private isConnected = false;

  subscribe(symbol: string, callback: TickSubscriber): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)!.add(callback);

    return () => {
      const subs = this.subscribers.get(symbol);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(symbol);
        }
      }
    };
  }

  // Future ready emit method when websocket backend is connected
  emit(symbol: string, priceData: MarketPriceItem): void {
    const subs = this.subscribers.get(symbol);
    if (subs) {
      subs.forEach(cb => cb(priceData));
    }
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export const webSocketStream = new WebSocketPriceStream();
