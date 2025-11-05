FROM node:20
COPY / /api
WORKDIR /api
RUN npm install --verbose
CMD ["npm", "run", "dev"]
EXPOSE 4000