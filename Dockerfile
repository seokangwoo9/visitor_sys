# syntax=docker/dockerfile:1

# ---- builder ----
# Builds the Next.js application and generates the Prisma client.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# openssl is required by the Prisma schema engine.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies with a clean, reproducible install.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build.
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner ----
# Runs the built application. Migrations are applied on start.
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy the full built application from the builder stage.
# tsx remains available so the admin seed script can be run as a one-off.
COPY --from=builder /app ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
