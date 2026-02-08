# GitHub Secrets Setup for Supabase Deployment

## Required GitHub Secrets
Set these in: **GitHub Repo → Settings → Secrets and variables → Actions**

### 1. SUPABASE_ACCESS_TOKEN
- Go to: Supabase Dashboard → Account Settings → Access Tokens
- Create new token (name: "github-actions")  
- Copy token → Set as GitHub Secret: `SUPABASE_ACCESS_TOKEN`

### 2. SUPABASE_PROJECT_REF  
- Go to: Supabase Project → Settings → General
- Copy Project ID/Reference
- Set as GitHub Secret: `SUPABASE_PROJECT_REF=yjctwxxlbdosriwiwzgt`

### 3. SUPABASE_DB_URL
- Go to: Supabase Project → Settings → Database
- Use **Transaction pooler** (Port 6543, not Direct 5432)
- Format: `postgresql://postgres:<DB_PASSWORD>@<HOST>:6543/postgres`
- Set as GitHub Secret: `SUPABASE_DB_URL`

## Deployment Trigger
After setting secrets:
1. Push any change to `supabase/migrations/` 
2. Or trigger manually: Actions → "Supabase DB Push" → Run workflow

## Expected Result
✅ personality_fit_score will show **20** instead of **0** for adventurous+creative+experience users