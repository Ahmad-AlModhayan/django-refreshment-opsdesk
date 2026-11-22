# Lifecycle Stage: Multi-Stage Frontend Build -> Static SPA Bundle Served by Nginx
# Production Invariant (🔴): Ships zero Node/npm toolchain in runtime; only compiled Vite assets + Nginx.
# Trap Prevented (⚠️): Bloated gigabyte frontend containers or running Vite dev server in production.

FROM node:22-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
