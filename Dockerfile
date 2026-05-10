FROM node:22-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy data directory (local JSON fallback)
COPY data/ ./data/

EXPOSE 3001

WORKDIR /app/backend
CMD ["node", "src/server.js"]
