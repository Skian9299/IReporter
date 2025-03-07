from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy import Enum as SQLEnum
from werkzeug.security import generate_password_hash, check_password_hash
import enum 

# Initialize database
db = SQLAlchemy()

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'  # Explicitly set table name to "users"
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

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
    latitude = db.Column(db.Float,  nullable=False)
    longitude = db.Column(db.Float,  nullable=False)
    status = db.Column(SQLEnum(Status), default=Status.DRAFT, nullable=False)
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
    latitude = db.Column(db.Float,  nullable=False)
    longitude = db.Column(db.Float,  nullable=False)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(SQLEnum(Status), default=Status.DRAFT, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
