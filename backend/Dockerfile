# ========================================================
# Phase 1: BUILDER (Using full image to avoid OOM during build-essential install)
# ========================================================
FROM node:20 AS builder

WORKDIR /app

# Install only the specific development libraries for Canvas and other native modules.
# Tools like python3, make, g++, and build-essential are PRE-INSTALLED in node:20 (full).
RUN apt-get update && apt-get install -y --no-install-recommends \
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
# Includes: libcairo2, libpango, libjpeg, libgif, librsvg, libfribidi, libharfbuzz
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    gnupg \
    ca-certificates \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libxkbcommon0 \
    libxkbcommon-x11-0 \
    libcairo2 \
    libjpeg62-turbo \
    libgif7 \
    libpango-1.0-0 \
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
