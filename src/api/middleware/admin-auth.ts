import { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role?: string
      }
    }
  }
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
)

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Check if user has admin role
    const userRole = user.user_metadata?.role || user.app_metadata?.role
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions. Admin role required.' })
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email!,
      role: userRole
    }

    next()
  } catch (error) {
    console.error('Admin auth middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}