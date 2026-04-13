# ========================================================
# Phase 1: BASE (Shared System Dependencies)
# ========================================================
# Use the full node image to save time/ram on base tool installation
FROM node:20 AS base

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV SHARP_CONCURRENCY=1

# 1. Install 'eatmydata' - a tool to safely speed up installs on small servers
# and 'chromium' in its own dedicated step to minimize peak memory
RUN apt-get update && apt-get install -y --no-install-recommends \
    eatmydata \
    && eatmydata apt-get install -y --no-install-recommends \
    chromium \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 2. Install support libraries sequentially using eatmydata
RUN apt-get update && eatmydata apt-get install -y --no-install-recommends \
    fonts-liberation \
    libnss3 \
    libasound2 \
    libgbm1 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN apt-get update && eatmydata apt-get install -y --no-install-recommends \
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libgif7 \
    librsvg2-2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

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

# Optimize NPM and install only production dependencies with memory caps
# NPM_CONFIG_BUILD_FROM_SOURCE=false tries pre-built binaries first
ENV NPM_CONFIG_BUILD_FROM_SOURCE=false
# Limit npm job concurrency to 1 to prevent OOM during native module compilation
# (tensorflow, canvas, sharp all spawn heavy C++ compiler processes in parallel)
ENV NPM_CONFIG_JOBS=1
ENV NPM_CONFIG_FOREGROUND_SCRIPTS=true
ENV PYTHON=/usr/bin/python3

COPY package.json package-lock.json* ./
# Use 1024MB cap (not 2048) to leave headroom for the C++ compiler (node-gyp)
# The extra RAM freed here prevents the OOM-kill (exit 255) on low-memory VPS
RUN NODE_OPTIONS="--max-old-space-size=1024" npm ci --omit=dev --loglevel verbose 2>&1 | tail -50

# Copy source code
COPY . .

# ========================================================
# Phase 3: RUNTIME (Final Production Image)
# ========================================================
FROM base AS runner

# Install dumb-init for robust process management (cleans up zombie Chromium processes)
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy the fully built application from the builder
COPY --from=builder /app ./

# Configuration
EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV SHARP_CONCURRENCY=1

# Use dumb-init to prevent process leaks
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Set runtime memory limit for Node.js (1.5GB cap) to leave room for OS/Chromium
CMD ["node", "--max-old-space-size=1536", "index.js"]
