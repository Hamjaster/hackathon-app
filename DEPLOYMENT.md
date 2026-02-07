# 🚀 Deployment Guide - Vercel

## Prerequisites

1. ✅ Supabase project created and database migrations run
2. ✅ Google Gemini API key obtained
3. ✅ Cloudinary account set up
4. ✅ Vercel account (free tier works)

---

## Step 1: Prepare Database

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy everything from RUN_THIS_IN_SUPABASE.sql
```

Clean existing data for fresh demo (optional):

```sql
TRUNCATE TABLE vote_outcomes CASCADE;
TRUNCATE TABLE evidence_votes CASCADE;
TRUNCATE TABLE rumor_votes CASCADE;
TRUNCATE TABLE vote_agreements CASCADE;
TRUNCATE TABLE evidence CASCADE;
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE rumor_relationships CASCADE;
TRUNCATE TABLE rumors CASCADE;
TRUNCATE TABLE users CASCADE;
```

---

## Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via CLI (Recommended for first deploy)

```bash
# Login to Vercel
vercel login

# Deploy (will prompt for project setup)
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: campustrust (or your choice)
# - Directory: ./
# - Override settings? No
```

### Option B: Deploy via GitHub

1. Push your code to GitHub (make sure .env is in .gitignore!)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will auto-detect settings
5. Add environment variables (see Step 4)
6. Click "Deploy"

---

## Step 4: Add Environment Variables in Vercel

In Vercel Dashboard → Settings → Environment Variables, add:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
DATABASE_URL=postgresql://postgres:PASSWORD@db.project.supabase.co:5432/postgres
GEMINI_API_KEY=your-gemini-api-key
VOTE_SALT=HACKATHON_SECRET_SALT_2026
SESSION_SECRET=production-secret-change-this-12345
NODE_ENV=production
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-unsigned-upload-preset
```

**Important:**

- Don't include `PORT` variable (Vercel handles this)
- Make sure `SESSION_SECRET` is different from dev
- `VITE_` prefixed variables are exposed to client

---

## Step 5: Deploy Production

```bash
# Deploy to production
vercel --prod
```

Your app will be live at: `https://your-project.vercel.app`

---

## Step 6: Test Deployment

1. Visit your Vercel URL
2. Test anonymous login
3. Create a test rumor
4. Add evidence
5. Vote on evidence
6. Check trust score updates

---

## Troubleshooting

### Build Fails

```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - TypeScript errors
# - Missing dependencies
```

### API Routes Not Working

- Check that `vercel.json` exists
- Verify environment variables are set
- Check function logs in Vercel dashboard

### Database Connection Issues

- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- Check Supabase project is not paused
- Verify `DATABASE_URL` connection string

### Environment Variables Not Working

- Remember: `VITE_` prefix required for client-side variables
- Redeploy after adding/changing env vars
- Check case sensitivity

---

## Post-Deployment

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Monitor Performance

- Check Vercel Analytics dashboard
- Monitor function execution time
- Watch for rate limit issues (Supabase/Gemini)

### Auto-Deploy on Push

If using GitHub integration:

- Push to `main` branch → auto-deploys to production
- Push to other branches → creates preview deployments

---

## Vercel Limits (Free Tier)

- ✅ 100 GB bandwidth/month
- ✅ 100 hours serverless function execution
- ✅ Unlimited API requests
- ✅ Automatic HTTPS
- ✅ Preview deployments

**Should be more than enough for hackathon demo!**

---

## Quick Redeploy

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Or manual:
vercel --prod
```

---

## Emergency Rollback

```bash
# In Vercel dashboard → Deployments
# Find previous working deployment
# Click "..." → "Promote to Production"
```

---

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Issues: Check function logs in Vercel dashboard

🎉 **Your app is now live and ready for demo!**
