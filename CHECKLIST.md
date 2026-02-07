# 📋 Pre-Deployment Checklist

Before deploying to Vercel, make sure you've completed:

## Database Setup

- [ ] Supabase project created
- [ ] SQL migrations run (RUN_THIS_IN_SUPABASE.sql)
- [ ] Database cleaned for demo (optional)
- [ ] Connection string tested

## API Keys

- [ ] Google Gemini API key obtained
- [ ] Cloudinary account created
- [ ] Cloudinary cloud name noted
- [ ] Cloudinary unsigned upload preset created

## Environment Variables Ready

- [ ] SUPABASE_URL
- [ ] SUPABASE_SERVICE_KEY
- [ ] DATABASE_URL
- [ ] GEMINI_API_KEY
- [ ] VOTE_SALT (generate random string)
- [ ] SESSION_SECRET (generate random string)
- [ ] VITE_CLOUDINARY_CLOUD_NAME
- [ ] VITE_CLOUDINARY_UPLOAD_PRESET

## Code Preparation

- [ ] All console.logs removed or minimized
- [ ] Test files removed
- [ ] .env file not committed (check .gitignore)
- [ ] Build script verified (npm run build)
- [ ] Local test passed

## Vercel Setup

- [ ] Vercel account created
- [ ] Vercel CLI installed (npm i -g vercel)
- [ ] GitHub repo created (optional, for auto-deploy)

## Demo Data

- [ ] 5-7 curated rumors created
- [ ] Mix of Verified/Active/Debunked statuses
- [ ] Evidence attached with realistic content
- [ ] Vote stakes demonstrate weighted voting
- [ ] Trust scores show variety (0.15 to 0.85)

## Testing Plan

After deployment:

- [ ] Anonymous login works
- [ ] Can create rumor
- [ ] Can add evidence with image
- [ ] Can vote on evidence
- [ ] Trust scores update correctly
- [ ] AI summary generates
- [ ] All pages load correctly

---

## Quick Deploy Command

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

See DEPLOYMENT.md for detailed instructions.

---

## Emergency Contacts

- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- Team Lead: [Your contact]
