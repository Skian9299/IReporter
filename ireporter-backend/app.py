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

# ---------- SERVE UPLOADED IMAGES ---------- #
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ---------- CREATE REPORT ROUTES ---------- #
@app.route('/redflags', methods=['POST'])
@jwt_required()
def create_redflag():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        title = request.form.get('title')
        description = request.form.get('description')
        location = request.form.get('location')
        image = request.files.get('image')

        if not title or not description or not location:
            return jsonify({"error": "Title, description, and location are required"}), 400

        filename = None
        if image:
            if allowed_file(image.filename):
                filename = secure_filename(image.filename)
                image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            else:
                return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, gif"}), 400

        new_redflag = RedFlag(
            title=title,
            description=description,
            location=location,
            image_url=filename,  # Ensure consistency with your model
            user_id=user_id
        )

        db.session.add(new_redflag)
        db.session.commit()
        return jsonify(redflag_schema.dump(new_redflag)), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/interventions', methods=['POST'])
@jwt_required()
def create_intervention():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        title = request.form.get('title')
        description = request.form.get('description')
        location = request.form.get('location')
        image = request.files.get('image')

        if not title or not description or not location:
            return jsonify({"error": "Title, description, and location are required"}), 400

        filename = None
        if image:
            if allowed_file(image.filename):
                filename = secure_filename(image.filename)
                image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            else:
                return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, gif"}), 400

        new_intervention = Intervention(
            title=title,
            description=description,
            location=location,
            image_url=filename,  # Ensure consistency with your model
            user_id=user_id
        )

        db.session.add(new_intervention)
        db.session.commit()
        return jsonify(intervention_schema.dump(new_intervention)), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ---------- DELETE ROUTES ---------- #
@app.route('/redflags/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_redflag(id):
    current_user = get_jwt_identity()
    user_id = current_user.get("id")

    redflag = RedFlag.query.filter_by(id=id, user_id=user_id).first()
    if not redflag:
        return jsonify({"error": "Red flag not found or unauthorized"}), 404

    db.session.delete(redflag)
    db.session.commit()
    return jsonify({"message": "Red flag deleted successfully", "id": id}), 200

@app.route('/interventions/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_intervention(id):
    current_user = get_jwt_identity()
    user_id = current_user.get("id")

    intervention = Intervention.query.filter_by(id=id, user_id=user_id).first()
    if not intervention:
        return jsonify({"error": "Intervention not found or unauthorized"}), 404

    db.session.delete(intervention)
    db.session.commit()
    return jsonify({"message": "Intervention deleted successfully", "id": id}), 200

# ---------- FETCH REPORTS ROUTES ---------- #
@app.route('/redflags', methods=['GET'])
@jwt_required()
def get_redflags():
    current_user = get_jwt_identity()
    user_id = current_user.get("id")

    redflags = RedFlag.query.filter_by(user_id=user_id).all()
    return jsonify(redflags_schema.dump(redflags)), 200

@app.route('/interventions', methods=['GET'])
@jwt_required()
def get_interventions():
    current_user = get_jwt_identity()
    user_id = current_user.get("id")

    interventions = Intervention.query.filter_by(user_id=user_id).all()
    return jsonify(interventions_schema.dump(interventions)), 200

# ---------- LOGIN ROUTE ---------- #
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
    
    
# ---------- SIGNUP ROUTE ---------- #
@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')  # Fixed key name

        # Validate all fields
        if not all([first_name, last_name, email, password, confirm_password]):
            return jsonify({"error": "All fields are required"}), 400

        # Validate password match
        if password != confirm_password:
            return jsonify({"error": "Passwords do not match"}), 400

        # Check if email already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Email already in use"}), 400

        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        # Create new user (Do NOT store plain password or confirm_password)
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hashed_password  # Use hashed password
        )

        db.session.add(new_user)
        db.session.commit()

        # Generate access token
        token = create_access_token(identity={"id": new_user.id, "role": "user"})

        return jsonify({
            "message": "Sign-up successful",
            "token": token,
            "user": user_schema.dump(new_user)
        }), 201

    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500


# ---------- RUN APP ---------- #
if __name__ == '__main__':
    app.run(debug=True)




