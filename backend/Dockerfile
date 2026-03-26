# ================================================
# GlossCut Backend — Coolify-compatible Dockerfile
# Bypasses nixpacks entirely for a stable build
# ================================================
FROM node:20-slim

# Install all C++ build dependencies AND Chromium dependencies for WhatsApp/Puppeteer
ENV DEBIAN_FRONTEND=noninteractive

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
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies (npm ci is faster & more reproducible than npm install)
RUN npm ci --no-fund --no-audit

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5000

CMD ["node", "index.js"]
