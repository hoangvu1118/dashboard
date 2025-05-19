import paho.mqtt.client as mqtt
import json
import time
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from config import MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_TOPIC, MQTT_CLIENT_ID, POLLING_INTERVAL
from app.database import SessionLocal, add_sensor_reading

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mqtt_client")

# Global variable to track the last poll time
last_poll_time = datetime.now() - timedelta(minutes=5)  # Initialize to allow immediate polling
processing_lock = False  # Simple lock to prevent concurrent processing


class MQTTClient:
    def __init__(self):
        self.client = mqtt.Client(client_id=MQTT_CLIENT_ID)
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.connected = False
        self.latest_messages = {}  # Store the latest message for each sensor
        
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Connected to MQTT broker")
            self.connected = True
            client.subscribe(MQTT_TOPIC)
        else:
            logger.error(f"Failed to connect to MQTT broker with code {rc}")
            self.connected = False

    def on_message(self, client, userdata, msg):
        try:
            # Parse message
            payload = msg.payload.decode('utf-8')
            message_dict = json.loads(payload)
            
            # Store the latest message for each sensor
            sensor_id = message_dict.get('sensor_id')
            if sensor_id:
                self.latest_messages[sensor_id] = message_dict
                logger.info(f"Received message from sensor {sensor_id}")
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    def connect(self):
        try:
            self.client.connect(MQTT_BROKER_HOST, MQTT_BROKER_PORT)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"Error connecting to MQTT broker: {e}")
            
    def disconnect(self):
        if self.connected:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("Disconnected from MQTT broker")
            
    def process_messages(self):
        """Process the latest messages from all sensors and store them in the database"""
        global last_poll_time, processing_lock
        
        # Check if it's time to process (based on polling interval)
        current_time = datetime.now()
        time_since_last_poll = (current_time - last_poll_time).total_seconds()
        
        if time_since_last_poll < POLLING_INTERVAL:
            # Not time to poll yet
            return
            
        # Use a simple lock to prevent concurrent processing
        if processing_lock:
            logger.info("Processing already in progress, skipping")
            return
            
        try:
            processing_lock = True
            last_poll_time = current_time
            
            if not self.latest_messages:
                logger.info("No messages to process")
                return
                
            logger.info(f"Processing {len(self.latest_messages)} sensor messages")
            
            # Create a new database session
            db = SessionLocal()
            try:
                # Process each latest message
                new_readings = []
                for sensor_id, message in self.latest_messages.items():
                    is_new, reading = add_sensor_reading(db, message)
                    if is_new and reading:
                        new_readings.append(reading)
                        
                if new_readings:
                    logger.info(f"Added {len(new_readings)} new sensor readings to database")
                else:
                    logger.info("No new readings added (timestamps unchanged)")
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error processing messages: {e}")
        finally:
            processing_lock = False


# Create a global MQTT client instance
mqtt_client = MQTTClient()
