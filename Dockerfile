FROM node:12.22.9-alpine

RUN apk add --update python3 make g++\
   && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

EXPOSE 8000
EXPOSE 8080

CMD [ "node", "index.js" ]

