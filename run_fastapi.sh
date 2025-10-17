#!/bin/bash
# Start FastAPI server

cd "$(dirname "$0")"
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
