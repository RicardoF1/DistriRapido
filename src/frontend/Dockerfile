FROM node:24-bookworm-slim AS build
WORKDIR /app/src/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/index.html src/frontend/tsconfig.json src/frontend/vite.config.ts ./
COPY src/frontend/src ./src
COPY geodata/coverage.ts geodata/coverage-release.json /app/geodata/
COPY geodata/coverage/v1/ /app/geodata/coverage/v1/
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.28-alpine
COPY src/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/src/frontend/dist /usr/share/nginx/html
EXPOSE 80
