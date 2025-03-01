from datetime import datetime
import json
from enum import Enum
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import UserMixin

# Initialize extensions
db = SQLAlchemy()
bcrypt = Bcrypt()

# Enums for status fields
class Status(Enum):
    DRAFT = 'Draft'
    UNDER_INVESTIGATION = 'Under Investigation'
    REJECTED = 'Rejected'
    RESOLVED = 'Resolved'

# Serializer Mixin
class SerializerMixin:
    """Mixin for serializing SQLAlchemy models to dictionaries and JSON."""
    def serialize(self, exclude=None):
        """Serialize the model to a dictionary."""
        if exclude is None:
            exclude = []
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
            if column.name not in exclude
        }

    def serialize_json(self, exclude=None):
        """Serialize the model to a JSON string."""
        return json.dumps(self.serialize(exclude=exclude))

# User Model
class User(db.Model, UserMixin, SerializerMixin):
    """Represents a user in the system."""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(512), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)  # Required for Flask-Login
    
    # Relationships
    red_flags = db.relationship('RedFlag', backref='user', lazy=True)
    interventions = db.relationship('Intervention', backref='user', lazy=True)
    notifications = db.relationship('Notification', back_populates='user')

    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Check if the provided password matches the stored hash."""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def get_id(self):
        """Return the user's ID as a string (required by Flask-Login)."""
        return str(self.id)

# RedFlag Model
class RedFlag(db.Model, SerializerMixin):
    """Represents a red flag reported by a user."""
    __tablename__ = 'red_flags'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Enum(Status), default=Status.DRAFT.name, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)  # ✅ Added image_url field
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    media = db.relationship('Media', backref='redflag', lazy=True)

# Intervention Model
class Intervention(db.Model, SerializerMixin):
    """Represents an intervention reported by a user."""
    __tablename__ = 'interventions'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Enum(Status), default=Status.DRAFT.name, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)  # ✅ Added image_url field
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Relationships
    media = db.relationship('Media', backref='intervention', lazy=True)

# Media Model (for images/videos)
class Media(db.Model, SerializerMixin):
    """Represents media files (images/videos) associated with red flags or interventions."""
    __tablename__ = 'media'

    id = db.Column(db.Integer, primary_key=True)
    file_url = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # Image or Video
    redflag_id = db.Column(db.Integer, db.ForeignKey('red_flags.id'), nullable=True)
    intervention_id = db.Column(db.Integer, db.ForeignKey('interventions.id'), nullable=True)

    def __init__(self, **kwargs):
        """Ensure media belongs to either a RedFlag or an Intervention."""
        super().__init__(**kwargs)
        if not self.redflag_id and not self.intervention_id:
            raise ValueError("Media must belong to either a RedFlag or an Intervention.")

# Notification Model
class Notification(db.Model, SerializerMixin):
    """Represents a notification sent to a user."""
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='notifications')
