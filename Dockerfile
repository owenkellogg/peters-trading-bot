FROM node:9.4.0

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

RUN npm install -g typescript

RUN npm install -g ts-node

# Install app dependencies
COPY package.json /usr/src/app/

RUN npm install

# Bundle app source
COPY . /usr/src/app

# Build the project from typscript source
CMD ts-node index.ts

