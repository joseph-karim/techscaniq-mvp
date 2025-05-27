# TechScanIQ MVP Setup Guide

## Prerequisites
- Node.js 18+ installed
- Docker Desktop running (for Supabase local development)
- Supabase CLI installed (`npm install -g supabase`)

## Step 1: Environment Setup

Create a `.env.local` file in the project root with:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Keys
VITE_GOOGLE_API_KEY=your-google-api-key-here
JINA_API_KEY=your-jina-api-key-here
```

⚠️ **SECURITY WARNING**: Never commit real API keys to version control. Always use placeholder values in documentation and ensure your `.env` files are properly gitignored.

## Step 2: Supabase Setup

### Option A: Local Development (Recommended for testing)

1. Start Supabase locally:
```bash
supabase start
```

2. Get your local credentials:
```bash
supabase status
```

3. Update `.env.local` with the local URLs and keys from the status output.

### Option B: Cloud Supabase

1. Create a project at https://supabase.com
2. Go to Settings > API
3. Copy your project URL and anon key to `.env.local`

## Step 3: Database Setup

Run migrations:
```bash
supabase db push
```

## Step 4: Deploy Edge Functions

### For Local Development:
```bash
supabase functions serve
```

### For Production:
```bash
# Deploy all functions
supabase functions deploy evidence-collector --no-verify-jwt
supabase functions deploy evidence-processor --no-verify-jwt
supabase functions deploy tech-intelligence --no-verify-jwt
supabase functions deploy report-orchestrator-v3 --no-verify-jwt

# Set secrets
supabase secrets set GOOGLE_API_KEY=your-google-api-key-here
supabase secrets set JINA_API_KEY=your-jina-api-key-here
```

## Step 5: Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Step 6: Quick Fix for Immediate Testing

To quickly test the system, we need to create an adapter edge function that matches what the frontend expects:

```bash
supabase functions new generate-executive-report
```

Then copy the adapter code (see `supabase/functions/generate-executive-report-adapter/`)

## Troubleshooting

### "Failed to generate report"
- Check that all edge functions are deployed
- Verify API keys are set correctly
- Check Supabase logs: `supabase functions logs`

### "Network error"
- Ensure Docker Desktop is running
- Check that Supabase is started: `supabase status`
- Verify `.env.local` has correct URLs

### Missing data in reports
- Verify Jina API key is valid
- Check Google API key has necessary permissions
- Review edge function logs for specific errors 