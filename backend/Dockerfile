# ========================================================
# Phase 1: BASE (Shared System Dependencies)
# ========================================================
FROM node:20-slim AS base

WORKDIR /app

# Install all runtime system libraries for Puppeteer (Chromium), Canvas, and Sharp
# This is done first and serially to prevent resource exhaustion on build nodes.
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

# ========================================================
# Phase 2: BUILDER (Native Module Compilation)
# ========================================================
FROM base AS builder

# Install build-only dependencies (headers for Canvas/Sharp)
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

# Optimize NPM and install all dependencies
ENV NPM_CONFIG_BUILD_FROM_SOURCE=false
COPY package.json package-lock.json* ./
RUN npm ci --loglevel error

# Copy source code
COPY . .

# ========================================================
# Phase 3: RUNTIME (Final Production Image)
# ========================================================
FROM base AS runner

# Copy the fully built application from the builder
COPY --from=builder /app ./

# Configuration
EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Basic healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT}/api/health || exit 1

CMD ["node", "index.js"]
