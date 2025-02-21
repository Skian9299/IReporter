from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate  # ✅ Import Flask-Migrate
from config import Config
from database import db, bcrypt, migrate  # ✅ Import migrate

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app)

# Initialize extensions
db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)
migrate.init_app(app, db)  # ✅ Attach Flask-Migrate

# Import and register routes
from routes import auth_routes, report_routes, admin_routes

app.register_blueprint(auth_routes)
app.register_blueprint(report_routes)
app.register_blueprint(admin_routes)

if __name__ == "__main__":
    app.run(debug=True)
