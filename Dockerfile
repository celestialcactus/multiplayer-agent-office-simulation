FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY domain ./domain
COPY server ./server
ENV NODE_ENV=production OFFICE_MODE=bedrock
USER node
EXPOSE 8080
CMD ["node", "server/runtime.mjs"]
