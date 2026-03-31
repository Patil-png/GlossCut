# ========================================================
# Phase 1: BUILDER
# ========================================================
FROM node:20-slim AS builder

WORKDIR /app

# Install compilation tools (Python, make, g++, etc.)
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

# Install ALL dependencies (including devDependencies for build steps if any)
RUN npm ci --loglevel error

# Copy source code
COPY . .

# ========================================================
# Phase 2: RUNTIME (Final Image)
# ========================================================
FROM node:20-slim

WORKDIR /app

# Install ONLY the necessary system libraries for Puppeteer/Canvas at runtime
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy node_modules and built code from Phase 1
COPY --from=builder /app ./

# Garbage collection: Prune dev dependencies if needed (optional, depends on setup)
# RUN npm prune --production

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "index.js"]
