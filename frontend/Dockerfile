FROM node:20
COPY / /frontend
WORKDIR /frontend
RUN npm install --verbose
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
EXPOSE 5173