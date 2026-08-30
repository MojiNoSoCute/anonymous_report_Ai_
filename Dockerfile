# Stage 1: Build Frontend and Backend
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package configurations
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build application (Vite frontend + esbuild backend)
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Expose the application port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
