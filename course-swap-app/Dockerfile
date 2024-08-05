# Use an official Node runtime as a parent image
FROM node:14 as build

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Build the application for production
RUN npm run build

# Use Nginx to serve the React application
FROM nginx:alpine
COPY build /usr/share/nginx/html
CMD ["nginx", "-g", "daemon off;"]
