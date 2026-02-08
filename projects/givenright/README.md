# GivenRight - Decision Engine

## Deployment Setup

### GitHub Secrets Required:
Set these in GitHub Repository → Settings → Secrets and Variables → Actions:

```
SUPABASE_ACCESS_TOKEN=sbp_...    # Supabase Dashboard → Account Settings → Access Tokens
SUPABASE_PROJECT_REF=yjctwxxlbdosriwiwzgt    # From project URL
SUPABASE_DB_PASSWORD=...         # Service role key or DB password
```

### Current Status:
- ✅ Migration ready: `20260208162832_personality_fit_v3_views.sql`
- ✅ Function deployed: `calculate_personality_fit_score` (returns 20)
- ⏳ Awaiting GitHub Actions deployment

### Expected Result:
After deployment, personality_fit_score will show **20** instead of **0** for users with traits `["adventurous", "creative"]` and gift type `"experience"`.

## Manual Deployment Alternative:
```bash
# In Supabase Dashboard → SQL Editor, execute:
# supabase/migrations/20260208162832_personality_fit_v3_views.sql
```

## Test Case:
```sql
SELECT calculate_personality_fit_score(
    ARRAY['adventurous', 'creative'], 
    'experience'
); -- Should return: 20
```