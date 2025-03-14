from functools import wraps
import os
from flask import Flask, jsonify, request, send_from_directory, Blueprint
from werkzeug.utils import secure_filename
from flask_cors import CORS, cross_origin
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from auth import auth_bp, blacklist
from flask_jwt_extended import JWTManager, get_jwt_identity, jwt_required
from models import db, Intervention, RedFlag, Status, User

# Initialize Flask app
app = Flask(__name__)

# CORS configuration
CORS(app)

# JWT Manager initialization
jwt = JWTManager(app)

# App configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reports.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')

# Flask-Mail configuration
def setup_mail(app):
    app.config["MAIL_SERVER"] = "smtp.gmail.com"
    app.config["MAIL_PORT"] = 587
    app.config["MAIL_USE_TLS"] = True
    app.config["MAIL_USERNAME"] = "kamalabdi042@gmail.com"
    app.config["MAIL_PASSWORD"] = "vdwa vejv ylts bxbb"
    app.config["MAIL_DEFAULT_SENDER"] = "kamalabdi042@gmail.com"
    mail = Mail(app)
    return mail

mail = setup_mail(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# -------------------------
# RedFlag Routes
# -------------------------

@app.route('/redflags', methods=['GET', 'POST'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def handle_redflags():
    if request.method == 'GET':
        redflags = RedFlag.query.all()
        return jsonify([r.to_dict() for r in redflags]), 200
    elif request.method == 'POST':
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Missing JSON data'}), 400

        required_fields = ['title', 'description', 'location']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        try:
            latitude = float(data.get('latitude')) if data.get('latitude') else None
            longitude = float(data.get('longitude')) if data.get('longitude') else None
        except ValueError:
            return jsonify({'error': 'Latitude and longitude must be numbers'}), 400

        redflag = RedFlag(
            title=data['title'],
            description=data['description'],
            location=data['location'],
            latitude=latitude,
            longitude=longitude,
            image_url=data.get('image_url'),
            user_id=current_user_id
        )
        db.session.add(redflag)
        db.session.commit()
        return jsonify(redflag.to_dict()), 201

@app.route('/redflags/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
@jwt_required()
@cross_origin(origin="*", supports_credentials=True)
def manage_redflag(id):
    redflag = RedFlag.query.get_or_404(id)
    current_user_id = get_jwt_identity()

    if request.method == 'GET':
        return jsonify(redflag.to_dict()), 200
    
    elif request.method == 'PATCH':
        if redflag.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access.'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON data.'}), 400

        # Update fields
        fields = ['title', 'description', 'location', 'image_url']
        for field in fields:
            if field in data:
                setattr(redflag, field, data[field])

        # Handle coordinates
        try:
            if 'latitude' in data:
                redflag.latitude = float(data['latitude'])
            if 'longitude' in data:
                redflag.longitude = float(data['longitude'])
        except ValueError:
            return jsonify({'error': 'Coordinates must be numbers.'}), 400

        # Handle status
        if 'status' in data:
            try:
                redflag.status = Status(data['status'].lower()) 
            except ValueError:
                return jsonify({'error': 'Invalid status value.'}), 400

        db.session.commit()
        return jsonify(redflag.to_dict()), 200
    
    elif request.method == 'DELETE':
        if redflag.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access.'}), 403
        if redflag.status not in [Status.DRAFT, Status.RESOLVED]:
            return jsonify({'error': 'Cannot delete report in current status'}), 400
        
        db.session.delete(redflag)
        db.session.commit()
        return jsonify({'message': 'Red flag deleted successfully.'}), 200

# -------------------------
# Intervention Routes
# -------------------------

@app.route('/interventions', methods=['GET', 'POST'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def handle_interventions():
    if request.method == 'GET':
        interventions = Intervention.query.all()
        return jsonify([i.to_dict() for i in interventions]), 200
    elif request.method == 'POST':
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Missing JSON data'}), 400

        required_fields = ['title', 'description', 'location']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        try:
            latitude = float(data.get('latitude')) if data.get('latitude') else None
            longitude = float(data.get('longitude')) if data.get('longitude') else None
        except ValueError:
            return jsonify({'error': 'Latitude and longitude must be numbers'}), 400

        intervention = Intervention(
            title=data['title'],
            description=data['description'],
            location=data['location'],
            latitude=latitude,
            longitude=longitude,
            image_url=data.get('image_url'),
            user_id=current_user_id
        )
        db.session.add(intervention)
        db.session.commit()
        return jsonify(intervention.to_dict()), 201

@app.route('/interventions/<int:id>', methods=['GET', 'PATCH', 'DELETE'])
@jwt_required()
@cross_origin(origin="*", supports_credentials=True)
def manage_intervention(id):
    intervention = Intervention.query.get_or_404(id)
    current_user_id = get_jwt_identity()

    if request.method == 'GET':
        return jsonify(intervention.to_dict()), 200
    
    elif request.method == 'PATCH':
        if intervention.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access.'}), 403

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON data.'}), 400

        # Update fields
        fields = ['title', 'description', 'location', 'image_url']
        for field in fields:
            if field in data:
                setattr(intervention, field, data[field])

        # Handle coordinates
        try:
            if 'latitude' in data:
                intervention.latitude = float(data['latitude'])
            if 'longitude' in data:
                intervention.longitude = float(data['longitude'])
        except ValueError:
            return jsonify({'error': 'Coordinates must be numbers.'}), 400

        # Handle status
        if 'status' in data:
            try:
                intervention.status = Status(data['status'].lower()) 
            except ValueError:
                return jsonify({'error': 'Invalid status value.'}), 400
        db.session.commit()
        return jsonify(intervention.to_dict()), 200
    
    elif request.method == 'DELETE':
        if intervention.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized access.'}), 403
        if intervention.status not in [Status.DRAFT, Status.RESOLVED]:
            return jsonify({'error': 'Cannot delete report in current status'}), 400

        db.session.delete(intervention)
        db.session.commit()
        return jsonify({'message': 'Intervention deleted successfully.'}), 200
    
# Getting all reports
@app.route('/reports', methods=['GET'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def get_all_reports():
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    if current_user.role == 'admin':
         redflags = RedFlag.query.all()
         interventions = Intervention.query.all()
    else:
        redflags = RedFlag.query.filter_by(user_id=current_user_id).all()
        interventions = Intervention.query.filter_by(user_id=current_user_id).all()
    
    return jsonify({
        "redflags": [r.to_dict() for r in redflags],
        "interventions": [i.to_dict() for i in interventions]
    }), 200


# -------------------------
# Other Routes
# -------------------------

@app.route("/send-mail", methods=["POST"])
@cross_origin()
def send_mail():
    try:
        data = request.json
        email = data.get("email")
        status = data.get("status")
        report_id = data.get("report_id")

        if not email or not status or not report_id:
            return jsonify({"error": "Missing required fields"}), 400

        subject = f"Report Status Update - Report #{report_id}"
        body = f"Hello,\n\nYour report (ID: {report_id}) has been updated to: {status.upper()}.\n\nThank you."

        msg = Message(subject, recipients=[email], body=body)
        mail.send(msg)

        return jsonify({"message": f"Email sent to {email}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/auth/email', methods=['GET'])
@jwt_required()
def get_mail():
    current_user = get_jwt_identity()
    user = User.query.filter_by(id=current_user).first()
    return jsonify({'message': 'success', 'email': user.email}), 200


if __name__ == '__main__':
    with app.app_context():
        app.run(debug=True)
