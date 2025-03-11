from datetime import datetime
import enum
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy import Enum as SQLEnum
from werkzeug.security import generate_password_hash, check_password_hash
import enum

# Initialize database
db = SQLAlchemy()

# Define Status enumeration for use in models
class Status(enum.Enum):
    DRAFT = "draft"
    UNDER_INVESTIGATION = "under_investigation"
    RESOLVED = "resolved"
    REJECTED = "rejected"

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(512), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')

    def set_password(self, password):
        """Hash and set the user's password."""
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        """Check the provided password against the stored hash."""
        return check_password_hash(self.password, password)

class RedFlag(db.Model, SerializerMixin):
    """Represents a red flag reported by a user."""
    __tablename__ = 'red_flags'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(50), default='draft')  # draft, under investigation, rejected, resolved
    location = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(8000), nullable= True) 
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
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)  # Allow NULL for user_id
    status = db.Column(db.String(50), default='draft')
    location = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(8000), nullable= True) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
