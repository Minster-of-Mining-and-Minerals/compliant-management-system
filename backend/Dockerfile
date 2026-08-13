FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install --production

# Install sequelize-cli for migrations if needed at runtime
RUN npm install -g sequelize-cli

# Copy the rest of the application
COPY . .

# Expose API port and Socket.IO port
EXPOSE 4002
EXPOSE 5002

CMD ["npm", "start"]

