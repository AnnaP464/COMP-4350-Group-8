FROM node:20
COPY / /backend
WORKDIR /backend
RUN npm install --include=dev
CMD ["npm", "run", "dev"]
EXPOSE 3000