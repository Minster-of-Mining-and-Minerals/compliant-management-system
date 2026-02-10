FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production && npm install -g sequelize-cli

COPY . .

EXPOSE 4000

CMD ["npm", "start"]

