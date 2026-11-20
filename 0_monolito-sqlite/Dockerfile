FROM node:24.21-alpine3.24

WORKDIR /app

COPY . .

RUN apk add --no-cache python3 make g++

RUN npm ci

EXPOSE 3000

CMD npm run db-init && npm start