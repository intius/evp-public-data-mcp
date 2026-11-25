FROM node:22-alpine

LABEL io.modelcontextprotocol.server.name="io.github.intius/evp-public-data-mcp"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY server.js ./

USER node
CMD ["node", "server.js"]
