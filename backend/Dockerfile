# Use a specific Node.js version, Alpine for smaller size
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for 'npm run dev')
RUN npm install

# Expose the port the application listens on
EXPOSE ${BACKEND_PORT:-5000}

# Default command (relies on code being mounted at /app)
CMD ["npm", "run", "dev"]