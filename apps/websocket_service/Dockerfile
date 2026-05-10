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

FROM oven/bun:1.3.5 AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/package.json /app/bun.lock /app/
COPY apps/websocket_service ./apps/websocket_service
COPY --from=deps /app/apps/websocket_service/node_modules /app/apps/websocket_service/node_modules

WORKDIR /app/apps/websocket_service

EXPOSE 3001

CMD ["bun", "run", "start"]
