import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // per window

export function rateLimit(req: NextRequest): boolean {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  // Clean expired entries
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
  
  // Check current IP
  if (!store[ip]) {
    store[ip] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
    return false; // Not rate limited
  }
  
  if (store[ip].count >= MAX_REQUESTS) {
    return true; // Rate limited
  }
  
  store[ip].count++;
  return false;
}

export function rateLimitResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: 'Too many requests' }), 
    { 
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}