# Database Migration Instructions

## Vector Store Migration

The TechScanIQ 2.0 platform requires a vector database table for semantic search capabilities. Follow these steps to apply the migration:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard at https://supabase.com/dashboard
2. Select your project
3. Navigate to the **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire SQL content from: `src/database/migrations/create-vector-store.sql`
6. Paste it into the SQL editor
7. Click **Run** to execute the migration

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Create a new migration
supabase migration new vector_store

# Copy the SQL content to the generated migration file
cp src/database/migrations/create-vector-store.sql supabase/migrations/[TIMESTAMP]_vector_store.sql

# Apply the migration
supabase db push
```

### Option 3: Using psql

If you have direct database access:

```bash
# Get your database URL from Supabase dashboard
psql "YOUR_DATABASE_URL" -f src/database/migrations/create-vector-store.sql
```

## What This Migration Does

1. **Enables pgvector extension** - Required for vector similarity search
2. **Creates evidence_embeddings table** - Stores vector embeddings for semantic search
3. **Creates indexes** - Optimizes query performance
4. **Creates match_evidence function** - Provides similarity search functionality

## Verification

After running the migration, verify it was successful:

1. In Supabase Dashboard, go to **Table Editor**
2. Check that `evidence_embeddings` table exists
3. Go to **Database → Functions**
4. Verify `match_evidence` function exists

## Troubleshooting

### Extension Not Available
If you get an error about the `vector` extension not being available:
1. Go to **Database → Extensions** in Supabase Dashboard
2. Search for "vector" 
3. Click "Enable" if it's not already enabled

### Permission Errors
Make sure you're using the service role key (not the anon key) when running migrations programmatically.

## Next Steps

After the migration is complete:
1. The vector store will be ready for use
2. Evidence can be embedded and stored for semantic search
3. The orchestrator can use similarity search to find relevant evidence