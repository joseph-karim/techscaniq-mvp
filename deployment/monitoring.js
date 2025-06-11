import { createClient } from '@supabase/supabase-js'
import Redis from 'ioredis'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
})

// Production monitoring and alerting
export class ProductionMonitor {
  private checkInterval: NodeJS.Timeout | null = null
  private alerts: { type: string; message: string; timestamp: Date }[] = []

  start() {
    console.log('🔍 Starting production monitoring...')
    
    // Check every 60 seconds
    this.checkInterval = setInterval(() => {
      this.performHealthChecks()
    }, 60000)
    
    // Initial check
    this.performHealthChecks()
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async performHealthChecks() {
    const checks = [
      this.checkQueueHealth(),
      this.checkWorkerStatus(),
      this.checkDatabaseHealth(),
      this.checkApiQuotas(),
      this.checkRecentErrors()
    ]

    const results = await Promise.allSettled(checks)
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.alert('health_check_failed', `Health check ${index} failed: ${result.reason}`)
      }
    })
  }

  private async checkQueueHealth() {
    try {
      // Check queue lengths
      const queueLengths = await Promise.all([
        redis.llen('bull:rich-iterative-research:waiting'),
        redis.llen('bull:rich-iterative-research:active'),
        redis.llen('bull:rich-iterative-research:failed')
      ])

      const [waiting, active, failed] = queueLengths
      
      // Alert on high queue lengths
      if (waiting > 50) {
        this.alert('queue_backlog', `High queue backlog: ${waiting} jobs waiting`)
      }
      
      if (failed > 10) {
        this.alert('queue_failures', `High failure rate: ${failed} failed jobs`)
      }
      
      if (active === 0 && waiting > 0) {
        this.alert('worker_stalled', 'Jobs waiting but no active workers')
      }

      return { waiting, active, failed, healthy: waiting < 50 && failed < 10 }
    } catch (error) {
      throw new Error(`Queue health check failed: ${error}`)
    }
  }

  private async checkWorkerStatus() {
    try {
      // Check recent job completions
      const recentJobs = await redis.zrangebyscore(
        'bull:rich-iterative-research:completed',
        Date.now() - 300000, // Last 5 minutes
        Date.now()
      )

      const completionRate = recentJobs.length / 5 // jobs per minute

      if (completionRate < 0.1 && recentJobs.length === 0) {
        this.alert('worker_inactive', 'No jobs completed in last 5 minutes')
      }

      return { recentCompletions: recentJobs.length, rate: completionRate }
    } catch (error) {
      throw new Error(`Worker status check failed: ${error}`)
    }
  }

  private async checkDatabaseHealth() {
    try {
      // Test database connectivity and performance
      const start = Date.now()
      const { data, error } = await supabase
        .from('scan_requests')
        .select('id')
        .limit(1)
      
      const responseTime = Date.now() - start

      if (error) throw error
      
      if (responseTime > 5000) {
        this.alert('database_slow', `Database response time: ${responseTime}ms`)
      }

      return { responseTime, healthy: responseTime < 5000 }
    } catch (error) {
      throw new Error(`Database health check failed: ${error}`)
    }
  }

  private async checkApiQuotas() {
    try {
      // Check Anthropic API usage (would need API call to get real limits)
      // For now, estimate based on recent activity
      
      const { data: recentReports } = await supabase
        .from('reports')
        .select('id, created_at')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .eq('ai_model_used', 'claude-3.5-sonnet + automated-tools')
      
      const hourlyApiCalls = (recentReports?.length || 0) * 15 // Estimate 15 calls per report
      
      if (hourlyApiCalls > 800) { // 80% of typical limit
        this.alert('api_quota_high', `High API usage: ~${hourlyApiCalls} calls/hour`)
      }

      return { estimatedHourlyApiCalls: hourlyApiCalls }
    } catch (error) {
      throw new Error(`API quota check failed: ${error}`)
    }
  }

  private async checkRecentErrors() {
    try {
      // Check for scan requests that failed in last hour
      const { data: failedScans } = await supabase
        .from('scan_requests')
        .select('id, error_message, updated_at')
        .eq('status', 'failed')
        .gte('updated_at', new Date(Date.now() - 3600000).toISOString())
      
      if (failedScans && failedScans.length > 5) {
        this.alert('high_error_rate', `${failedScans.length} scan failures in last hour`)
      }

      return { recentFailures: failedScans?.length || 0 }
    } catch (error) {
      throw new Error(`Error rate check failed: ${error}`)
    }
  }

  private alert(type: string, message: string) {
    const alert = {
      type,
      message,
      timestamp: new Date()
    }
    
    this.alerts.push(alert)
    console.error(`🚨 ALERT [${type}]: ${message}`)
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
    
    // In production, would send to Slack/email/PagerDuty
    this.sendAlert(alert)
  }

  private async sendAlert(alert: { type: string; message: string; timestamp: Date }) {
    // Production implementation would integrate with:
    // - Slack webhook
    // - Email service
    // - PagerDuty
    // - Discord webhook
    
    console.log(`Alert would be sent: ${JSON.stringify(alert)}`)
    
    // Example Slack integration:
    /*
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 TechScanIQ Alert`,
            attachments: [{
              color: alert.type.includes('error') || alert.type.includes('failed') ? 'danger' : 'warning',
              fields: [
                { title: 'Type', value: alert.type, short: true },
                { title: 'Message', value: alert.message, short: false },
                { title: 'Time', value: alert.timestamp.toISOString(), short: true }
              ]
            }]
          })
        })
      } catch (error) {
        console.error('Failed to send Slack alert:', error)
      }
    }
    */
  }

  getRecentAlerts(limit = 20) {
    return this.alerts.slice(-limit).reverse()
  }

  getHealthSummary() {
    return {
      alertCount: this.alerts.length,
      recentAlerts: this.getRecentAlerts(5),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date()
    }
  }
}

// Usage
if (process.env.NODE_ENV === 'production') {
  const monitor = new ProductionMonitor()
  monitor.start()
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Shutting down monitoring...')
    monitor.stop()
    process.exit(0)
  })
  
  // Health endpoint for load balancer
  if (process.env.MONITORING_PORT) {
    const express = require('express')
    const app = express()
    
    app.get('/health', (req, res) => {
      const health = monitor.getHealthSummary()
      const isHealthy = health.alertCount < 10 && health.recentAlerts.length < 3
      
      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'degraded',
        ...health
      })
    })
    
    app.listen(process.env.MONITORING_PORT, () => {
      console.log(`Health monitoring on port ${process.env.MONITORING_PORT}`)
    })
  }
}