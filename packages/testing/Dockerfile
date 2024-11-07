FROM node:18-alpine
WORKDIR /usr/src/app

COPY package.json ./

RUN npm install -g pnpm 
RUN pnpm install 

COPY . .

EXPOSE 8080

CMD ["pnpm", "start-prod", "--signal=SIGINT"]