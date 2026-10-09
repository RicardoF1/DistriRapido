FROM node:24-bookworm-slim AS build
WORKDIR /app/src/backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY src/backend/package*.json ./
RUN npm ci
COPY src/backend/tsconfig*.json ./
COPY src/backend/prisma ./prisma
RUN npm run prisma:generate
COPY src/backend/scripts/prepare-coverage.cjs ./scripts/prepare-coverage.cjs
COPY geodata/coverage.ts geodata/coverage-release.json /app/geodata/
COPY src/backend/src ./src
RUN npm run build
COPY geodata/coverage/v1/ /app/geodata/coverage/v1/

FROM node:24-bookworm-slim
WORKDIR /app/src/backend
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/src/backend/node_modules ./node_modules
COPY --from=build /app/src/backend/dist ./dist
COPY --from=build /app/src/backend/prisma ./prisma
COPY --from=build /app/src/backend/src/roles ./src/roles
COPY --from=build /app/src/backend/package*.json ./
COPY --from=build /app/src/backend/tsconfig.json ./
COPY --from=build /app/geodata/coverage/v1/ /app/geodata/coverage/v1/
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
