from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from config import Config
from database import db, bcrypt
from models import User, RedFlag, Intervention

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for all routes and methods
CORS(app, supports_credentials=True)

db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)
migrate = Migrate(app, db)

# Import and register routes
from routes import auth_routes, report_routes, admin_routes
app.register_blueprint(auth_routes, url_prefix="/api/auth")
app.register_blueprint(report_routes, url_prefix="/api/reports")
app.register_blueprint(admin_routes, url_prefix="/api/admin")

@app.route("/")
def home():
    return jsonify({"message": "Welcome to the iReporter API"}), 200

if __name__ == "__main__":
    app.run(debug=True)
