# ==============================================================================
# 1. BASE STAGE
# ==============================================================================
FROM node:20-alpine AS base

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

# ==============================================================================
# 2. DEVELOPMENT STAGE (Used in local docker-compose development)
# ==============================================================================
FROM base AS development

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000 5555

CMD ["npm", "run", "start:dev"]

# ==============================================================================
# 3. BUILD STAGE (Compiles TypeScript to JavaScript)
# ==============================================================================
FROM base AS build

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# ==============================================================================
# 4. PRODUCTION RUNNER STAGE (Lean, minimal attack surface, non-root user)
# ==============================================================================
FROM node:20-alpine AS production

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

USER node

COPY --chown=node:node --from=build /usr/src/app/package*.json ./
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
