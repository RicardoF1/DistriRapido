FROM node:24-bookworm-slim AS build
WORKDIR /app/src/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/index.html src/frontend/tsconfig.json src/frontend/vite.config.ts src/frontend/coverage-assets.ts ./
COPY src/frontend/src ./src
COPY test-fixtures/coverage-synthetic.json /app/test-fixtures/coverage-synthetic.json
COPY geodata/coverage.ts geodata/coverage-release.json /app/geodata/
COPY geodata/coverage/v1/ /app/geodata/coverage/v1/
# La API se consume en el mismo origen a través del proxy /api de nginx.
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.28-alpine
# Plantilla procesada por el entrypoint oficial de nginx. PORT lo fija Render en producción;
# API_UPSTREAM es la URL del backend (en Docker Compose, el servicio backend).
COPY src/frontend/nginx.conf /etc/nginx/templates/default.conf.template
ENV PORT=80 API_UPSTREAM=http://backend:3000
COPY --from=build /app/src/frontend/dist /usr/share/nginx/html
EXPOSE 80

