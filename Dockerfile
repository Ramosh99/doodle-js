# Use the official Node.js image with a specific version as a base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if available) to /app
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production

# Copy the rest of your application code to the container
COPY . .

# Expose the port that your app runs on (if needed)
EXPOSE 3000

# Define the command to run your app using CMD which runs `npm start` for production
# and `npm run dev` for development environments
CMD ["npm", "run", "dev"]