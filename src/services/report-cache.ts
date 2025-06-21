interface CachedReport {
  data: any;
  timestamp: number;
  ttl: number;
  source: 'api' | 'local' | 'fallback';
}

class ReportCacheService {
  private cache = new Map<string, CachedReport>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private hits = 0;
  private misses = 0;

  get(reportId: string): any | null {
    const cached = this.cache.get(reportId);
    if (!cached) {
      this.misses++;
      return null;
    }
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(reportId);
      this.misses++;
      return null;
    }
    
    this.hits++;
    return cached.data;
  }

  set(reportId: string, data: any, ttl = this.DEFAULT_TTL, source: 'api' | 'local' | 'fallback' = 'api'): void {
    this.cache.set(reportId, {
      data,
      timestamp: Date.now(),
      ttl,
      source
    });
  }

  invalidate(reportId: string): void {
    this.cache.delete(reportId);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { hits: number; misses: number; size: number; hitRate: number; entries: Array<{ id: string; source: string; age: number; ttl: number }> } {
    const entries = Array.from(this.cache.entries()).map(([id, cached]) => ({
      id,
      source: cached.source,
      age: Date.now() - cached.timestamp,
      ttl: cached.ttl
    }));

    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      entries
    };
  }
}

export const reportCache = new ReportCacheService();