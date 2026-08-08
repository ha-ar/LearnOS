FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_USE_MOCK=true
ARG VITE_API_BASE=https://learnos-backend-436256632760.us-central1.run.app
ENV VITE_USE_MOCK=$VITE_USE_MOCK
ENV VITE_API_BASE=$VITE_API_BASE

RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
