import express from 'express'
import cors from 'cors'
import { config } from 'dotenv'

// Load environment variables first
config()

// Import routes after env vars are loaded
import scanRoutes from './routes/scan-routes.js'

const app = express()
const PORT = process.env.API_PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

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