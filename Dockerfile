# Use Node.js to build the React frontend
FROM node:16-alpine as build-frontend

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js ./
COPY postcss.config.js ./

# Build the frontend
RUN npm run build

# Setup Python backend with the built frontend
FROM python:3.9-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY main.py models.py reportGen.py ./

# Copy templates for legacy views
COPY templates/ ./templates/

# Copy the built frontend from the first stage
COPY --from=build-frontend /app/build/ ./build/

# Set environment variables
ENV FLASK_ENV=production
ENV PORT=8000

# Expose the port
EXPOSE 8000

# Start the application with Gunicorn
CMD gunicorn main:app --bind 0.0.0.0:$PORT 