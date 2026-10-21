FROM node:20-alpine

WORKDIR /app

# Copy root database first for shared schema & db engine
COPY database ../database

COPY backend/package*.json ./
RUN npm install --production

COPY backend ./

EXPOSE 5000

CMD ["npm", "start"]
