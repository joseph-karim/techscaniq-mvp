# Render Deployment Guide for TechScanIQ LangGraph API

## Overview
This guide helps you deploy the TechScanIQ LangGraph API to Render.com with the correct configuration.

## Environment Variables Required

### 1. Database Configuration
Add these secret groups in Render Dashboard:

#### `supabase-config`
- `url`: Your Supabase project URL
- `anon_key`: Your Supabase anon key
- `service_role_key`: Your Supabase service role key

#### `redis-config`
- `url`: Redis connection URL (provided by Render Redis service)

### 2. AI Service Keys
#### `ai-keys`
- `anthropic_key`: Your Anthropic API key
- `openai_key`: Your OpenAI API key  
- `perplexity_key`: Your Perplexity API key (optional)
- `google_key`: Your Google API key

#### `langgraph-secrets`
- `api_key`: Your LangGraph Cloud API key (`[REDACTED]`)

## Render Configuration

### Service 1: API Server (Web Service)
- **Plan**: Standard ($25/month) - 2GB RAM, 1 CPU
- **Health Check**: `/api/health`
- **Build Command**: `cd techscaniq-v2 && npm install && npm run build`
- **Start Command**: `cd techscaniq-v2 && npm start`

### Service 2: Background Workers (Worker Service)  
- **Plan**: Pro ($85/month) - 4GB RAM, 2 CPU
- **Build Command**: `cd techscaniq-v2 && npm install && npm run build`
- **Start Command**: `cd techscaniq-v2 && npm run workers`

### Service 3: Redis Queue
- **Plan**: Starter ($7/month)
- Used for job queue management between API and workers

## Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Render
2. **Create Services**: Create the web service and worker service using the render.yaml blueprint
3. **Add Environment Variables**: Configure all the secret groups listed above
4. **Deploy**: Render will automatically build and deploy both services

## Environment Variable Setup in Render Dashboard

Instead of using the YAML configuration, you can manually add these environment variables in the Render dashboard:

### For Both Services (API + Workers):
```
NODE_ENV=production
LANGGRAPH_API_KEY=[REDACTED]
LANGCHAIN_TRACING_V2=true
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
LANGCHAIN_PROJECT=techscaniq-v2-production
SUPABASE_URL=[your-supabase-url]
SUPABASE_ANON_KEY=[your-supabase-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-supabase-service-role-key]
ANTHROPIC_API_KEY=[your-anthropic-key]
OPENAI_API_KEY=[your-openai-key]
PERPLEXITY_API_KEY=[your-perplexity-key]
GOOGLE_API_KEY=[your-google-key]
```

### Additional for API Service:
```
PORT=10000
```

### Additional for Worker Service:
```
REDIS_URL=[your-redis-url-from-render]
```

## Cost Breakdown
- **API Server (Standard)**: $25/month
- **Workers (Pro)**: $85/month  
- **Redis**: $7/month
- **Total**: $117/month

## Health Monitoring
The API server includes a health endpoint at `/api/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-20T...",
  "version": "2.0.0",
  "uptime": 12345
}
```

## Next Steps
1. Configure the environment variables in Render dashboard
2. Deploy the services
3. Test the health endpoint
4. Monitor logs for any deployment issues
5. Set up auto-deploy on git commits (already configured in render.yaml)