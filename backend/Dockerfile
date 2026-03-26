FROM node:20-slim

WORKDIR /app

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
