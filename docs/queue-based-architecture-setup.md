# Queue-Based Architecture Setup Guide

## Overview

This new architecture replaces edge functions with background workers for long-running tasks, allowing:
- ✅ 30+ minute evidence collection
- ✅ 200+ evidence items per scan
- ✅ Fault tolerance and retries
- ✅ Real-time progress tracking
- ✅ PE-grade reliability

## Architecture

```
Frontend → API Server → Redis Queue → Workers → Database
                            ↓
                     Progress Updates
                            ↓
                      Real-time UI
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install bullmq ioredis express cors
npm install --save-dev @types/express @types/cors
```

### 2. Install Redis

#### Option A: Docker (Recommended)
```bash
docker run -d -p 6379:6379 --name techscaniq-redis redis:7-alpine
```

#### Option B: Homebrew (macOS)
```bash
brew install redis
brew services start redis
```

#### Option C: Redis Cloud (Production)
- Sign up at https://redis.com/try-free/
- Create a free database
- Get connection string

### 3. Environment Variables

Add to `.env`:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
# For Redis Cloud:
# REDIS_URL=redis://username:password@host:port

# API Server
API_PORT=3001

# Existing Supabase config
VITE_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Start Services

#### Terminal 1: Redis (if using local)
```bash
redis-server
```

#### Terminal 2: API Server
```bash
npm run api:server
# or
npx tsx src/api/server.ts
```

#### Terminal 3: Evidence Collection Worker
```bash
npm run worker:evidence
# or
npx tsx src/workers/evidence-collection-worker.ts
```

#### Terminal 4: Report Generation Worker
```bash
npm run worker:report
# or
npx tsx src/workers/report-generation-worker.ts
```

### 5. Update package.json Scripts

Add to package.json:
```json
{
  "scripts": {
    "api:server": "tsx src/api/server.ts",
    "worker:evidence": "tsx src/workers/evidence-collection-worker.ts",
    "worker:report": "tsx src/workers/report-generation-worker.ts",
    "workers:all": "concurrently \"npm run worker:evidence\" \"npm run worker:report\"",
    "dev:api": "concurrently \"npm run api:server\" \"npm run workers:all\""
  }
}
```

Install concurrently:
```bash
npm install --save-dev concurrently
```

## Usage

### Creating a Scan via API

```bash
curl -X POST http://localhost:3001/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Mixpanel",
    "website_url": "https://mixpanel.com",
    "primary_criteria": "digital-transformation",
    "requestor_name": "Test User",
    "organization_name": "Test PE Firm"
  }'
```

Response:
```json
{
  "success": true,
  "scanRequestId": "uuid",
  "jobs": {
    "evidenceJobId": "1",
    "reportJobId": "2"
  }
}
```

### Checking Scan Status

```bash
curl http://localhost:3001/api/scans/{scanRequestId}/status
```

Response shows real-time progress:
```json
{
  "scanRequest": {
    "id": "uuid",
    "company": "Mixpanel",
    "status": "processing"
  },
  "progress": {
    "evidenceCollection": {
      "status": "active",
      "progress": 65,
      "itemsCollected": 127
    },
    "reportGeneration": {
      "status": "waiting",
      "progress": 0
    }
  }
}
```

## Frontend Integration

### Update Request Scan Page

Replace edge function call with API call:

```typescript
// OLD: Edge function
const { data, error } = await supabase.functions.invoke('report-orchestrator-v3', {
  body: { scan_request_id: scanRequest.id }
})

// NEW: Queue-based API
const response = await fetch(`${API_URL}/api/scans`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company_name: formData.companyName,
    website_url: formData.websiteUrl,
    // ... other fields
  })
})

const { scanRequestId, jobs } = await response.json()

// Redirect to progress page
navigate(`/scans/${scanRequestId}/progress`)
```

### Add Progress Monitoring Page

Create a new page to show real-time progress:

```typescript
// src/pages/scans/scan-progress.tsx
function ScanProgress() {
  const { id } = useParams()
  const [status, setStatus] = useState(null)
  
  useEffect(() => {
    // Poll for updates every 2 seconds
    const interval = setInterval(async () => {
      const res = await fetch(`${API_URL}/api/scans/${id}/status`)
      const data = await res.json()
      setStatus(data)
      
      // Stop polling when complete
      if (data.progress.reportGeneration.status === 'completed') {
        clearInterval(interval)
        // Redirect to report
        navigate(`/reports/${data.progress.reportGeneration.reportId}`)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [id])
  
  return (
    <div>
      <h2>Analyzing {status?.scanRequest.company}</h2>
      
      <div>
        <h3>Evidence Collection</h3>
        <Progress value={status?.progress.evidenceCollection.progress} />
        <p>{status?.progress.evidenceCollection.itemsCollected} items collected</p>
      </div>
      
      <div>
        <h3>Report Generation</h3>
        <Progress value={status?.progress.reportGeneration.progress} />
      </div>
    </div>
  )
}
```

## Monitoring

### BullMQ Dashboard (Optional)

Install Bull Board for visual queue monitoring:

```bash
npm install @bull-board/express @bull-board/api
```

Add to API server:
```typescript
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath('/admin/queues')

createBullBoard({
  queues: [
    new BullMQAdapter(evidenceCollectionQueue),
    new BullMQAdapter(reportGenerationQueue),
  ],
  serverAdapter,
})

app.use('/admin/queues', serverAdapter.getRouter())
```

Access at: http://localhost:3001/admin/queues

## Production Deployment

### Redis Options
1. **Redis Cloud**: Managed Redis with free tier
2. **AWS ElastiCache**: For AWS deployments
3. **Upstash**: Serverless Redis (pay per request)

### Worker Deployment Options
1. **Railway**: Easy worker deployment with Redis
2. **Render**: Background workers with auto-scaling
3. **Fly.io**: Global workers near your users
4. **AWS ECS/Fargate**: For enterprise deployments

### Example Railway Deployment

1. Create `railway.json`:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "always"
  }
}
```

2. Create services:
```bash
railway login
railway init
railway add
# Select Redis
railway add
# Add service for each worker
railway up
```

## Advantages Over Edge Functions

1. **No Timeouts**: Workers can run for hours if needed
2. **Better Monitoring**: See exactly where jobs fail
3. **Retry Logic**: Automatic retries with exponential backoff
4. **Progress Tracking**: Real-time updates to UI
5. **Cost Effective**: Only pay for actual processing time
6. **Scalable**: Add more workers as needed
7. **Fault Tolerant**: Survives crashes and restarts

## Next Steps

1. Test with Mixpanel again - should collect 200+ evidence items
2. Add more sophisticated evidence collection tools
3. Implement real AI integration (not simulated)
4. Add admin dashboard for queue monitoring
5. Deploy to production with proper Redis instance

This architecture is what PE firms actually use for due diligence systems.