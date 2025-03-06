from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from models import UserRole, db, User, RedFlag, Intervention, Status, Media
from serializers import user_schema, redflag_schema, redflags_schema, intervention_schema, interventions_schema
from werkzeug.datastructures import CombinedMultiDict

# Load environment variables
load_dotenv()

app = Flask(__name__)

# ---------- CONFIGURATION ---------- #
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ireporter.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'supersecretkey')
app.config['UPLOAD_FOLDER'] = os.path.abspath('uploads')
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4'}
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
mail = Mail(app)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Ensure upload folder exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ---------- HELPER FUNCTIONS ---------- #
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def send_email(to, subject, body):
    """Send an email using Flask-Mail."""
    msg = Message(subject, recipients=[to], body=body)
    mail.send(msg)

# ---------- SERVE UPLOADED FILES ---------- #
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ---------- AUTH ROUTES ---------- #
@app.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        password = data.get('password')
        confirm_password = data.get('confirm_password')
        role = data.get('role', 'user')  # Default to 'user'

        print(f"Role received: {role}")  # Debugging role assignment

        if not all([first_name, last_name, email, password, confirm_password]):
            return jsonify({"error": "All fields are required"}), 400

        if password != confirm_password:
            return jsonify({"error": "Passwords do not match"}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"error": "Email already in use"}), 400

        # Validate role input
        if role not in ['admin', 'user']:
            return jsonify({"error": "Invalid role"}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password_hash=hashed_password,
            role=UserRole(role)  # Assign the role properly
        )

        db.session.add(new_user)
        db.session.commit()

        token = create_access_token(identity={"id": new_user.id, "role": new_user.role.value})
        return jsonify({
            "message": "Sign-up successful",
            "token": token,
            "user": user_schema.dump(new_user)
        }), 201
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

        token = create_access_token(identity={"id": user.id, "role": "admin" if user.is_admin() else "user"})
        return jsonify({
            "message": "Login successful",
            "token": token,
            "role": "admin" if user.is_admin() else "user",
            "user": user_schema.dump(user)
        }), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ---------- REPORT ROUTES ---------- #
@app.route('/redflags', methods=['POST'])
@jwt_required()
def create_redflag():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        # Use CombinedMultiDict to parse both form and files
        form = CombinedMultiDict([request.form, request.files])
        
        title = form.get('title')
        description = form.get('description')
        location = form.get('location')
        latitude = form.get('latitude', type=float)
        longitude = form.get('longitude', type=float)
        image = form.get('image')  # Use form.get for files
        video = form.get('video')

        if not all([title, description, location, latitude, longitude]):
            return jsonify({"error": "All fields are required"}), 400

        new_redflag = RedFlag(
            title=title,
            description=description,
            location=location,
            latitude=latitude,
            longitude=longitude,
            user_id=user_id
        )

        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            new_redflag.image_url = filename

        if video and allowed_file(video.filename):
            filename = secure_filename(video.filename)
            video.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            new_redflag.video_url = filename

        db.session.add(new_redflag)
        db.session.commit()
        return jsonify(redflag_schema.dump(new_redflag)), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

    
@app.route('/redflags/<int:id>', methods=['GET'])
@jwt_required()
def get_redflag(id):
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")
        role = current_user.get("role")

        # Fetch the red-flag record
        if role == "admin":
            redflag = RedFlag.query.get(id)  # Admins can access any red-flag
        else:
            redflag = RedFlag.query.filter_by(id=id, user_id=user_id).first()  # Users can only access their own red-flags

        if not redflag:
            return jsonify({"error": "Red flag not found or unauthorized"}), 404

        return jsonify(redflag_schema.dump(redflag)), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/redflags/<int:id>', methods=['PATCH'])
@jwt_required()
def update_redflag(id):
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        redflag = RedFlag.query.filter_by(id=id, user_id=user_id).first()
        if not redflag:
            return jsonify({"error": "Red flag not found or unauthorized"}), 404

        data = request.json
        redflag.title = data.get('title', redflag.title)
        redflag.description = data.get('description', redflag.description)
        redflag.location = data.get('location', redflag.location)
        redflag.latitude = data.get('latitude', redflag.latitude)
        redflag.longitude = data.get('longitude', redflag.longitude)

        db.session.commit()
        return jsonify(redflag_schema.dump(redflag)), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/redflags/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_redflag(id):
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        redflag = RedFlag.query.filter_by(id=id, user_id=user_id).first()
        if not redflag:
            return jsonify({"error": "Red flag not found or unauthorized"}), 404

        db.session.delete(redflag)
        db.session.commit()
        return jsonify({"message": "Red flag deleted successfully", "id": id}), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

