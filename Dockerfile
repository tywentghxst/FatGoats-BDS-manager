# Stage 1: Build frontend and compile backend
FROM node:20-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Standard Node runtime with Bedrock Dedicated Server dependencies
FROM node:20-slim
WORKDIR /app

# Install Bedrock Dedicated Server system dependencies (compiled for Ubuntu/Debian)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4 \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled frontend assets & backend bundle
COPY --from=builder /app/dist ./dist

# Create storage mounts
RUN mkdir -p /app/bedrock-server /app/uploads

# Expose control panel UI and Bedrock UDP game traffic
EXPOSE 3000
EXPOSE 19132/udp

ENV NODE_ENV=production
ENV PORT=3000

# Volume for complete Bedrock server data persistence (worlds, configurations, behavior & resource packs)
VOLUME /app/bedrock-server

CMD ["node", "dist/server.cjs"]
