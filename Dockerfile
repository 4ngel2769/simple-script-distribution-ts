FROM node:22-alpine

WORKDIR /app

RUN npm install -g npm@latest

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p data/scripts

# Set permissions
RUN chmod -R 755 data

# Build the application
RUN npm run build

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
