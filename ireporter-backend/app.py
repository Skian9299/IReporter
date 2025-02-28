from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from models import db, User, RedFlag, Intervention, Media
from serializers import user_schema, redflag_schema, redflags_schema, intervention_schema, interventions_schema

# Load environment variables
load_dotenv()

app = Flask(__name__)

# ---------- CONFIGURATION ---------- #
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://ireporterdb_c6il_user:P9yvpo9BYESyuSYfgkW2npIxWAIj2GGM@dpg-cv0ahopopnds73b71tr0-a.oregon-postgres.render.com/ireporterdb_c6il') 
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'supersecretkey')  # Use environment variables
app.config['UPLOAD_FOLDER'] = os.path.abspath('uploads')  # Ensure absolute path
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}

# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Enable CORS for frontend
CORS(app, resources={r"/*": {"origins": "https://ireporter-1-07fm.onrender.com"}}, supports_credentials=True)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ---------- HELPER FUNCTIONS ---------- #

def allowed_file(filename):
    """Check if a file is allowed for upload."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.errorhandler(400)
def handle_400_error(e):
    return jsonify({"error": "Bad Request"}), 400

@app.errorhandler(401)
def handle_401_error(e):
    return jsonify({"error": "Unauthorized"}), 401

@app.errorhandler(403)
def handle_403_error(e):
    return jsonify({"error": "Forbidden"}), 403

@app.errorhandler(404)
def handle_404_error(e):
    return jsonify({"error": "Not Found"}), 404

@app.errorhandler(500)
def handle_500_error(e):
    return jsonify({"error": "Internal Server Error"}), 500

# ---------- AUTH ROUTES ---------- #

@app.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.json
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    password = data.get('password')

    if not first_name or not last_name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email is already registered"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    new_user = User(first_name=first_name, last_name=last_name, email=email, password_hash=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()
    
    token = create_access_token(identity={"id": new_user.id, "email": new_user.email})
    
    return jsonify({
        "message": "User registered successfully!",
        "token": token,
        "user": {
            "id": new_user.id,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "email": new_user.email
        }
    }), 201


@app.route('/login', methods=['POST'])
def login():
    """Log in a user and return JWT token."""
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid credentials"}), 401

        token = create_access_token(identity={"id": user.id, "role": "admin" if user.is_admin else "user"})

        return jsonify({
            "message": "Login successful",
            "token": token,
            "role": "admin" if user.is_admin else "user",
            "user": user_schema.dump(user)
        }), 200

    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ---------- RED FLAG CRUD ROUTES ---------- #

@app.route('/redflags', methods=['POST'])
@jwt_required()
def create_redflag():
    """Create a new red flag with optional image upload."""
    try:
        current_user = get_jwt_identity()
        title = request.form.get('title') or request.json.get('title')
        description = request.form.get('description') or request.json.get('description')
        location = request.form.get('location') or request.json.get('location', 'Unknown')
        image_url = None

        if not title or not description:
            return jsonify({"error": "Title and description are required"}), 400

        if 'image' in request.files:
            image = request.files['image']
            if allowed_file(image.filename):
                filename = secure_filename(image.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image.save(filepath)
                image_url = f"/uploads/{filename}"
            else:
                return jsonify({"error": "Invalid file type"}), 400

        redflag = RedFlag(
            title=title,
            description=description,
            location=location,
            image_url=image_url,
            user_id=current_user['id']
        )

        db.session.add(redflag)
        db.session.commit()
        return jsonify({"message": "Red flag created", "redflag": redflag_schema.dump(redflag)}), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/redflags', methods=['GET'])
@jwt_required()
def get_redflags():
    """Get all red flags created by the logged-in user."""
    try:
        current_user = get_jwt_identity()
        redflags = RedFlag.query.filter_by(user_id=current_user['id']).all()
        return jsonify(redflags_schema.dump(redflags)), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ---------- INTERVENTION CRUD ROUTES ---------- #

@app.route('/interventions', methods=['POST'])
@jwt_required()
def create_intervention():
    """Create an intervention record."""
    try:
        current_user = get_jwt_identity()
        title = request.form.get('title') or request.json.get('title')
        description = request.form.get('description') or request.json.get('description')
        location = request.form.get('location') or request.json.get('location', 'Unknown')
        image_url = None

        if not title or not description:
            return jsonify({"error": "Title and description are required"}), 400

        if 'image' in request.files:
            image = request.files['image']
            if allowed_file(image.filename):
                filename = secure_filename(image.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                image.save(filepath)
                image_url = f"/uploads/{filename}"
            else:
                return jsonify({"error": "Invalid file type"}), 400

        intervention = Intervention(
            title=title,
            description=description,
            location=location,
            image_url=image_url,
            user_id=current_user['id']
        )

        db.session.add(intervention)
        db.session.commit()
        return jsonify({"message": "Intervention created", "intervention": intervention_schema.dump(intervention)}), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/interventions', methods=['GET'])
@jwt_required()
def get_interventions():
    """Get all interventions created by the logged-in user."""
    try:
        current_user = get_jwt_identity()
        interventions = Intervention.query.filter_by(user_id=current_user['id']).all()
        return jsonify(interventions_schema.dump(interventions)), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ---------- FILE UPLOAD ROUTE ---------- #

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded images."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ---------- RUN APP ---------- #
if __name__ == '__main__':
    app.run(debug=True)
