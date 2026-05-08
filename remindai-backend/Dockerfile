FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S remindai && adduser -S remindai -G remindai

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for current platform
RUN npx prisma generate

USER remindai

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
