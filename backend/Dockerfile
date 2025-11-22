FROM node:20
WORKDIR /backend
COPY package*.json ./

RUN npm install --include =dev --verbose
COPY . .
CMD ["npm", "run", "dev"]
EXPOSE 3000