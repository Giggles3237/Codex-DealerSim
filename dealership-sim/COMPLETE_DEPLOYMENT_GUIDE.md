# Complete Netlify Deployment Guide

## ✅ Your Backend is Already Deployed!

**Backend URL**: https://dealership-sim-ee5c0f63eae7.herokuapp.com  
**Status**: ✅ Running and healthy

## 🚀 Deploy Frontend to Netlify

### Step 1: Install Netlify CLI (Optional - You Already Have It!)

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

### Step 3: Deploy Your Site

#### Option A: Via Netlify Dashboard (Recommended for First Time)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Login with your account

2. **Add New Site**
   - Click **"Add new site"** → **"Import an existing project"**
   - Connect to **GitHub** and select your repository: `Giggles3237/Codex-DealerSim`
   - Select your team: **P&W**

3. **Configure Build Settings**
   - Netlify will auto-detect from `netlify.toml`:
     - **Build command**: `cd ../ && pnpm install && pnpm --filter=@dealership/shared build && pnpm --filter=@dealership/frontend build`
     - **Publish directory**: `frontend/dist`
   
4. **Set Environment Variables**
   - Go to **Site settings** → **Environment variables**
   - Add variable:
     - **Key**: `VITE_API_BASE`
     - **Value**: `https://dealership-sim-ee5c0f63eae7.herokuapp.com`
   - Click **Save**

5. **Deploy**
   - Click **"Deploy site"**
   - Wait for build to complete

#### Option B: Via Netlify CLI

```bash
# Navigate to frontend directory
cd dealership-sim/frontend

# Initialize Netlify (select options when prompted)
netlify init
# - Choose: "Create & configure a new site"
# - Team: P&W
# - Site name: dealership-simulator (or your choice)
# - Build command: (leave default from netlify.toml)
# - Publish directory: frontend/dist

# Set environment variable
netlify env:set VITE_API_BASE https://dealership-sim-ee5c0f63eae7.herokuapp.com

# Deploy
netlify deploy --prod
```

### Step 4: Verify Deployment

After deployment, your app will be available at:
- Production URL: `https://dealership-simulator.netlify.app` (or your custom name)
- Preview URL: `https://random-string.netlify.app` (for branches)

### Step 5: Test Your App

1. Open your Netlify URL in a browser
2. Check that the app loads
3. Verify API calls are working (check browser console)
4. Test the game functionality

## 🔧 Troubleshooting

### Build Fails with "pnpm not found"

**Solution**: Install pnpm in Netlify build settings or update the build command:

1. Go to **Site settings** → **Build & deploy** → **Build settings**
2. Update build command to:
```bash
npm install -g pnpm@8.15.0 && cd ../ && pnpm install && pnpm --filter=@dealership/shared build && pnpm --filter=@dealership/frontend build
```

### API Calls Fail (CORS Errors)

**Solution**: Verify backend CORS is enabled (already configured). Check browser console for errors.

### 404 Errors on Page Refresh

**Solution**: The redirect rule in `netlify.toml` should handle this. Verify it's present.

## 📊 Environment Variables Summary

| Variable | Value | Required | Set In |
|----------|-------|----------|--------|
| `VITE_API_BASE` | `https://dealership-sim-ee5c0f63eae7.herokuapp.com` | ✅ Yes | Netlify Dashboard or CLI |

## 🎉 Success!

Once deployed, you'll have:
- ✅ Backend running on Heroku
- ✅ Frontend running on Netlify
- ✅ Full-stack application live!

## 🔗 Quick Links

- **Backend**: https://dealership-sim-ee5c0f63eae7.herokuapp.com
- **Backend Health**: https://dealership-sim-ee5c0f63eae7.herokuapp.com/health
- **Netlify Dashboard**: https://app.netlify.com
- **GitHub Repository**: https://github.com/Giggles3237/Codex-DealerSim

## 📝 Next Steps After Deployment

1. **Test the application** - Verify everything works
2. **Custom domain** (optional) - Add your own domain
3. **Monitor logs** - Check Netlify logs for any issues
4. **Update backend URL** - If you change backend URL, update the environment variable

