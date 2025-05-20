from fastapi import FastAPI, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import asyncio
import threading
import time
from sqlalchemy.orm import Session
from pathlib import Path

from app.database import init_db, get_db, get_all_sensors
from app.mqtt_client import mqtt_client
from app import api

# Create FastAPI app
app = FastAPI(title="Sensor Monitoring System")

# Mount static files
app.mount("/static", StaticFiles(directory=Path(__file__).parent / "static"), name="static")

# Configure Jinja2 templates
templates = Jinja2Templates(directory=Path(__file__).parent / "templates")

# Include API routes
app.include_router(api.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    # Initialize database
    init_db()
    
    # Connect to MQTT broker
    mqtt_client.connect()
    
    # Start a background task to periodically process messages
    asyncio.create_task(periodic_message_processing())


@app.on_event("shutdown")
def shutdown_event():
    # Disconnect from MQTT broker
    mqtt_client.disconnect()


async def periodic_message_processing():
    """Periodically process messages from MQTT"""
    while True:
        mqtt_client.process_messages()
        await asyncio.sleep(10)  # Check every 10 seconds if it's time to process


@app.get("/", response_class=HTMLResponse)
async def index(request: Request, db: Session = Depends(get_db)):
    sensors = get_all_sensors(db)
    
    # Log some debug info
    print(f"Index page loaded. Found {len(sensors)} sensors.")
    if sensors:
        for sensor in sensors:
            print(f"Sensor: {sensor.id}, Hub: {sensor.hub_id}")
    
    return templates.TemplateResponse(
        "index.html", 
        {"request": request, "sensors": sensors}
    )

# Add a debug route at the root level
@app.get("/debug", response_class=HTMLResponse)
async def debug_page(request: Request):
    """Simple debug page to check if system is working"""
    return """
    <html>
        <head><title>Sensor Monitor Debug</title></head>
        <body>
            <h1>Sensor Monitor Debug Page</h1>
            <p>The application is running.</p>
            <p>Check <a href="/api/debug">API debug info</a>.</p>
            <p><a href="/">Go to main page</a></p>
        </body>
    </html>
    """

# Run with: uvicorn app.main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
