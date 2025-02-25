from datetime import datetime
from enum import Enum
from database import db  # ✅ Correct import

# Enum for Report Status
class ReportStatus(Enum):
    PENDING = "pending"
    UNDER_INVESTIGATION = "under investigation"
    RESOLVED = "resolved"

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)  
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    redflags = db.relationship('RedFlag', backref='user', lazy="dynamic", cascade="all, delete-orphan")
    interventions = db.relationship('Intervention', backref='user', lazy="dynamic", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.id} - {self.email}>"

# RedFlag Model
class RedFlag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Enum(ReportStatus), default=ReportStatus.PENDING)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"), nullable=False)

    def __repr__(self):
        return f"<RedFlag {self.id} - {self.title}>"

# Intervention Model
class Intervention(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Enum(ReportStatus), default=ReportStatus.PENDING)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete="CASCADE"), nullable=False)

    def __repr__(self):
        return f"<Intervention {self.id} - {self.title}>"
