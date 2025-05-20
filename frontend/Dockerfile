# Use a specific Node.js version, Alpine for smaller size
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies needed for 'vite')
RUN npm install

# Expose the Vite development server port
EXPOSE 3000

# Command to run the development server (relies on code being mounted at /app)
# The '--host' flag makes Vite listen on all network interfaces within the container
CMD ["npm", "run", "dev", "--", "--host"]