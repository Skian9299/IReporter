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

# CORS configuration: apply to the entire app with credentials and allowed origins.
CORS(app)

# JWT Manager initialization
jwt = JWTManager(app)

# App configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reports.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Ensure upload directory exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)

print(app.url_map)

# Register the authentication blueprint
app.register_blueprint(auth_bp, url_prefix='/auth')
# Flask-Mail configuration
def setup_mail(app):
    app.config["MAIL_SERVER"] = "smtp.gmail.com"
    app.config["MAIL_PORT"] = 587
    app.config["MAIL_USE_TLS"] = True
    app.config["MAIL_USERNAME"] = "kamalabdi042@gmail.com"  # Set in .env
    app.config["MAIL_PASSWORD"] = "vdwa vejv ylts bxbb"  # Set in .env
    app.config["MAIL_DEFAULT_SENDER"] = "kamalabdi042@gmail.com"

    mail = Mail(app)
    return mail

# Initialize mail inside app.py
mail = setup_mail(app)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# -------------------------
# RedFlag Blueprint and Routes
# -------------------------

@app.route('/redflags', methods=['POST'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def create_redflag():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Missing JSON data'}), 400

    for field in ['title', 'description', 'location']:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    try:
        latitude = float(data['latitude']) if data.get('latitude') is not None else None
        longitude = float(data['longitude']) if data.get('longitude') is not None else None
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
        

@app.route('/redflags/<int:id>', methods=['PUT'])
@jwt_required()
@cross_origin(origin="*", supports_credentials=True)
def edit_redflag(id):
    current_user_id = get_jwt_identity()
    redflag = RedFlag.query.get_or_404(id)
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON data.'}), 400

    if 'title' in data:
        redflag.title = data['title']
    if 'description' in data:
        redflag.description = data['description']
    if 'location' in data:
        redflag.location = data['location']
    if 'latitude' in data:
        try:
            redflag.latitude = float(data['latitude'])
        except ValueError:
            return jsonify({'error': 'Latitude must be a number.'}), 400
    if 'longitude' in data:
        try:
            redflag.longitude = float(data['longitude'])
        except ValueError:
            return jsonify({'error': 'Longitude must be a number.'}), 400
    if 'image_url' in data:
        redflag.image_url = data['image_url']
    if 'status' in data:
        try:
            redflag.status = Status(data['status'])
        except ValueError:
            return jsonify({'error': 'Invalid status value.'}), 400

    db.session.commit()
    return jsonify(redflag.to_dict()), 200

@app.route('/redflags/<int:id>', methods=['GET'])
@jwt_required()
@cross_origin(origin="*", supports_credentials=True)
def get_redflag(id):
    redflag = RedFlag.query.get_or_404(id)
    return jsonify(redflag.to_dict()), 200


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

@app.route('/redflags/<int:id>', methods=['DELETE'])
@jwt_required()
@cross_origin(origin="*", supports_credentials=True)
def delete_redflag(id):
    current_user_id = get_jwt_identity()
    redflag = RedFlag.query.get_or_404(id)
    
    if redflag.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized access.'}), 403

    db.session.delete(redflag)
    db.session.commit()
    return jsonify({'message': 'Red flag deleted successfully.'}), 200

# Register the redflag blueprint with URL prefix "/redflags"

# -------------------------
# Intervention Routes
# -------------------------
@app.route('/interventions', methods=['POST'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def create_intervention():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Missing JSON data'}), 400

    for field in ['title', 'description', 'location']:
        if field not in data or not data[field]:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    try:
        latitude = float(data['latitude']) if data.get('latitude') is not None else None
        longitude = float(data['longitude']) if data.get('longitude') is not None else None
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

@app.route('/auth/email', methods=['GET'])
@jwt_required()
def get_mail():
    current_user = get_jwt_identity()
    user = User.query.filter_by(id=current_user).first()
    return jsonify({'message': 'success', 'email': user.email}), 200



@app.route('/interventions/<int:id>', methods=['PUT'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def edit_intervention(id):
    current_user_id = get_jwt_identity()
    intervention = Intervention.query.get_or_404(id)

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON data.'}), 400

    if 'title' in data:
        intervention.title = data['title']
    if 'description' in data:
        intervention.description = data['description']
    if 'location' in data:
        intervention.location = data['location']
    if 'latitude' in data:
        try:
            intervention.latitude = float(data['latitude'])
        except ValueError:
            return jsonify({'error': 'Latitude must be a number.'}), 400
    if 'longitude' in data:
        try:
            intervention.longitude = float(data['longitude'])
        except ValueError:
            return jsonify({'error': 'Longitude must be a number.'}), 400
    if 'image_url' in data:
        intervention.image_url = data['image_url']
    if 'status' in data:
        try:
            intervention.status = Status(data['status'])
        except ValueError:
            return jsonify({'error': 'Invalid status value.'}), 400

    db.session.commit()
    return jsonify(intervention.to_dict()), 200

@app.route('/interventions/<int:id>', methods=['GET'])
@jwt_required()
@cross_origin(origin="*", supports_credentials=True)
def get_intervention(id):
    intervention = Intervention.query.get_or_404(id)
    return jsonify(intervention.to_dict()), 200

@app.route('/interventions/<int:id>', methods=['DELETE'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def delete_intervention(id):
    current_user_id = get_jwt_identity()
    intervention = Intervention.query.get_or_404(id)

    db.session.delete(intervention)
    db.session.commit()
    return jsonify({'message': 'Intervention deleted successfully.'}), 200

# -------------------------
# Combined Reports Route
# -------------------------
@app.route('/reports', methods=['GET'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def get_reports():
    current_user_id = get_jwt_identity()
    redflags = RedFlag.query.all()
    interventions = Intervention.query.all()
    return jsonify({
        "redflags": [r.to_dict() for r in redflags],
        "interventions": [i.to_dict() for i in interventions]
    }), 200



# print(app.url_map)

if __name__ == '__main__':
    app.run(debug=True)
