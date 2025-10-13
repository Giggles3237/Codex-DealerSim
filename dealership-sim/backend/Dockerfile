FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm@8.15.0

WORKDIR /app

# Copy workspace root files
COPY ../package.json ../pnpm-workspace.yaml ./
COPY ../pnpm-lock.yaml ./

# Copy shared package
COPY ../shared ./shared

# Copy backend
COPY . ./backend

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build shared first, then backend
RUN pnpm --filter=@dealership/shared build
RUN pnpm --filter=@dealership/backend build

# Remove dev dependencies
RUN pnpm install --prod --frozen-lockfile

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/index.js"]

