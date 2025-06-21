/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests to failing services
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  threshold?: number;
  timeout?: number;
  resetTimeout?: number;
  onStateChange?: (oldState: CircuitState, newState: CircuitState) => void;
}

export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: CircuitState = 'CLOSED';
  private successCount = 0;
  
  constructor(
    private readonly name: string,
    private readonly options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      threshold: 5,
      timeout: 60000, // 1 minute
      resetTimeout: 30000, // 30 seconds
      ...options
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout!) {
        this.transition('HALF_OPEN');
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      // Require multiple successes in HALF_OPEN before closing
      if (this.successCount >= 3) {
        this.transition('CLOSED');
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failures >= this.options.threshold!) {
      this.transition('OPEN');
      console.error(`Circuit breaker ${this.name} opened after ${this.failures} failures`);
    }
  }

  private transition(newState: CircuitState) {
    const oldState = this.state;
    this.state = newState;
    console.log(`Circuit breaker ${this.name}: ${oldState} -> ${newState}`);
    
    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount,
    };
  }

  reset() {
    this.failures = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.transition('CLOSED');
  }
}

/**
 * Global circuit breaker registry
 */
export class CircuitBreakerRegistry {
  private static breakers = new Map<string, CircuitBreaker>();

  static getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  static getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  static resetAll() {
    this.breakers.forEach(breaker => breaker.reset());
  }

  static getStats() {
    const stats: Record<string, any> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }
}