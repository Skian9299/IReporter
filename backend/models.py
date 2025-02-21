from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)  # Quincy is the only admin

class Report(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(255), nullable=True)  # Stores image URL
    location = db.Column(db.String(255), nullable=True)  # Stores Google Maps location
    status = db.Column(db.String(50), default="Under Investigation")  # Default status
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
