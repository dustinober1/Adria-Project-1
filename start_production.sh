#!/bin/bash
# Production startup script for Adria Style Studio

# Exit on any error
set -e

echo "Starting Adria Style Studio in production mode..."

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Install production dependencies
pip install -r requirements-production.txt

# Run database migrations (or initialization)
python -m backend.init_db

# Start the application with Gunicorn
# Using multiple workers for better performance
exec gunicorn backend.main_production:app \
    -w 4 \
    -k uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload \
    --access-logfile - \
    --error-logfile - \
    --log-level info