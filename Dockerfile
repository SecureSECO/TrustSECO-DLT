FROM node:16.14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

EXPOSE 8000
EXPOSE 8080
EXPOSE 8001

CMD [ "npm", "run", "start" ]

