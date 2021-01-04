FROM node:13
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD [ "npm", "start" ]