FROM node:20-alpine
WORKDIR /app
# better-sqlite3 네이티브 빌드용 투체인
# alpine 기본엔 python/make/g++ 없음
RUN apk add --no-cache python3 make g++ libc6-compat
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
# 영속화 디트터리 (PERSONA_DB_PATH 기본이 ./data/...)
RUN mkdir -p /app/data
ENV PORT=8080
EXPOSE 8080
CMD ["node", "src/server.js"]
