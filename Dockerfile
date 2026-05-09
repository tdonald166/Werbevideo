FROM node:20-bookworm-slim

# System dependencies for Chromium (Remotion render) + Sharp + ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    chromium \
    fonts-liberation \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgbm1 \
    libxkbcommon0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libasound2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgtk-3-0 \
    libdrm2 \
    libxshmfence1 \
    libx11-xcb1 \
    && rm -rf /var/lib/apt/lists/*

# Use system Chromium so Remotion doesn't try to download its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV REMOTION_CHROME_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install --omit=dev --include=optional

# Copy rest of the application
COPY . .

# Ensure tmp + out folders exist
RUN mkdir -p out tmp-uploads

EXPOSE 3000

# Use the start script (npm run start = node web/server.mjs)
CMD ["node", "web/server.mjs"]
