FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including devDependencies needed for ng serve)
RUN npm install

# Copy all local files to the container (will be overridden by Docker volumes in dev)
COPY . .

# Expose port 4200
EXPOSE 4200

# Start the Angular development server binding to all network interfaces
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"]
