from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy import Enum as SQLEnum
import enum 

# Initialize database
db = SQLAlchemy()

# Define status options for reports using Python's Enum
class Status(enum.Enum):  # Use enum.Enum, not sqlalchemy.Enum
    DRAFT = "Draft"
    UNDER_INVESTIGATION = "Under Investigation"
    RESOLVED = "Resolved"
    REJECTED = "Rejected"

# RedFlag Model
class RedFlag(db.Model, SerializerMixin):
    """Represents a red flag reported by a user."""
    __tablename__ = 'red_flags'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    status = db.Column(SQLEnum(Status), default=Status.DRAFT, nullable=False)  # Fix Enum usage
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

# Intervention Model
class Intervention(db.Model, SerializerMixin):
    """Represents an intervention reported by a user."""
    __tablename__ = 'interventions'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(SQLEnum(Status), default=Status.DRAFT, nullable=False)  # Fix Enum usage
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
