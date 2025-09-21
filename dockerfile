FROM node:lts-alpine
WORKDIR /webbase
COPY . .
RUN npm install
CMD ["npm", "start"]
