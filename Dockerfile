FROM node:20-slim

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm install

# Copy the rest of the application
COPY backend/ .

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "app.js"] 