# ========================================================
# ULTIMATE SINGLE-LAYER BUILD (Maximum Space/RAM Savings)
# ========================================================
FROM node:20-slim

WORKDIR /app

# Set global environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    SHARP_CONCURRENCY=1 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=5000 \
    NPM_CONFIG_BUILD_FROM_SOURCE=false \
    NPM_CONFIG_JOBS=1 \
    NPM_CONFIG_FOREGROUND_SCRIPTS=true \
    PYTHON=/usr/bin/python3

# COPY ONLY package files first for caching
COPY package.json package-lock.json* ./

# ==============================================================================
# THE "ALL-IN-ONE" COMMAND
# We do: Install Deps -> Compile Native Modules -> Prune Build Tools
# ALL IN ONE LAYER. This ensures deleted files NEVER touch the disk permanently.
# ==============================================================================
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
    libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
    libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
    libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
    libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    dumb-init librsvg2-2 libjpeg62-turbo libgif7 \
    # Build-only tools
    python3 build-essential pkg-config libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    # --- BUILD PROCESS ---
    && NODE_OPTIONS="--max-old-space-size=768" npm ci --omit=dev --loglevel verbose \
    && npm cache clean --force \
    # --- CLEANUP ---
    && apt-get purge -y build-essential pkg-config python3 libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /root/.npm/_cacache

# Copy the rest of the source code
COPY . .

# Final runtime setup
EXPOSE 5000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "--max-old-space-size=1024", "index.js"]
