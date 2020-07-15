FROM node:12.18.2-stretch-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY config.js ./
RUN npm install --only=prod

# Bundle app source
COPY . .

CMD [ "node", "bot" ]
