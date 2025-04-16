FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# main port
EXPOSE 8000
# rpc
EXPOSE 8080
# dashboard plugin
EXPOSE 8001

CMD [ "./bin/run", "start" ]
