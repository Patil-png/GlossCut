# ================================================
# GlossCut Backend — Coolify-compatible Dockerfile
# Bypasses nixpacks entirely for a stable build
# ================================================
FROM node:20-slim

# Install all C++ build dependencies AND Chromium dependencies for WhatsApp/Puppeteer
ENV DEBIAN_FRONTEND=noninteractive

# Memory optimization for native modules
ENV NPM_CONFIG_BUILD_FROM_SOURCE=false

RUN apt-get update --fix-missing && apt-get install -y --no-install-recommends \
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
    # Standard Puppeteer/Chromium dependencies for WhatsApp-Web
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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies (NPM optimizations for low-resource environments)
RUN npm ci --maxsockets 1 --no-fund --no-audit --loglevel error && \
    npm cache clean --force

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5000

CMD ["node", "index.js"]
