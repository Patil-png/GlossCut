# ========================================================
# Phase 1: BASE (Shared System Dependencies)
# ========================================================
# Use the slim image to drastically reduce RAM usage during build
FROM node:20-slim AS base

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

# Install all runtime dependencies in a SINGLE layer to save space/RAM
# This includes Chromium dependencies, fonts, and process management
RUN apt-get update && apt-get install -y --no-install-recommends \
    eatmydata \
    && eatmydata apt-get install -y --no-install-recommends \
    # Chromium and its dependencies
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    # Other system tools
    dumb-init \
    librsvg2-2 \
    libjpeg62-turbo \
    libgif7 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ========================================================
# Phase 2: BUILDER (Native Module Compilation)
# ========================================================
FROM base AS builder

# Install build-only dependencies (headers for Canvas/Sharp/Tensorflow)
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

# Optimize NPM for low-RAM compilation
ENV NPM_CONFIG_BUILD_FROM_SOURCE=false
# CRITICAL: Limit concurrency to 1 to prevent OOM during native module compilation
ENV NPM_CONFIG_JOBS=1
ENV NPM_CONFIG_FOREGROUND_SCRIPTS=true
ENV PYTHON=/usr/bin/python3

COPY package.json package-lock.json* ./

# Use a conservative memory cap for Node during install. 
# We REMOVED the 'tail -50' pipe to ensure build failures are transparent and return non-zero exit codes.
RUN NODE_OPTIONS="--max-old-space-size=1024" npm ci --omit=dev --loglevel verbose

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
ENV SHARP_CONCURRENCY=1

# Use dumb-init to prevent process leaks
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Set runtime memory limit for Node.js
# 1GB cap is safer for a small VPS to prevent system-wide OOM
CMD ["node", "--max-old-space-size=1024", "index.js"]
