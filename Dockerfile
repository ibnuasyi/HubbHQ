# Dockerfile
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies with Prisma schema available for postinstall hook
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy" \
    NEXTAUTH_SECRET="build_dummy_secret_not_real_key_32c" \
    npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/ibnuasyi/HubbHQ"
LABEL org.opencontainers.image.description="HubbHQ - Sistem Informasi Organisasi Modern"
LABEL org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Create uploads directory with appropriate permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads && chmod -R 755 /app/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
