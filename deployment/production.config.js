// Production deployment configuration for rich research workers
module.exports = {
  apps: [
    {
      name: 'rich-research-worker',
      script: './src/workers/research-worker-rich-iterative.ts',
      interpreter: 'tsx',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || '6379',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
      },
      error_file: './logs/rich-research-error.log',
      out_file: './logs/rich-research-out.log',
      log_file: './logs/rich-research.log',
      time: true,
      max_memory_restart: '500M',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Performance monitoring
      pmx: true,
      source_map_support: true,
      
      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info'
      },
      
      env_staging: {
        NODE_ENV: 'staging', 
        LOG_LEVEL: 'debug'
      }
    },
    
    {
      name: 'evidence-collection-worker',
      script: './src/workers/evidence-collection-worker-deep.ts',
      interpreter: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || '6379'
      },
      error_file: './logs/evidence-worker-error.log',
      out_file: './logs/evidence-worker-out.log',
      max_memory_restart: '300M',
      restart_delay: 4000
    },
    
    {
      name: 'report-generation-worker',
      script: './src/workers/report-generation-worker-claude-orchestrated.ts',
      interpreter: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || '6379'
      },
      error_file: './logs/report-worker-error.log',
      out_file: './logs/report-worker-out.log',
      max_memory_restart: '400M',
      restart_delay: 4000
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server'],
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/techscaniq-mvp.git',
      path: '/var/www/techscaniq',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production'
    },
    
    staging: {
      user: 'deploy', 
      host: ['staging-server'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-repo/techscaniq-mvp.git',
      path: '/var/www/techscaniq-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
}