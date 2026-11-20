export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface ProviderCircuitState {
  state: CircuitState;
  failureCount: number;
  lastFailureTimestamp: number;
  cooldownMs: number;
  maxFailures: number;
}

export class CircuitBreaker {
  private circuits: Map<string, ProviderCircuitState> = new Map();

  private getCircuit(providerName: string): ProviderCircuitState {
    if (!this.circuits.has(providerName)) {
      this.circuits.set(providerName, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTimestamp: 0,
        cooldownMs: 60000, // 60s cooldown as specified
        maxFailures: 3,     // 3 consecutive failures threshold
      });
    }
    return this.circuits.get(providerName)!;
  }

  isOpen(providerName: string): boolean {
    const circuit = this.getCircuit(providerName);
    const now = Date.now();

    if (circuit.state === 'OPEN') {
      if (now - circuit.lastFailureTimestamp > circuit.cooldownMs) {
        circuit.state = 'HALF_OPEN';
        return false; // Test request allowed
      }
      return true; // Circuit open, bypass provider
    }
    return false;
  }

  recordSuccess(providerName: string): void {
    const circuit = this.getCircuit(providerName);
    circuit.failureCount = 0;
    circuit.state = 'CLOSED';
  }

  recordFailure(providerName: string): void {
    const circuit = this.getCircuit(providerName);
    circuit.failureCount++;
    circuit.lastFailureTimestamp = Date.now();

    if (circuit.failureCount >= circuit.maxFailures) {
      circuit.state = 'OPEN';
      console.warn(`[CIRCUIT_BREAKER] Provider ${providerName} triaged to OPEN state for 60s cooldown`);
    }
  }

  getStatus(providerName: string): { state: CircuitState; failures: number } {
    const circuit = this.getCircuit(providerName);
    return { state: circuit.state, failures: circuit.failureCount };
  }
}

export const circuitBreaker = new CircuitBreaker();
