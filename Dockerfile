FROM node:18-alpine
WORKDIR /usr/src/app

# We do this to avoid npm install when we're only changing code
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]
RUN npm ci

# Everything else
COPY . .

EXPOSE 3000

CMD ["node", "app.js"]
