# Imagem única do monorepo: builda packages + api + web. Os serviços `api` e
# `web` do docker-compose reusam esta imagem com comandos/portas diferentes.
FROM node:22-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl curl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# NEXT_PUBLIC_* é inlinado no build do Next → precisa apontar para a API
# acessível pelo NAVEGADOR (host), não pelo nome de serviço interno.
ARG NEXT_PUBLIC_API_BASE=http://localhost:3001
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE

# Instala deps com o lockfile (melhor cache).
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/web ./apps/web
RUN pnpm install --frozen-lockfile

# Gera o Prisma Client + builda packages/api/web (turbo).
RUN pnpm build

EXPOSE 3000 3001
