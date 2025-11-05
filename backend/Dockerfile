FROM node:20
COPY / /backend
WORKDIR /backend
RUN npm install --verbose
CMD ["npm", "run", "dev"]
EXPOSE 4000