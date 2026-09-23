# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Remove COPY and BUILD commands for development
# COPY . .
# RUN npm run build

EXPOSE 3000

# Use dev command instead of start
CMD ["npm", "run", "dev"]