# ---------- ADMIN ROUTES ---------- #
@app.route('/admin/redflags/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_redflag_status(id):
    try:
        current_user = get_jwt_identity()
        if current_user.get("role") != "admin":
            return jsonify({"error": "Unauthorized"}), 403

        redflag = RedFlag.query.get(id)
        if not redflag:
            return jsonify({"error": "Red flag not found"}), 404

        data = request.json
        status = data.get('status')
        if status not in [s.value for s in Status]:
            return jsonify({"error": "Invalid status"}), 400

        redflag.status = status
        db.session.commit()

        # Send email notification
        user = User.query.get(redflag.user_id)
        if user:
            send_email(
                to=user.email,
                subject="Report Status Update",
                body=f"Your red flag report '{redflag.title}' has been marked as {status}."
            )

        return jsonify(redflag_schema.dump(redflag)), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    
# ---------- INTERVENTION ROUTES ---------- #
@app.route('/interventions', methods=['POST'])
@jwt_required()
def create_redflag():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        # Use CombinedMultiDict to parse both form and files
        form = CombinedMultiDict([request.form, request.files])
        
        title = form.get('title')
        description = form.get('description')
        location = form.get('location')
        latitude = form.get('latitude', type=float)
        longitude = form.get('longitude', type=float)
        image = form.get('image')  # Use form.get for files
        video = form.get('video')

        if not all([title, description, location, latitude, longitude]):
            return jsonify({"error": "All fields are required"}), 400

        new_intervention = Intervention(
            title=title,
            description=description,
            location=location,
            latitude=latitude,
            longitude=longitude,
            user_id=user_id
        )

        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            new_intervention.image_url = filename

        if video and allowed_file(video.filename):
            filename = secure_filename(video.filename)
            video.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            new_intervention.video_url = filename

        db.session.add(new_intervention)
        db.session.commit()
        return jsonify(intervention_schema.dump(new_intervention)), 201
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500
    
@app.route('/interventions/<int:id>', methods=['PATCH'])
@jwt_required()
def update_intervention(id):
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        intervention = Intervention.query.filter_by(id=id, user_id=user_id).first()
        if not intervention:
            return jsonify({"error": "Intervention not found or unauthorized"}), 404

        data = request.json
        intervention.title = data.get('title', intervention.title)
        intervention.description = data.get('description', intervention.description)
        intervention.location = data.get('location', intervention.location)
        intervention.latitude = data.get('latitude', intervention.latitude)
        intervention.longitude = data.get('longitude', intervention.longitude)

        db.session.commit()
        return jsonify(intervention_schema.dump(intervention)), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/interventions/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_intervention(id):
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        intervention = Intervention.query.filter_by(id=id, user_id=user_id).first()
        if not intervention:
            return jsonify({"error": "Intervention not found or unauthorized"}), 404

        db.session.delete(intervention)
        db.session.commit()
        return jsonify({"message": "Intervention deleted successfully", "id": id}), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/interventions', methods=['GET'])
@jwt_required()
def get_interventions():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get("id")
        role = current_user.get("role")

        # Fetch interventions based on user role
        if role == "admin":
            interventions = Intervention.query.all()  # Admins can access all interventions
        else:
            interventions = Intervention.query.filter_by(user_id=user_id).all()  # Users can only access their own interventions

        return jsonify(interventions_schema.dump(interventions)), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app.route('/admin/interventions/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_intervention_status(id):
    try:
        current_user = get_jwt_identity()
        if current_user.get("role") != "admin":
            return jsonify({"error": "Unauthorized"}), 403

        intervention = Intervention.query.get(id)
        if not intervention:
            return jsonify({"error": "Intervention not found"}), 404

        data = request.json
        status = data.get('status')
        if status not in [s.value for s in Status]:
            return jsonify({"error": "Invalid status"}), 400

        intervention.status = status
        db.session.commit()

        # Send email notification
        user = User.query.get(intervention.user_id)
        if user:
            send_email(
                to=user.email,
                subject="Intervention Status Update",
                body=f"Your intervention report '{intervention.title}' has been marked as {status}."
            )

        return jsonify(intervention_schema.dump(intervention)), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

#fetch both Red Flags and Interventions
@app.route('/reports', methods=['GET'])
@jwt_required()
def get_all_reports():
    try:
        current_user = get_jwt_identity()
        if current_user.get("role") != "admin":
            return jsonify({"error": "Unauthorized"}), 403

        # Fetch all reports from both tables
        redflags = RedFlag.query.all()
        interventions = Intervention.query.all()

        # Serialize and combine data with a 'category' field
        all_reports = []
        for redflag in redflags:
            report_data = redflag_schema.dump(redflag)
            report_data['category'] = 'Red Flag'  # Add category
            report_data['userEmail'] = redflag.user.email  # Include user email
            all_reports.append(report_data)
        for intervention in interventions:
            report_data = intervention_schema.dump(intervention)
            report_data['category'] = 'Intervention'  # Add category
            report_data['userEmail'] = intervention.user.email  # Include user email
            all_reports.append(report_data)

        return jsonify(all_reports), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ---------- RUN APP ---------- #
if __name__ == '__main__':
    app.run(debug=True)