Sensor Monitoring System

A FastAPI-based web application that monitors sensor data from MQTT, stores it in a database, and displays it through an intuitive web interface with charts.
Features

    MQTT integration for receiving sensor data
    SQLite database for storing sensor readings
    FastAPI backend with RESTful API endpoints
    Simple web UI with minimal JavaScript
    Real-time charts for temperature, humidity, and moisture
    Automatic polling with duplicate data prevention
    Sensor and hub management

Prerequisites

    Python 3.8 or higher
    MQTT broker (e.g., Mosquitto)

Installation

    Clone the repository:

bash

git clone https://github.com/yourusername/sensor-monitoring.git
cd sensor-monitoring

    Create and activate a virtual environment:

bash

python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

    Install the required dependencies:

bash

pip install -r requirements.txt

Configuration

Edit the config.py file to match your MQTT broker settings:

python

MQTT_BROKER_HOST = "localhost"  # Change to your MQTT broker address
MQTT_BROKER_PORT = 1883

Running the Application

    Start an MQTT broker (e.g., Mosquitto) if not already running.
    Run the sensor monitoring system:

bash

python run.py

    The application will be available at http://localhost:8000

Testing with Simulated Data

To test the system without real sensors, you can use the sensor simulator:

bash

python simulate_sensors.py

This will publish simulated sensor data to your MQTT broker every 30 seconds.
How It Works
Data Flow

    Sensor data is published to the MQTT broker in this format:

    json

    {
      "sensor_id": "S-0",
      "hub_id": "H-0",
      "temp": 25.5,
      "humidity": 60.2,
      "moisture": 42.8,
      "date": {
        "year": 2025,
        "month": 5,
        "day": 18,
        "hour": 12,
        "minute": 43,
        "second": 2
      }
    }

    The MQTT client subscribes to these messages and stores them temporarily.
    Every 2 minutes (configurable), the system processes the latest messages and stores them in the database, but only if the timestamp has changed.
    The web interface fetches data from the API and displays it using Chart.js.

Avoiding Duplicate Data

The system implements a few strategies to avoid processing duplicate data:

    Timestamp checking: Only messages with new timestamps are saved to the database.
    Polling interval management: The system processes messages at fixed intervals (2 minutes for testing, 30 minutes for production).
    Processing lock: A simple lock mechanism prevents concurrent processing.

API Endpoints

    GET /api/sensors: Get a list of all sensors
    GET /api/sensors/{sensor_id}/readings: Get readings for a specific sensor
    GET /api/sensors/{sensor_id}/chart-data: Get chart-ready data for a specific sensor

Database Schema

    hubs: Stores information about hubs
    sensors: Stores information about sensors, linked to hubs
    sensor_readings: Stores sensor readings with timestamps

Customization

    Polling Interval: Change the POLLING_INTERVAL in config.py to adjust how often the system checks for new data.
    UI Theme: Modify the CSS in app/static/css/style.css to customize the look and feel.
    Chart Options: Adjust chart settings in app/static/js/charts.js.

Production Deployment

For production deployment, consider:

    Using a production-grade database (PostgreSQL, MySQL)
    Setting up a proper MQTT broker with authentication
    Using a production ASGI server like Gunicorn with Uvicorn workers
    Setting up HTTPS using a reverse proxy like Nginx

License

This project is licensed under the MIT License - see the LICENSE file for details.
