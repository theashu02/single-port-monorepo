# syntax=docker/dockerfile:1

FROM oven/bun:1.3.5 AS deps
WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY apps/web_application/package.json apps/web_application/package.json
COPY apps/websocket_service/package.json apps/websocket_service/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN bun install --frozen-lockfile

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/web_application/node_modules /app/apps/web_application/node_modules
COPY . .

ARG NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:3001/ws
ENV NEXT_PUBLIC_WEBSOCKET_URL=$NEXT_PUBLIC_WEBSOCKET_URL
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/web_application
RUN node node_modules/next/dist/bin/next build

FROM oven/bun:1.3.5 AS runner
WORKDIR /app/apps/web_application

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/bun.lock /app/
COPY --from=builder /app/apps/web_application ./
COPY --from=deps /app/apps/web_application/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "run", "start"]
