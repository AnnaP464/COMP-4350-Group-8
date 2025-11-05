FROM node:20
COPY / /front-end
WORKDIR /front-end
RUN npm install --verbose
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
EXPOSE 5173