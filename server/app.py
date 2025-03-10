from mailbox import Message
import os
from datetime import datetime
from functools import wraps
import os
import token
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from auth import auth_bp, blacklist
from flask_jwt_extended import JWTManager
from models import User, db, Intervention, RedFlag
from flask_mail import Mail
from flask_cors import CORS, cross_origin




# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["https://ireporter-2-6rr9.onrender.com"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])
jwt = JWTManager(app)

# Enable CORS for the /send-email route specifically
CORS(app, resources={r"/send-email": {"origins": "*"}})




# Email Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Use your email provider's SMTP server
app.config['MAIL_PORT'] = 587  # Port for TLS
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'your-email@gmail.com'  # Replace with your email
app.config['MAIL_PASSWORD'] = 'your-email-password'  # Use environment variables instead of hardcoding
app.config['MAIL_DEFAULT_SENDER'] = 'your-email@gmail.com'  # Same as MAIL_USERNAME

mail = Mail(app)


app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://reportsdb_user:vuyuxK3wUjE9wOVeL6HlcMIHieWbTZvQ@dpg-cv7efcbtq21c73aovlm0-a.oregon-postgres.render.com/reportsdb'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # For development only

# Initialize extensions
# db = SQLAlchemy(app)
db.init_app(app)
migrate = Migrate(app, db)
# Initialize JWT
jwt = JWTManager(app)
UPLOAD_FOLDER = "uploads"  # Ensure this folder exists

# # Serve uploaded files
# @app.route('/uploads/<filename>')
# def uploaded_file(filename):
#     return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Handle CORS preflight for a protected endpoint
@app.route("/protected-endpoint", methods=["OPTIONS"])
@cross_origin(origin="*", supports_credentials=True)
def options_protected():
    response = jsonify({"message": "CORS preflight OK"})
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response, 200

# Register the authentication blueprint
app.register_blueprint(auth_bp, url_prefix='/auth')


