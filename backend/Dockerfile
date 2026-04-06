# ========================================================
# Phase 1: BUILDER (Compiling native modules)
# ========================================================
FROM node:20-slim AS builder

WORKDIR /app

# Install only the necessary build-time dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Optimize NPM
ENV NPM_CONFIG_BUILD_FROM_SOURCE=false

# Copy manifests and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --loglevel error

# Copy source code
COPY . .

# ========================================================
# Phase 2: RUNTIME (Production Image)
# ========================================================
FROM node:20-slim

WORKDIR /app

# Install runtime libraries
# Note: 'chromium' in Debian Bookworm automatically installs 95% of Puppeteer's dependencies.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libnss3 \
    libasound2 \
    libgbm1 \
    ca-certificates \
    curl \
    # Canvas/Sharp runtime libraries
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libgif7 \
    librsvg2-2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy node_modules and built code from Phase 1
COPY --from=builder /app ./

# Default port is 5000 (matches .env)
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Basic healthcheck to assist the proxy
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT}/api/health || exit 1

CMD ["node", "index.js"]
