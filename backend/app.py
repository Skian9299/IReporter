from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
from dotenv import load_dotenv
from models import db
from routes import register_routes

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# ---------- CONFIGURATION ---------- #
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'supersecretkey')
app.config['UPLOAD_FOLDER'] = os.path.abspath('uploads')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['DEBUG'] = True  # Enable debug mode

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ---------- INITIALIZE EXTENSIONS ---------- #
db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Proper CORS Configuration
CORS(app, resources={r"/*": {
    "origins": "http://localhost:3000",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
}}, supports_credentials=True)

# Register routes
register_routes(app)

# ---------- RUN APP ---------- #
if __name__ == '__main__':
    print("🔥 Flask server is running in DEBUG mode...")
    app.run(debug=True)
