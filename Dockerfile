# Use KasmVNC as a base for browser access
FROM kasmweb/core-ubuntu-focal:1.15.0

USER root

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs 

# Install Electron dependencies
RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libnss3 \
    libasound2 \
    libxss1 \
    libxtst6 \
    libxkbfile1 \
    libsecret-1-0 \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including electron)
RUN npm install

# Copy source code
COPY . .

# Build the frontend and electron main
RUN npx tsc && npx vite build

# Create data directory
RUN mkdir -p /app/data && chmod 777 /app/data

# Environment variables for Kasm
ENV VNC_WIDTH=1400
ENV VNC_HEIGHT=900
ENV VNC_DEPTH=24

# Launcher script
RUN echo "#!/bin/bash\n\
cd /app\n\
# Start Electron using the built JS files\n\
./node_modules/.bin/electron ./dist-electron/main.js --no-sandbox\n\
" > /dockerstartup/custom_startup.sh \
    && chmod +x /dockerstartup/custom_startup.sh

# The base image already has a startup sequence. 
# We tell it to run our custom script as the main app.
ENV STARTUP_COMMAND="/dockerstartup/custom_startup.sh"

WORKDIR /home/kasm-user
USER 1000
