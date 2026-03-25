# ================================================
# GlossCut Backend — Coolify-compatible Dockerfile
# Bypasses nixpacks entirely for a stable build
# ================================================
FROM node:20-slim

# Install all C++ build dependencies for canvas, sharp, tfjs in one layer
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

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies (npm ci is faster & more reproducible than npm install)
RUN npm install --no-fund --no-audit

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 5000

CMD ["node", "index.js"]
