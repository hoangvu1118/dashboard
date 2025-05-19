from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

# Configuration settings for the application
MQTT_BROKER_HOST = "localhost"
MQTT_BROKER_PORT = 1883
MQTT_TOPIC = "sensors/#"  # Subscribe to all sensor topics
MQTT_CLIENT_ID = "fastapi_sensor_monitor"

# Database settings
DATABASE_URL = "sqlite:///./sensor_data.db"

# Sensor data polling interval in seconds (2 minutes for testing)
POLLING_INTERVAL = 120  # 2 minutes

# Normal polling interval (for production)
NORMAL_POLLING_INTERVAL = 1800  # 30 minutes
