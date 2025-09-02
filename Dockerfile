# Use a base image (e.g., Node.js for a Node.js application)
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Accept build arguments
ARG NODE_ENV=development
ARG SERVICE_PORT=4000

ENV NODE_ENV=${NODE_ENV}
ENV SERVICE_PORT=${SERVICE_PORT}

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

USER root 

# Expose the dynamic port
EXPOSE ${SERVICE_PORT}

# Define the command to run your application
CMD ["npm", "start"]