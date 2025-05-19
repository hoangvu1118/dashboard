from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from datetime import datetime

from app.database import get_db, get_all_sensors, get_sensor_readings

router = APIRouter()


@router.get("/sensors")
def get_sensors(db: Session = Depends(get_db)):
    """Get a list of all sensors"""
    sensors = get_all_sensors(db)
    return [{"id": sensor.id, "hub_id": sensor.hub_id} for sensor in sensors]


@router.get("/sensors/{sensor_id}/readings")
def get_readings_for_sensor(sensor_id: str, limit: int = 100, db: Session = Depends(get_db)):
    """Get readings for a specific sensor"""
    readings = get_sensor_readings(db, sensor_id, limit)
    
    # Convert readings to JSON serializable format
    result = []
    for reading in readings:
        result.append({
            "id": reading.id,
            "temp": reading.temp,
            "humidity": reading.humidity,
            "moisture": reading.moisture,
            "timestamp": reading.timestamp.isoformat()
        })
    
    return result


@router.get("/sensors/{sensor_id}/chart-data")
def get_chart_data_for_sensor(sensor_id: str, limit: int = 100, db: Session = Depends(get_db)):
    """Get chart-ready data for a specific sensor"""
    readings = get_sensor_readings(db, sensor_id, limit)
    
    # Prepare data in a format suitable for charts
    timestamps = []
    temp_data = []
    humidity_data = []
    moisture_data = []
    
    # Reverse to get chronological order
    for reading in reversed(readings):
        timestamps.append(reading.timestamp.isoformat())
        temp_data.append(reading.temp)
        humidity_data.append(reading.humidity)
        moisture_data.append(reading.moisture)
    
    return {
        "timestamps": timestamps,
        "temperature": temp_data,
        "humidity": humidity_data,
        "moisture": moisture_data
    }
