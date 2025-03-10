from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import enum

# Initialize database
db = SQLAlchemy()

# User Model
class User(db.Model, SerializerMixin):
    __tablename__ = 'users'  # Explicitly set table name to "users"
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(512), nullable=False)
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
    __tablename__ = 'redflags'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(50), default='draft')  # draft, under investigation, rejected, resolved
    location = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(200), nullable= True) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    image_url = db.Column(db.String(200)) 
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    media = db.relationship('Media', backref='redflag', lazy=True)

# Intervention Model
# Intervention Model
class Intervention(db.Model, SerializerMixin):
    __tablename__ = 'interventions'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Allow NULL for user_id
    status = db.Column(db.String(50), default='draft')
    location = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(200), nullable= True) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    media = db.relationship('Media', backref='intervention', lazy=True)


# Media Model (For images/videos)
class Media(db.Model, SerializerMixin):
    __tablename__ = 'media'
    id = db.Column(db.Integer, primary_key=True)
    record_id = db.Column(db.Integer, db.ForeignKey('redflags.id'), nullable=True)
    intervention_id = db.Column(db.Integer, db.ForeignKey('interventions.id'), nullable=True)
    media_type = db.Column(db.String(10), nullable=False)  # image or video
    file_url = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Notification Model
class Notification(db.Model, SerializerMixin):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
