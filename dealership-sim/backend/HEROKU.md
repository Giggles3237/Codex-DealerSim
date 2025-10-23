# Heroku Deployment Guide

## Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed: `npm install -g heroku`
- Git repository initialized

## Deployment Steps

### 1. Login to Heroku
```bash
heroku login
```

### 2. Create Heroku App
```bash
cd dealership-sim/backend
heroku create your-app-name
```

### 3. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set PORT=8080
heroku config:set SAVE_PATH=/tmp/save.json
heroku config:set TICK_INTERVAL_MS=2000
heroku config:set SEED_MODE=reset
```

### 4. Deploy
```bash
# Option 1: Deploy from backend directory
heroku git:remote -a your-app-name
git push heroku main

# Option 2: Deploy using Docker
heroku container:push web
heroku container:release web
```

### 5. Open Your App
```bash
heroku open
```

## Build Configuration

This app uses pnpm workspaces with three packages:
- `@dealership/shared` - Common types and constants
- `@dealership/backend` - Express API server

The build process:
1. Installs all dependencies with `pnpm install`
2. Builds shared package first
3. Builds backend package
4. Removes dev dependencies
5. Starts the server with `node dist/index.js`

## Important Notes

### Port Configuration
- Heroku assigns a dynamic PORT environment variable
- Your app listens on `0.0.0.0:$PORT` or defaults to port 4000

### State Persistence
- `SAVE_PATH` defaults to `/tmp/save.json` on Heroku
- ⚠️ **Ephemeral filesystem**: Files in `/tmp` are deleted on dyno restart
- For persistent storage, consider:
  - Heroku Postgres (migrate state to database)
  - Heroku Redis (store state in memory)
  - External storage (S3, Azure Blob Storage)

### Scaling
- Free tier: 1 dyno, sleeps after 30 minutes of inactivity
- Paid tier: Always-on dynos, better for production

### Monitoring
```bash
# View logs
heroku logs --tail

# Check app status
heroku ps

# View environment variables
heroku config
```

## Troubleshooting

### Build Fails
```bash
# Check build logs
heroku logs --tail

# Common issues:
# - Missing pnpm in buildpack
# - Workspace dependencies not resolved
# - TypeScript compilation errors
```

### App Crashes
```bash
# Check runtime logs
heroku logs --tail

# Verify environment variables
heroku config

# Test locally
heroku local web
```

### State Not Persisting
- Files in `/tmp` are ephemeral
- Consider migrating to database storage
- Or use Heroku's persistent file system add-ons

## Next Steps

1. **Deploy Frontend** to Vercel/Netlify
2. **Configure CORS** in backend to allow frontend origin
3. **Set up monitoring** with Heroku metrics
4. **Consider database** for persistent state storage

