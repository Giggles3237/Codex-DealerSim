FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm@8.15.0

WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy shared package
COPY shared ./shared

# Copy backend package
COPY backend ./backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared first, then backend
RUN pnpm --filter=@dealership/shared build
RUN pnpm --filter=@dealership/backend build

# Remove dev dependencies for production
RUN pnpm install --prod --frozen-lockfile

WORKDIR /app/backend

# Heroku uses PORT env variable
EXPOSE ${PORT:-8080}

# Start the server
CMD ["node", "dist/index.js"]

