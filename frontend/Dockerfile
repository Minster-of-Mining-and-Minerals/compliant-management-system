# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_BASE_URL=https://172.31.102.108/api
ARG NEXT_PUBLIC_FILE_URL=https://172.31.102.108
ARG NEXT_PUBLIC_FRONTEND_URL=https://172.31.102.108
ARG NEXT_PUBLIC_SYSTEM_TIMEZONE=Africa/Addis_Ababa

ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_FILE_URL=$NEXT_PUBLIC_FILE_URL
ENV NEXT_PUBLIC_FRONTEND_URL=$NEXT_PUBLIC_FRONTEND_URL
ENV NEXT_PUBLIC_SYSTEM_TIMEZONE=$NEXT_PUBLIC_SYSTEM_TIMEZONE

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
