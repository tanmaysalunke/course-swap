# Use an official Node runtime as a parent image
FROM node:alpine3.18

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install any needed packages
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Make port available to the world outside this container
EXPOSE 5000

# Run the app when the container launches
CMD ["npm", "run", "start"]
