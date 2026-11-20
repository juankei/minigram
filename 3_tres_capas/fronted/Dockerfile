FROM node:24.21-alpine3.24

WORKDIR /app

COPY package*.json ./

RUN npm ci &&  npm install http-server -g

COPY . .

RUN npm run build --prod

EXPOSE 4200

CMD  http-server dist/fronted/browser -p 4200 -a 0.0.0.0

