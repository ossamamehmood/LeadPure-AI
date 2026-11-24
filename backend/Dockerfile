# LeadPure SMTP Verification Backend
# Multi-stage lightweight Node 22 Alpine container for VPS deployment with Port 25 access

FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.ts ./

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["npm", "start"]
