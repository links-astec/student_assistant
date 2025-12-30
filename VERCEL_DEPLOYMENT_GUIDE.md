# 🚀 CampusFlow Vercel Deployment Guide

## Prerequisites

### 1. Accounts & Tools
- ✅ **Vercel Account**: [vercel.com](https://vercel.com)
- ✅ **Supabase Account**: [supabase.com](https://supabase.com)
- ✅ **Git Repository**: Push your code to GitHub/GitLab
- ✅ **Vercel CLI**: `npm install -g vercel` (already installed)

### 2. Environment Variables Ready
Prepare these for production:

#### Backend Environment Variables:
```
NODE_ENV=production
PORT=3001
OLLAMA_BASE_URL=https://api.olama.ai  # or your Ollama endpoint
OLLAMA_MODEL=qwen2.5:0.5b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### Frontend Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-frontend-url.vercel.app
```

## 📦 Step-by-Step Deployment

### Step 1: Prepare Your Code

1. **Clean up unnecessary files** (already done):
   ```bash
   # Files removed: test files, build artifacts, development binaries
   ```

2. **Push to Git Repository**:
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

### Step 2: Deploy Backend First

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Login to Vercel** (if not already):
   ```bash
   vercel login
   ```

3. **Deploy backend**:
   ```bash
   vercel --prod
   ```
   - Choose your account when prompted
   - Vercel will detect it's a Node.js project
   - It will use the `vercel.json` configuration

4. **Note the backend URL** (something like `https://campusflow-backend.vercel.app`)

### Step 3: Deploy Frontend

1. **Navigate to frontend directory**:
   ```bash
   cd ../frontend/system_prototype
   ```

2. **Update vercel.json** with your actual backend URL:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-backend-url.vercel.app/api/:path*"
       }
     ]
   }
   ```

3. **Deploy frontend**:
   ```bash
   vercel --prod
   ```

### Step 4: Configure Environment Variables

1. **Go to Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)

2. **For Backend Project**:
   - Go to Settings → Environment Variables
   - Add all backend environment variables

3. **For Frontend Project**:
   - Go to Settings → Environment Variables
   - Add all frontend environment variables
   - Make sure `NEXT_PUBLIC_BACKEND_URL` points to your backend URL

### Step 5: Redeploy with Environment Variables

1. **Trigger new deployments**:
   ```bash
   # Backend
   cd backend && vercel --prod

   # Frontend
   cd ../frontend/system_prototype && vercel --prod
   ```

### Step 6: Set Up Custom Domain (Optional)

1. **In Vercel Dashboard**:
   - Go to your project → Settings → Domains
   - Add your custom domain (e.g., `campusflow.coventry.ac.uk`)

2. **Configure DNS**:
   - Add CNAME record pointing to `cname.vercel-dns.com`

### Step 7: SEO & Analytics Setup

1. **Submit to Google Search Console**:
   - Go to [search.google.com/search-console](https://search.google.com/search-console)
   - Add your domain
   - Submit your sitemap: `https://yourdomain.com/sitemap.xml`

2. **Set up Analytics** (Optional):
   - Add Google Analytics or other tracking codes

## 🔧 Automated Deployment Script

Use the provided deployment script for easier deployment:

```bash
# Make script executable
chmod +x deploy-vercel.sh

# Run deployment
./deploy-vercel.sh
```

## 🧪 Testing Your Deployment

### Test Checklist:
- [ ] Frontend loads: `https://your-frontend-url.vercel.app`
- [ ] Chat functionality works
- [ ] API calls work: Check browser network tab
- [ ] Mobile responsive
- [ ] SEO meta tags present
- [ ] SSL certificate active (HTTPS)

### Common Issues:
- **API calls failing**: Check `NEXT_PUBLIC_BACKEND_URL` environment variable
- **Build failing**: Check Vercel build logs
- **Environment variables**: Make sure they're set in Vercel dashboard, not locally

## 📊 Monitoring & Maintenance

### Vercel Dashboard:
- View real-time metrics
- Monitor function performance
- Check error logs
- Manage deployments

### Performance Monitoring:
- Use Vercel's built-in analytics
- Monitor Core Web Vitals
- Set up uptime monitoring

## 🚀 Production Optimizations

### Already Configured:
- ✅ SEO optimization
- ✅ Performance optimization
- ✅ Security headers
- ✅ PWA support
- ✅ Image optimization

### Additional Optimizations:
- Set up CDN for static assets
- Configure caching strategies
- Set up error tracking (Sentry)
- Configure monitoring alerts

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally first: `npm run dev`
4. Check Vercel status: [vercel.com/status](https://vercel.com/status)

---

**🎉 Your CampusFlow application is now production-ready!**