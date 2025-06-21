/**
 * Pipeline monitoring and health tracking
 */

import { CircuitBreakerRegistry } from './circuit-breaker';

export interface PipelineMetrics {
  phase: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'degraded';
  evidenceCount?: number;
  errors: string[];
  retries: number;
  fallbacks: number;
}

export interface PipelineHealth {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  phases: Map<string, PipelineMetrics>;
  totalDuration: number;
  totalErrors: number;
  totalRetries: number;
  totalFallbacks: number;
  circuitBreakerStats: any;
}

export class PipelineMonitor {
  private static instance: PipelineMonitor;
  private phases: Map<string, PipelineMetrics> = new Map();
  private startTime: number = Date.now();

  static getInstance(): PipelineMonitor {
    if (!this.instance) {
      this.instance = new PipelineMonitor();
    }
    return this.instance;
  }

  startPhase(phaseName: string): void {
    this.phases.set(phaseName, {
      phase: phaseName,
      startTime: Date.now(),
      status: 'running',
      errors: [],
      retries: 0,
      fallbacks: 0,
    });
    console.log(`📊 Monitor: Started phase "${phaseName}"`);
  }

  endPhase(phaseName: string, status: 'completed' | 'failed' | 'degraded' = 'completed', evidenceCount?: number): void {
    const phase = this.phases.get(phaseName);
    if (!phase) return;

    phase.endTime = Date.now();
    phase.duration = phase.endTime - phase.startTime;
    phase.status = status;
    if (evidenceCount !== undefined) {
      phase.evidenceCount = evidenceCount;
    }

    console.log(`📊 Monitor: Phase "${phaseName}" ${status} in ${this.formatDuration(phase.duration)}`);
  }

  recordError(phaseName: string, error: string): void {
    const phase = this.phases.get(phaseName);
    if (phase) {
      phase.errors.push(error);
      console.log(`📊 Monitor: Error in phase "${phaseName}": ${error}`);
    }
  }

  recordRetry(phaseName: string): void {
    const phase = this.phases.get(phaseName);
    if (phase) {
      phase.retries++;
    }
  }

  recordFallback(phaseName: string): void {
    const phase = this.phases.get(phaseName);
    if (phase) {
      phase.fallbacks++;
    }
  }

  getHealth(): PipelineHealth {
    const totalDuration = Date.now() - this.startTime;
    let totalErrors = 0;
    let totalRetries = 0;
    let totalFallbacks = 0;
    let failedPhases = 0;
    let degradedPhases = 0;

    this.phases.forEach(phase => {
      totalErrors += phase.errors.length;
      totalRetries += phase.retries;
      totalFallbacks += phase.fallbacks;
      if (phase.status === 'failed') failedPhases++;
      if (phase.status === 'degraded') degradedPhases++;
    });

    // Determine overall status
    let overallStatus: PipelineHealth['overallStatus'] = 'healthy';
    if (failedPhases > 0 || totalErrors > 10) {
      overallStatus = 'critical';
    } else if (degradedPhases > 0 || totalRetries > 5 || totalFallbacks > 0) {
      overallStatus = 'degraded';
    }

    return {
      overallStatus,
      phases: new Map(this.phases),
      totalDuration,
      totalErrors,
      totalRetries,
      totalFallbacks,
      circuitBreakerStats: CircuitBreakerRegistry.getStats(),
    };
  }

  generateReport(): string {
    const health = this.getHealth();
    const lines = [
      '=== Pipeline Health Report ===',
      `Overall Status: ${health.overallStatus.toUpperCase()}`,
      `Total Duration: ${this.formatDuration(health.totalDuration)}`,
      `Total Errors: ${health.totalErrors}`,
      `Total Retries: ${health.totalRetries}`,
      `Total Fallbacks: ${health.totalFallbacks}`,
      '',
      '=== Phase Breakdown ===',
    ];

    health.phases.forEach((phase, name) => {
      lines.push(`\n${name}:`);
      lines.push(`  Status: ${phase.status}`);
      if (phase.duration) {
        lines.push(`  Duration: ${this.formatDuration(phase.duration)}`);
      }
      if (phase.evidenceCount !== undefined) {
        lines.push(`  Evidence: ${phase.evidenceCount} pieces`);
      }
      if (phase.errors.length > 0) {
        lines.push(`  Errors: ${phase.errors.length}`);
        phase.errors.slice(0, 3).forEach(err => {
          lines.push(`    - ${err.substring(0, 100)}...`);
        });
      }
      if (phase.retries > 0) {
        lines.push(`  Retries: ${phase.retries}`);
      }
      if (phase.fallbacks > 0) {
        lines.push(`  Fallbacks: ${phase.fallbacks}`);
      }
    });

    lines.push('\n=== Circuit Breakers ===');
    Object.entries(health.circuitBreakerStats).forEach(([name, stats]: [string, any]) => {
      lines.push(`${name}: ${stats.state} (failures: ${stats.failures})`);
    });

    lines.push('\n=== Recommendations ===');
    if (health.overallStatus === 'critical') {
      lines.push('⚠️ Critical issues detected. Consider:');
      lines.push('  - Checking API keys and service availability');
      lines.push('  - Reviewing error logs for root causes');
      lines.push('  - Verifying network connectivity');
    } else if (health.overallStatus === 'degraded') {
      lines.push('⚠️ Pipeline running in degraded mode. Consider:');
      lines.push('  - Monitoring for continued degradation');
      lines.push('  - Investigating retry patterns');
      lines.push('  - Checking rate limits');
    } else {
      lines.push('✅ Pipeline running smoothly');
    }

    return lines.join('\n');
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  reset(): void {
    this.phases.clear();
    this.startTime = Date.now();
  }
}