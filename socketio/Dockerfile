# Use the official Node.js image
FROM node:18

# Set the working directory
WORKDIR /app

# Install Chromium and its dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the CHROME_PATH environment variable
ENV CHROME_PATH=/usr/bin/chromium

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Install Lighthouse CLI globally
RUN npm install -g lighthouse@latest

# Copy the rest of the application code
COPY . .

# Expose the port for the Socket.IO server
EXPOSE 3000

# Start the Node.js application
CMD ["node", "index.js"]
