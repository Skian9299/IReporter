from flask import Flask
from flask_jwt_extended import JWTManager
from flask_restful import Api
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from models import db
from flask_cors import CORS
from datetime import timedelta
import os
import resend

from routes.auth_routes import init_auth_routes

from routes.report_routes import report_routes

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reports.db'
app.config['SECRET_KEY'] = 'your_strong_secret_key'
app.config["JWT_SECRET_KEY"] = 'your_jwt_secret_key'
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=2)

resend.api_key = os.getenv("RESEND_API_KEY")

jwt = JWTManager(app)
db.init_app(app)
migrate = Migrate(app, db)

api = Api(app)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "https://ireporter0.netlify.app"}})

@app.route('/')
def index():
    return '<h1>Ireporter</h1>'

init_auth_routes(app, bcrypt)
report_routes(app)

if __name__ == '__main__':
    app.run(port=5000, debug=True)