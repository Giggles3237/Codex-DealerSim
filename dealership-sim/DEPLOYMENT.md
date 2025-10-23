# Heroku Deployment - Quick Start Guide

## ✅ Files Created

1. **`Dockerfile`** (root level) - Container configuration for Heroku
2. **`backend/Procfile`** - Process start command
3. **`backend/app.json`** - Heroku app configuration
4. **`backend/HEROKU.md`** - Detailed deployment guide

## 🚀 Quick Deploy Steps

### Prerequisites
```bash
# Install Heroku CLI
npm install -g heroku-cli

# Login
heroku login
```

### Deploy

#### Option 1: Direct Git Push (Recommended)
```bash
# From the root directory
cd dealership-sim

# Create Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SAVE_PATH=/tmp/save.json
heroku config:set TICK_INTERVAL_MS=2000

# Deploy using Docker
heroku container:push web
heroku container:release web

# Open your app
heroku open
```

#### Option 2: Using Heroku Buildpacks
```bash
# From backend directory
cd backend

# Create app
heroku create your-app-name

# Enable Node.js buildpack
heroku buildpacks:add heroku/nodejs

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SAVE_PATH=/tmp/save.json
heroku config:set TICK_INTERVAL_MS=2000

# Deploy
git push heroku main
```

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Runtime environment |
| `PORT` | `8080` | Server port (auto-set by Heroku) |
| `SAVE_PATH` | `/tmp/save.json` | Game state file path |
| `TICK_INTERVAL_MS` | `2000` | Simulation tick interval |
| `SEED_MODE` | `reset` | Start mode (`reset` or `load`) |

## ⚠️ Important Notes

### State Persistence
- Files in `/tmp` are **ephemeral** (deleted on dyno restart)
- For production, consider:
  - Migrating to Heroku Postgres
  - Using Redis for state storage
  - External storage (S3, Azure Blob)

### Free Tier Limitations
- Sleeps after 30 minutes of inactivity
- 550 free dyno hours/month
- Single dyno only

### Scaling
```bash
# Upgrade to paid tier for always-on
heroku ps:scale web=1

# View current dyno status
heroku ps
```

## 📊 Monitoring

```bash
# View logs
heroku logs --tail

# Check app status
heroku ps

# View environment variables
heroku config

# Open app dashboard
heroku dashboard
```

## 🔗 Next Steps

1. **Deploy Frontend** to Vercel/Netlify
2. **Update CORS** in backend to allow frontend origin
3. **Set backend URL** in frontend environment variables
4. **Consider database** for persistent state storage

## 🐛 Troubleshooting

### Build Fails
```bash
# Check logs
heroku logs --tail

# Common issues:
# - Missing pnpm workspace configuration
# - Buildpack not detecting Node.js
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

For more details, see `backend/HEROKU.md`

