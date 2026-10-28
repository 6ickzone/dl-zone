# Multi-stage Dockerfile for Cloud Run
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy application source code
COPY . .

# Build the frontend production bundle (outputs to /app/dist)
RUN npm run build

# Production runner stage
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled frontend dist from builder
COPY --from=builder /app/dist ./dist

# Copy server and config
COPY server.ts ./
COPY tsconfig.json ./

# Expose standard Cloud Run port
EXPOSE 8080

# Start production server
CMD ["npx", "tsx", "server.ts"]
