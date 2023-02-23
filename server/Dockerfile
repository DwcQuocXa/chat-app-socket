# Stage 1: Build
FROM node:18-alpine AS development
# Add a working directory
RUN mkdir -p /usr/src/app/server
WORKDIR /usr/src/app/server
# Cache and Install dependencies
COPY package.json .
COPY package-lock.json .
RUN npm ci
# Copy app files
COPY . .
# Expose port
EXPOSE 80
# Stage 2: Start the app
CMD [ "npm", "start" ]
