import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

// Load environment variables first
config()

// Import routes after env vars are loaded
import scanRoutes from './routes/scan-routes.js'

const app = express()
const PORT = process.env.API_PORT || 3001

// Rate limiting store
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 100 // requests per window

// Rate limiting middleware
const _rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip rate limiting for health checks
  if (req.path === '/api/health') {
    return next()
  }
  
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  
  // Clean expired entries
  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime < now) {
      requestCounts.delete(key)
    }
  }
  
  // Check current IP
  const ipData = requestCounts.get(ip)
  if (!ipData) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return next()
  }
  
  if (ipData.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({ error: 'Too many requests' })
  }
  
  ipData.count++
  next()
}

// Security headers middleware
const securityHeaders = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
}

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      process.env.FRONTEND_URL
    ].filter(Boolean)
    
    // Allow requests with no origin (e.g., mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// Middleware
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' })) // Limit request body size
// app.use(rateLimitMiddleware) // TODO: Fix middleware signature
app.use(securityHeaders)

// Routes
app.use(scanRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log(`Workers should be started separately`)
})

export default app