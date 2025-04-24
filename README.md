# SPF Keyhole Tracker

A dark, sci-fi styled web application for tracking keys across multiple units. Built for free-tier deployment.

## Features

- **Dark Sci-Fi Interface**: Black background with neon accents and sharp-cornered buttons
- **Real-time Key Status Tracking**: Monitor 54 keys per company with color-coded status indicators
- **Persistent Storage**: SQLite database that persists key status changes
- **Report Generation**: Create and copy clipboard-ready text reports
- **Classroom Key Tracking**: Special handling for keys 51-54 (classroom keys)
- **Free-Tier Deployment Ready**: Optimized for Render, Railway, or Fly.io free hosting plans

## Tech Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Database | SQLite | No external service required, works on free hosting tiers |
| Backend | Flask + Flask-CORS | Lightweight API with minimal resource usage |
| Frontend | React + Tailwind CSS | Modern UI with dark theme, pre-built and served by same container |
| Deployment | Single container | One free service/dyno is enough |

## Local Development

### Prerequisites

- Node.js 14+ and npm
- Python 3.9+

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/spf-keyhole-tracker.git
   cd spf-keyhole-tracker
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Start the development server:
   ```
   # Terminal 1 - Start React dev server
   npm start
   
   # Terminal 2 - Start Flask API
   export FLASK_ENV=development
   python main.py
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Deployment

### Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Fork this repository to your GitHub account
2. Click the "Deploy to Render" button
3. Follow the prompts to connect your GitHub account
4. Render will automatically build and deploy the application

### Manual Deployment

You can also deploy manually to any platform that supports Docker:

1. Build the Docker image:
   ```
   docker build -t keytracker .
   ```

2. Run the container:
   ```
   docker run -p 8000:8000 -e PORT=8000 -e FLASK_ENV=production keytracker
   ```

## Free-Tier Hosting Options

This application is designed to run on free tiers of several platforms:

- **Render**: Free web service with 750 hours/month
- **Railway**: Free tier with limited hours
- **Fly.io**: Free allowance for small apps
- **Heroku**: Can run on free dynos if available

## License

Made by 197 OBIC Irfan Mirzan - PayNow: 84810703
