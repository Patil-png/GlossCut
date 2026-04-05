# ========================================================
# Phase 1: BUILDER
# ========================================================
FROM node:20-slim AS builder

WORKDIR /app

# Install all compilation and native build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    build-essential \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Optimize NPM for native module builds
ENV NPM_CONFIG_BUILD_FROM_SOURCE=false

# Copy manifests
COPY package.json package-lock.json* ./

# Install ALL dependencies
RUN npm ci --loglevel error

# Copy source code
COPY . .

# ========================================================
# Phase 2: RUNTIME (Final Image)
# ========================================================
FROM node:20-slim

WORKDIR /app

# Install ONLY the necessary system libraries for Puppeteer, Canvas, and Sharp at runtime.
# Optimized for Debian Bookworm (node:20-slim)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
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
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    libfribidi0 \
    libharfbuzz0b \
    chromium \
    curl \
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
