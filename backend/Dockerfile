# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source and build
COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Non-root user for security
USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]
