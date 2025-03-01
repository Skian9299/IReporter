from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from models import db, User, RedFlag, Intervention
from serializers import user_schema, redflag_schema, redflags_schema, intervention_schema, interventions_schema

# Load environment variables
load_dotenv()

app = Flask(__name__)

# ---------- CONFIGURATION ---------- #
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ireporter.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'supersecretkey')
app.config['UPLOAD_FOLDER'] = os.path.abspath('uploads')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ---------- HELPER FUNCTIONS ---------- #
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# ---------- AUTH ROUTES ---------- #
@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        first_name, last_name, email, password = data.get('first_name'), data.get('last_name'), data.get('email'), data.get('password')
        
        if not all([first_name, last_name, email, password]):
            return jsonify({"error": "All fields are required"}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already registered"}), 400

        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(first_name=first_name, last_name=last_name, email=email, password_hash=password_hash)
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity={"id": user.id, "role": "user"})
        return jsonify({"message": "Signup successful", "token": token, "user": user_schema.dump(user)}), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email, password = data.get('email'), data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401

        token = create_access_token(identity={"id": user.id, "role": "admin" if user.is_admin else "user"})
        return jsonify({"message": "Login successful", "token": token, "role": "admin" if user.is_admin else "user", "user": user_schema.dump(user)}), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ---------- REPORT ROUTES (CRUD) ---------- #
@app.route('/redflags', methods=['POST', 'GET'])
@jwt_required()
def redflags():
    current_user = get_jwt_identity()

    if request.method == 'GET':
        user_redflags = RedFlag.query.filter_by(user_id=current_user['id']).all()
        return jsonify(redflags_schema.dump(user_redflags)), 200

    try:
        data = request.form
        title, description = data.get('title'), data.get('description')
        location = data.get('location', 'Unknown')

        if not title or not description:
            return jsonify({"error": "Title and description are required"}), 400

        redflag = RedFlag(title=title, description=description, location=location, user_id=current_user['id'])

        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                redflag.image = filename

        db.session.add(redflag)
        db.session.commit()
        return jsonify({"message": "Red flag created", "redflag": redflag_schema.dump(redflag)}), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/redflags/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def redflag_actions(id):
    current_user = get_jwt_identity()
    redflag = RedFlag.query.filter_by(id=id, user_id=current_user['id']).first()

    if not redflag:
        return jsonify({"error": "Red flag not found"}), 404

    if request.method == 'PUT':
        data = request.form
        redflag.title = data.get('title', redflag.title)
        redflag.description = data.get('description', redflag.description)

        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                redflag.image = filename

        db.session.commit()
        return jsonify({"message": "Red flag updated", "redflag": redflag_schema.dump(redflag)}), 200

    elif request.method == 'DELETE':
        db.session.delete(redflag)
        db.session.commit()
        return jsonify({"message": "Red flag deleted successfully"}), 200

# Same routes for interventions
@app.route('/interventions', methods=['POST', 'GET'])
@jwt_required()
def interventions():
    current_user = get_jwt_identity()

    if request.method == 'GET':
        user_interventions = Intervention.query.filter_by(user_id=current_user['id']).all()
        return jsonify(interventions_schema.dump(user_interventions)), 200

    try:
        data = request.form
        title, description = data.get('title'), data.get('description')

        if not title or not description:
            return jsonify({"error": "Title and description are required"}), 400

        intervention = Intervention(title=title, description=description, user_id=current_user['id'])

        db.session.add(intervention)
        db.session.commit()
        return jsonify({"message": "Intervention created", "intervention": intervention_schema.dump(intervention)}), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/interventions/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def intervention_actions(id):
    current_user = get_jwt_identity()
    intervention = Intervention.query.filter_by(id=id, user_id=current_user['id']).first()

    if not intervention:
        return jsonify({"error": "Intervention not found"}), 404

    if request.method == 'PUT':
        data = request.json
        intervention.title = data.get('title', intervention.title)
        intervention.description = data.get('description', intervention.description)
        db.session.commit()
        return jsonify({"message": "Intervention updated", "intervention": intervention_schema.dump(intervention)}), 200

    elif request.method == 'DELETE':
        db.session.delete(intervention)
        db.session.commit()
        return jsonify({"message": "Intervention deleted successfully"}), 200

# ---------- RUN APP ---------- #
if __name__ == '__main__':
    app.run(debug=True)