# Auth decorator
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()  # Verifies the JWT exists and is valid
            current_user_id = get_jwt_identity()  # Retrieves the user ID from the token
        except Exception as e:
            return jsonify({'message': 'Invalid token!', 'error': str(e)}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            # Assuming you have a User model with is_admin field
            from models import User
            user = User.query.get(current_user_id)
            if not user or not user.is_admin:
                return jsonify({'error': 'Admin privileges required'}), 403
        except Exception as e:
            return jsonify({'message': 'Authorization failed', 'error': str(e)}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated


# File validation
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# RedFlag Routes
# -------------------------

@app.route('/redflags', methods=['POST'])
@token_required
def create_redflag(current_user_id):
    """Create a new red flag report."""
    data = request.get_json()  # Changed from request.form
    if not data or 'title' not in data or 'description' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    if not all(key in data for key in ['location', 'latitude', 'longitude']):
        return jsonify({'error': 'Missing location data'}), 400

    redflag = RedFlag(
        title=data['title'],
        description=data['description'],
        location=data['location'],
        latitude=float(data['latitude']),
        longitude=float(data['longitude']),
        image_url=data.get('image_url', ''),
        user_id=current_user_id
    )
    
    db.session.add(redflag)
    db.session.commit()
    return jsonify(redflag.to_dict()), 201


@app.route('/redflags', methods=['GET'])
@token_required
def get_redflags(current_user_id):
    """Retrieve all red flag reports for the authenticated user."""
    redflags = RedFlag.query.filter_by(user_id=current_user_id).all()
    return jsonify([r.to_dict() for r in redflags])

@app.route('/redflags/<int:id>', methods=['GET'])
@token_required
def get_redflag(current_user_id, id):
    """Get a single red flag report"""
    redflag = RedFlag.query.filter_by(id=id, user_id=current_user_id).first_or_404()
    return jsonify(redflag.to_dict())


@app.route('/redflags/<int:id>', methods=['PATCH'])
@token_required
def update_redflag(current_user_id, id):
    redflag = RedFlag.query.get_or_404(id)
    if redflag.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    if 'title' in data:
        redflag.title = data['title']
    if 'description' in data:
        redflag.description = data['description']
    if 'location' in data:
        redflag.location = data['location']
    if 'latitude' in data:
        redflag.latitude = float(data['latitude'])
    if 'longitude' in data:
        redflag.longitude = float(data['longitude'])
    if 'image_url' in data:
        redflag.image_url = data['image_url']

    db.session.commit()
    return jsonify(redflag.to_dict())


@app.route('/redflags/<int:id>', methods=['DELETE'])
@token_required
def delete_redflag(current_user_id, id):
    """Delete a red flag report."""
    redflag = RedFlag.query.get_or_404(id)

    if redflag.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(redflag)
    db.session.commit()

    return jsonify({'message': 'Red flag deleted successfully'}), 200


# Intervention Routes (similar to redflags)
@app.route('/interventions', methods=['POST'])
@token_required
def create_intervention(current_user_id):
    data = request.get_json()
    if not data or 'title' not in data or 'description' not in data:
        return jsonify({'error': 'Missing required fields'}), 400

    intervention = Intervention(
        title=data['title'],
        description=data['description'],
        location=data.get('location'),
        latitude=float(data.get('latitude', 0)),
        longitude=float(data.get('longitude', 0)),
        image_url=data.get('image_url', ''),
        user_id=current_user_id
    )
    db.session.add(intervention)
    db.session.commit()
    return jsonify(intervention.to_dict()), 201

@app.route('/interventions', methods=['GET'])
@token_required
def get_interventions(current_user_id):
    interventions = Intervention.query.filter_by(user_id=current_user_id).all()
    return jsonify([i.to_dict() for i in interventions])


@app.route('/interventions/<int:id>', methods=['GET'])
@token_required
def get_intervention(current_user_id, id):
    """Get a single intervention report"""
    intervention = Intervention.query.filter_by(id=id, user_id=current_user_id).first_or_404()
    return jsonify(intervention.to_dict())


@app.route('/interventions/<int:id>', methods=['PATCH'])
@token_required
def update_intervention(current_user_id, id):
    intervention = Intervention.query.get_or_404(id)
    if intervention.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    if 'title' in data:
        intervention.title = data['title']
    if 'description' in data:
        intervention.description = data['description']
    if 'location' in data:
        intervention.location = data['location']
    if 'latitude' in data:
        intervention.latitude = float(data['latitude'])
    if 'longitude' in data:
        intervention.longitude = float(data['longitude'])
    if 'image_url' in data:
        intervention.image_url = data['image_url']

    db.session.commit()
    return jsonify(intervention.to_dict())


@app.route('/interventions/<int:id>', methods=['DELETE'])
@token_required
def delete_intervention(current_user_id, id):
    intervention = Intervention.query.get_or_404(id)
    if intervention.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(intervention)
    db.session.commit()
    return jsonify({'message': 'Intervention deleted'}), 200

# Admin status update for RedFlags
@app.route('/admin/redflags/<int:id>/status', methods=['PATCH'])
@admin_required
def update_redflag_status(current_user_id, id):
    redflag = RedFlag.query.get_or_404(id)
    data = request.get_json()
    
    if not data or 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
    
    try:
        new_status = StatusEnum(data['status'].lower())
        redflag.status = new_status
        db.session.commit()
        
        # Send email notification
        user = User.query.get(redflag.user_id)
        msg = Message(
            subject=f"Red Flag Status Update - {redflag.id}",
            recipients=[user.email],
            body=f"""Your Red Flag report has been updated to: {new_status.value}
            
            Report Details:
            Title: {redflag.title}
            ID: {redflag.id}
            New Status: {new_status.value}
            
            Thank you for using our platform."""
        )
        mail.send(msg)
        
        return jsonify(redflag.to_dict())
        
    except ValueError:
        valid_statuses = [e.value for e in StatusEnum]
        return jsonify({'error': f'Invalid status. Valid values: {valid_statuses}'}), 400

@app.route('/admin/interventions/<int:id>/status', methods=['PATCH'])
@admin_required
def update_intervention_status(current_user_id, id):
    intervention = Intervention.query.get_or_404(id)
    data = request.get_json()
    
    if not data or 'status' not in data:
        return jsonify({'error': 'Status is required'}), 400
    
    try:
        new_status = StatusEnum(data['status'].lower())
        intervention.status = new_status
        db.session.commit()
        
        # Send email notification
        user = User.query.get(intervention.user_id)
        msg = Message(
            subject=f"Intervention Status Update - {intervention.id}",
            recipients=[user.email],
            body=f"""Your Intervention report has been updated to: {new_status.value}
            
            Report Details:
            Title: {intervention.title}
            ID: {intervention.id}
            New Status: {new_status.value}
            
            Thank you for using our platform."""
        )
        mail.send(msg)
        
        return jsonify(intervention.to_dict())
        
    except ValueError:
        valid_statuses = [e.value for e in StatusEnum]
        return jsonify({'error': f'Invalid status. Valid values: {valid_statuses}'}), 400
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
