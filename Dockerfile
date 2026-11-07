# ==============================================================
# Sovereign AI Operating System - The Shadow (Ez-Zel)
# Production Multi-Stage Dockerfile (Node.js 22 LTS Alpine)
# Isolated deployment for Render, Railway, or VPS
# ==============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy full source tree
COPY . .

# Build Vite frontend and compile TypeScript server
RUN npm run build

# ==============================================================
# Production Runtime Stage
# ==============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install minimal runtime libraries (Chromium dependencies if needed for headless execution)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy built application and package files
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Start compiled CJS server
CMD ["node", "dist/server.cjs"]
