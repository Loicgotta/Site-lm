FROM node:20-alpine

# Build arguments for Vite (needed at build time)
ARG VITE_GEMINI_API_KEY
ARG VITE_FAL_KEY
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_CLIENT_SECRET

# Set as environment variables for build
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_FAL_KEY=$VITE_FAL_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_SECRET=$VITE_GOOGLE_CLIENT_SECRET

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Vite frontend
RUN npm run build

# Expose port
EXPOSE 80

# Set PORT for the server
ENV PORT=80

# Start the Express server
CMD ["npm", "start"]
