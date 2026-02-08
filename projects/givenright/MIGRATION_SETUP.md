# GivenRight Migration Setup

## Safety Protocol: Supabase → Git Sync

### 1. Current Status
- ✅ Supabase CLI installed (v2.75.0)
- ✅ Project initialized (`supabase init`)
- ⚠️ **Supabase DB is ahead of Git** - must sync safely

### 2. Next Steps (SAFE)
```bash
# 1. Connect to remote Supabase (read-only first)
supabase link --project-ref <project-id>

# 2. Export current schema (without data)
supabase db dump --schema-only > current_production_schema.sql

# 3. Create initial migration from current state
supabase migration new initial_production_state
# Copy current schema into this migration

# 4. Future migrations: ADDITIVE ONLY
supabase migration new personality_fit_enhancement
```

### 3. Migration Rules
- ✅ `CREATE TABLE IF NOT EXISTS`
- ✅ `ALTER TABLE ADD COLUMN`
- ✅ `CREATE OR REPLACE FUNCTION` (idempotent functions only)
- ❌ **NO** `DROP TABLE` 
- ❌ **NO** `DROP COLUMN` without explicit approval

### 4. Deployment
```bash
# Local test first
supabase db reset
supabase migration up

# Production deploy
supabase db push
```

## Current Migration Structure
- `supabase/migrations/` - SQL migration files
- `supabase/config.toml` - Project configuration
- All changes versioned and reviewable

**Status:** Ready for Project ID connection