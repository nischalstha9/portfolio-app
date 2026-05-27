FROM node:20-alpine AS base

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

FROM base AS development
CMD ["npm", "run", "dev"]

FROM base AS production
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_MAIN_DOMAIN=portfolio.local
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MAIN_DOMAIN=$NEXT_PUBLIC_MAIN_DOMAIN
RUN npm run build
RUN adduser -D appuser
USER appuser
CMD ["npm", "start"]
