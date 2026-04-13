# ========================================================
# ULTRA-COMPACT SINGLE-STAGE BUILD (Optimized for <1GB RAM)
# ========================================================
# We use a single stage to avoid the memory-intensive "stage copy" process 
# which frequently causes OOM kills on small VPS deployments.
FROM node:20-slim

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV SHARP_CONCURRENCY=1
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production
ENV PORT=5000

# 1. Install EVERYTHING (Runtime + Build tools) in one layer
# Then clean up build tools immediately after npm install to keep image small
RUN apt-get update && apt-get install -y --no-install-recommends \
    eatmydata \
    && eatmydata apt-get install -y --no-install-recommends \
    # Runtime: Chromium & dependencies
    chromium fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
    libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
    libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
    libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
    libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    # Runtime: Helpers
    dumb-init librsvg2-2 libjpeg62-turbo libgif7 \
    # Build-time: Compilers (will be removed later)
    python3 build-essential pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Preparation
ENV NPM_CONFIG_BUILD_FROM_SOURCE=false
ENV NPM_CONFIG_JOBS=1
ENV NPM_CONFIG_FOREGROUND_SCRIPTS=true
ENV PYTHON=/usr/bin/python3

COPY package.json package-lock.json* ./

# 3. Install dependencies with aggressive memory management
# Lowering to 768MB to ensure host survival on 1GB VPS
RUN NODE_OPTIONS="--max-old-space-size=768" npm ci --omit=dev --loglevel verbose \
    && npm cache clean --force

# 4. Copy source code
COPY . .

# 5. Cleanup build-only system dependencies to save disk/RAM
# This keeps the "single stage" relatively slim
RUN apt-get purge -y build-essential pkg-config python3 \
    && apt-get autoremove -y \
    && apt-get clean

# Final Setup
EXPOSE 5000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Set runtime memory limit (1GB VPS safe)
CMD ["node", "--max-old-space-size=1024", "index.js"]
