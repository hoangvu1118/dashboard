"""
Sensor Monitoring System initialization script
This script will set up the necessary environment and start the server
"""
import os
import sys
import uvicorn

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import our application
from app.main import app

if __name__ == "__main__":
    print("Starting Sensor Monitoring System...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
