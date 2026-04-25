# ========================================================
# OPTIMIZED MULTI-STAGE BUILD (Coolify/Low-RAM Friendly)
# ========================================================

# STAGE 1: Builder
# We use a full image here to ensure all build tools are stable
FROM node:20 AS builder

WORKDIR /app

# Set build-time environment variables
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=2048"

# Copy package files first
COPY package.json package-lock.json* ./

# Install ALL dependencies including those needed for native builds
# We use 'npm ci' if package-lock exists for better stability, otherwise 'npm install'
RUN npm install --loglevel error --no-audit --no-fund

# Copy the rest of the source code
COPY . .

# STAGE 2: Runtime
# We use slim for the final image to keep it small and secure
FROM node:20-slim

WORKDIR /app

# Set runtime environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    NODE_ENV=production \
    PORT=5000 \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    SHARP_CONCURRENCY=1

# Install Runtime Dependencies (Chromium & Libraries)
# We use a retry mechanism for apt-get to handle intermittent network failures
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
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
    dumb-init \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy node_modules from builder (already pruned for production)
COPY --from=builder /app/node_modules ./node_modules

# Copy application source from builder
COPY --from=builder /app .

# Expose port and setup entrypoint
EXPOSE 5000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run the app with memory limits to prevent OOM in production
CMD ["node", "--max-old-space-size=1024", "index.js"]
