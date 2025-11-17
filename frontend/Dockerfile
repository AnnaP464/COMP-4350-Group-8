FROM node:20

WORKDIR /frontend
COPY package*.json ./
RUN npm install --verbose

COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
EXPOSE 5173