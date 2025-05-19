from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import json

from config import DATABASE_URL

# Create SQLAlchemy engine and session
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Hub(Base):
    __tablename__ = "hubs"
    
    id = Column(String, primary_key=True)
    sensors = relationship("Sensor", back_populates="hub")


class Sensor(Base):
    __tablename__ = "sensors"
    
    id = Column(String, primary_key=True)
    hub_id = Column(String, ForeignKey("hubs.id"))
    hub = relationship("Hub", back_populates="sensors")
    readings = relationship("SensorReading", back_populates="sensor")


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    sensor_id = Column(String, ForeignKey("sensors.id"))
    temp = Column(Float)
    humidity = Column(Float)
    moisture = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    sensor = relationship("Sensor", back_populates="readings")
    
    @classmethod
    def from_mqtt_message(cls, message_dict):
        # Extract date components
        date_dict = message_dict.get('date', {})
        timestamp = datetime(
            year=date_dict.get('year', 1970),
            month=date_dict.get('month', 1),
            day=date_dict.get('day', 1),
            hour=date_dict.get('hour', 0),
            minute=date_dict.get('minute', 0),
            second=date_dict.get('second', 0)
        )
        
        return cls(
            sensor_id=message_dict.get('sensor_id'),
            temp=message_dict.get('temp'),
            humidity=message_dict.get('humidity'),
            moisture=message_dict.get('moisture'),
            timestamp=timestamp
        )


# Create tables
def init_db():
    Base.metadata.create_all(bind=engine)


# Helper function to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Helper functions for data access
def get_latest_reading_timestamp(db, sensor_id):
    """Get the timestamp of the latest reading for a sensor"""
    from sqlalchemy import desc
    reading = db.query(SensorReading).filter(
        SensorReading.sensor_id == sensor_id
    ).order_by(desc(SensorReading.timestamp)).first()
    
    return reading.timestamp if reading else None


def add_sensor_reading(db, message_dict):
    """Process an MQTT message and add it to the database if it's new"""
    sensor_id = message_dict.get('sensor_id')
    hub_id = message_dict.get('hub_id')
    
    # Check if the hub exists, create if not
    hub = db.query(Hub).filter(Hub.id == hub_id).first()
    if not hub:
        hub = Hub(id=hub_id)
        db.add(hub)
        db.commit()
    
    # Check if the sensor exists, create if not
    sensor = db.query(Sensor).filter(Sensor.id == sensor_id).first()
    if not sensor:
        sensor = Sensor(id=sensor_id, hub_id=hub_id)
        db.add(sensor)
        db.commit()
    
    # Extract timestamp from message
    date_dict = message_dict.get('date', {})
    new_timestamp = datetime(
        year=date_dict.get('year', 1970),
        month=date_dict.get('month', 1),
        day=date_dict.get('day', 1),
        hour=date_dict.get('hour', 0),
        minute=date_dict.get('minute', 0),
        second=date_dict.get('second', 0)
    )
    
    # Check if this is a new reading (different timestamp)
    latest_timestamp = get_latest_reading_timestamp(db, sensor_id)
    
    if latest_timestamp is None or new_timestamp != latest_timestamp:
        # This is a new reading, save it
        reading = SensorReading.from_mqtt_message(message_dict)
        db.add(reading)
        db.commit()
        return True, reading
    
    return False, None


def get_all_sensors(db):
    """Get a list of all sensors"""
    return db.query(Sensor).all()


def get_sensor_readings(db, sensor_id, limit=100):
    """Get readings for a specific sensor"""
    from sqlalchemy import desc
    return db.query(SensorReading).filter(
        SensorReading.sensor_id == sensor_id
    ).order_by(desc(SensorReading.timestamp)).limit(limit).all()
