# Netlify Deployment Guide

## Environment Variables for Netlify

You need to set **ONE** environment variable in Netlify:

### Required Variable

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `VITE_API_BASE` | `https://codex-dealersim-production.up.railway.app` | Backend API URL |

## How to Set Environment Variables in Netlify

### Option 1: Via Netlify Dashboard (Recommended)

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your site (or create a new one)
3. Go to **Site settings** → **Environment variables**
4. Click **Add variable**
5. Enter:
   - **Key**: `VITE_API_BASE`
   - **Value**: `https://codex-dealersim-production.up.railway.app`
6. Select **Deploy context**: "All deploy contexts" (or specific if needed)
7. Click **Save**

### Option 2: Via netlify.toml (Already Configured)

The `netlify.toml` file has already been created with the environment variable set. This means you don't need to manually set it in the dashboard if you're deploying from the repository.

### Option 3: Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variable
netlify env:set VITE_API_BASE https://codex-dealersim-production.up.railway.app

# Deploy
netlify deploy --prod
```

## Build Configuration

The `netlify.toml` file includes:

```toml
[build]
  command = "cd ../ && pnpm install && pnpm --filter=@dealership/shared build && pnpm --filter=@dealership/frontend build"
  publish = "frontend/dist"

[build.environment]
  VITE_API_BASE = "https://codex-dealersim-production.up.railway.app"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This configuration:
- Builds the shared package first
- Builds the frontend package
- Publishes the `frontend/dist` directory
- Sets the API base URL
- Redirects all routes to index.html for SPA routing

## Deployment Steps

### 1. Prepare Your Repository

```bash
# From the root directory
cd dealership-sim/frontend

# The netlify.toml is already created
# Make sure it's committed to git
git add netlify.toml
git commit -m "Add Netlify configuration"
git push
```

### 2. Deploy to Netlify

#### Option A: Via Netlify Dashboard

1. Go to https://app.netlify.com
2. Click **Add new site** → **Import an existing project**
3. Connect your GitHub repository
4. Netlify will auto-detect the settings from `netlify.toml`
5. Click **Deploy site**

#### Option B: Via Netlify CLI

```bash
# From the frontend directory
cd dealership-sim/frontend

# Initialize Netlify (if not already done)
netlify init

# Deploy
netlify deploy --prod
```

### 3. Verify Deployment

After deployment, your app will be available at:
- Production URL: `https://your-app-name.netlify.app`
- Preview URL: `https://random-string.netlify.app` (for branches)

## Troubleshooting

### Build Fails

**Issue**: Build fails with "pnpm not found"
- **Solution**: Ensure Netlify has access to install pnpm. The build command installs pnpm automatically.

**Issue**: Build fails with "Missing dependencies"
- **Solution**: Make sure you're building from the root with workspace access. The `netlify.toml` uses `cd ../` to access the workspace.

### API Calls Fail

**Issue**: Frontend can't connect to backend
- **Solution**: 
  1. Verify `VITE_API_BASE` is set correctly
  2. Check that the backend URL is accessible
  3. Verify CORS is enabled on the backend (already configured)

### 404 Errors on Refresh

**Issue**: Getting 404 on page refresh
- **Solution**: The redirect rule in `netlify.toml` should handle this. Verify it's present.

## Environment Variables Summary

| Variable | Value | Required | Description |
|----------|-------|----------|-------------|
| `VITE_API_BASE` | `https://codex-dealersim-production.up.railway.app` | ✅ Yes | Backend API URL |

## Next Steps

1. Set environment variable in Netlify dashboard
2. Deploy your site
3. Test the connection between frontend and backend
4. Verify game functionality

## Support

If you encounter issues:
- Check Netlify build logs
- Verify backend is running: https://codex-dealersim-production.up.railway.app/health
- Review browser console for errors

