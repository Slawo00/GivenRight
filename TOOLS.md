# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## GitHub & Supabase Access 🎯

**GITHUB_TOKEN Available:** Full Read/Write access via API

### What I CAN do:
- ✅ **Read/Write Files:** Upload, edit, delete any file in repo
- ✅ **Migrations:** Create/update `supabase/migrations/*.sql` files
- ✅ **Functions:** Deploy SQL functions via migrations
- ✅ **Workflows:** Upload/modify `.github/workflows/*.yml` files
- ✅ **Auto-Deploy:** File changes trigger GitHub Actions → Supabase
- ✅ **Actions Status:** Monitor deployment success/failure
- ✅ **Complete Features:** Plan → Code → Deploy eigenständig

### What I CANNOT do:
- ❌ **Manual Workflow Trigger:** Need Actions scope (403)
- ❌ **Secrets Management:** Cannot read/write GitHub Secrets (403)
- ❌ **Direct Supabase:** Only via GitHub Actions pipeline

### Configured Secrets (by user):
- `SUPABASE_ACCESS_TOKEN` ✅
- `SUPABASE_PROJECT_REF` ✅
- ~~`SUPABASE_DB_URL`~~ ❌ (causes import errors, not needed)

### Repo Details:
- **Name:** `Slawo00/GivenRight`
- **Default Branch:** `main`
- **Auto-Deploy:** Any push to `main` triggers Supabase migration

### Deployment Workflow:
1. Create/edit files via GitHub API
2. Push triggers GitHub Actions automatically
3. Actions deploys to Supabase using secrets
4. Monitor via Actions API for success/failure

**RESULT:** Full stack database development capability! 🛡️

---

## Environment-Specific Notes

### TTS
- Preferred: Default system voice

### Commands
- Always use `curl` with `$GITHUB_TOKEN` for GitHub API
- Base64 encode files before API upload: `base64 -w0 file.sql`

---

Add whatever helps you do your job. This is your cheat sheet.
