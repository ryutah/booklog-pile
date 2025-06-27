# Dockerfile for Next.js application with pnpm and Prisma (SQLite)

# ---- Base Image ----
# Use a specific version of Node for reproducibility.
# 'slim' is a good choice for smaller image sizes.
FROM node:24-slim AS base

# Set working directory for all subsequent commands
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm


# ---- Dependencies Stage ----
# Install dependencies in a separate step to leverage Docker's caching.
# This layer is rebuilt only when package.json or pnpm-lock.yaml changes.
FROM base AS deps

# Copy package manager files from the 'web' subdirectory
COPY web/package.json web/pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for the build)
RUN pnpm install --frozen-lockfile


# ---- Builder Stage ----
# Build the application.
FROM base AS builder

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the application source code from the 'web' subdirectory
COPY web .

# Generate Prisma Client. This is required before building the app.
RUN pnpm exec prisma generate

# Run database migrations.
# This creates the SQLite database file with the latest schema.
# The DATABASE_URL is defined in prisma/schema.prisma and points to a file
# which will be created at ./prisma/dev.db relative to the project root.
RUN pnpm exec prisma migrate deploy

# Build the Next.js application for production
RUN pnpm build


# ---- Runner Stage ----
# Create the final, smaller production-ready image.
FROM base AS runner

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV production

# Create a non-root user and group for better security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package manager files from the 'web' subdirectory
COPY web/package.json web/pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy the built application from the 'builder' stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json

# Copy Prisma schema and the migrated database from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Change ownership of all files to the non-root user
RUN chown -R nextjs:nodejs .

# Switch to the non-root user
USER nextjs

# Expose the port the app will run on
EXPOSE 3000

# The command to start the application
CMD ["pnpm", "start"]
