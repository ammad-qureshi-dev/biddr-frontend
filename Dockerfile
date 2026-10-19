# syntax=docker/dockerfile:1
# Production image for the Bidder frontend (Next.js standalone output).
#
#   docker build --build-arg API_URL=https://api.example.com -t bidder-frontend .
#   docker run -p 3000:3000 bidder-frontend
#
# The browser calls /api/* on this app and Next proxies it to API_URL (the backend monolith). The
# rewrite is baked in during the build, so each environment with a different backend needs its own
# image. API_GATEWAY_URL is the pre-monolith name, still accepted as a fallback.

FROM node:22-alpine AS deps
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ARG API_URL
ARG API_GATEWAY_URL=https://bidder-application.onrender.com
ENV API_URL=${API_URL:-$API_GATEWAY_URL} \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
