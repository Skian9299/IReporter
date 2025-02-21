from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate  # Import Flask-Migrate

db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()  # Initialize Flask-Migrate
