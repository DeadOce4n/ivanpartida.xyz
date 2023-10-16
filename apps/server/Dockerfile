FROM node:18-bookworm-slim AS base

RUN corepack enable
RUN corepack prepare pnpm@latest-8 --activate
WORKDIR /home/node/app

COPY package.json pnpm-lock.yaml ./
ARG CI="true"
RUN pnpm install --prod --frozen-lockfile
COPY . .

RUN chown -R node:node /home/node/app
USER node
EXPOSE 9001

CMD ["npm", "run", "start"]
