# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies first so this layer is cached unless
# package.json/package-lock.json actually change.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "index.js"]
