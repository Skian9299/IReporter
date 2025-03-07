import os
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token,
    get_jwt_identity, get_jwt
)
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from server.models import Intervention, Media, Notification, RedFlag

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reports.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}
app.config['JWT_SECRET_KEY'] = 'your-secret-key-here'  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # For development only

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)
CORS(app)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def validate_geolocation(lat, lng):
    return (-90 <= lat <= 90) and (-180 <= lng <= 180)

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# RedFlag Routes
@app.route('/redflags', methods=['POST'])
@jwt_required()
def create_redflag():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('description'):
        return jsonify({"message": "Missing title or description"}), 400

    redflag = RedFlag(
        title=data['title'],
        description=data['description'],
        user_id=user_id,
        latitude=data.get('latitude'),
        longitude=data.get('longitude')
    )
    db.session.add(redflag)
    db.session.commit()
    return jsonify(redflag.to_dict()), 201

@app.route('/redflags/<int:id>/media', methods=['POST'])
@jwt_required()
def add_redflag_media(id):
    redflag = RedFlag.query.get_or_404(id)
    if redflag.user_id != get_jwt_identity():
        return jsonify({"message": "Unauthorized"}), 403

    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"message": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    media_type = 'video' if filename.rsplit('.', 1)[1].lower() in {'mp4', 'mov', 'avi'} else 'image'
    
    media = Media(
        record_id=id,
        media_type=media_type,
        file_url=filename
    )
    db.session.add(media)
    db.session.commit()
    return jsonify(media.to_dict()), 201

# Intervention Routes
@app.route('/interventions', methods=['POST'])
@jwt_required()
def create_intervention():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('title') or not data.get('description'):
        return jsonify({"message": "Missing title or description"}), 400

    intervention = Intervention(
        title=data['title'],
        description=data['description'],
        user_id=user_id,
        latitude=data.get('latitude'),
        longitude=data.get('longitude')
    )
    db.session.add(intervention)
    db.session.commit()
    return jsonify(intervention.to_dict()), 201

@app.route('/interventions/<int:id>/media', methods=['POST'])
@jwt_required()
def add_intervention_media(id):
    intervention = Intervention.query.get_or_404(id)
    if intervention.user_id != get_jwt_identity():
        return jsonify({"message": "Unauthorized"}), 403

    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"message": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)

    media_type = 'video' if filename.rsplit('.', 1)[1].lower() in {'mp4', 'mov', 'avi'} else 'image'
    
    media = Media(
        intervention_id=id,
        media_type=media_type,
        file_url=filename
    )
    db.session.add(media)
    db.session.commit()
    return jsonify(media.to_dict()), 201

# Common Routes for Both Entities
def create_entity_routes(entity_type):
    def get_all():
        user_id = get_jwt_identity()
        entity_class = RedFlag if entity_type == 'redflags' else Intervention
        entities = entity_class.query.filter_by(user_id=user_id).all()
        return jsonify([e.to_dict() for e in entities]), 200

    def get_one(id):
        entity_class = RedFlag if entity_type == 'redflags' else Intervention
        entity = entity_class.query.get_or_404(id)
        if entity.user_id != get_jwt_identity():
            return jsonify({"message": "Unauthorized"}), 403
        return jsonify(entity.to_dict()), 200

    def update_entity(id):
        entity_class = RedFlag if entity_type == 'redflags' else Intervention
        entity = entity_class.query.get_or_404(id)
        if entity.user_id != get_jwt_identity():
            return jsonify({"message": "Unauthorized"}), 403
        if entity.status != 'draft':
            return jsonify({"message": "Cannot modify resolved records"}), 403

        data = request.get_json()
        if 'title' in data: entity.title = data['title']
        if 'description' in data: entity.description = data['description']
        db.session.commit()
        return jsonify(entity.to_dict()), 200

    def delete_entity(id):
        entity_class = RedFlag if entity_type == 'redflags' else Intervention
        entity = entity_class.query.get_or_404(id)
        if entity.user_id != get_jwt_identity():
            return jsonify({"message": "Unauthorized"}), 403
        if entity.status != 'draft':
            return jsonify({"message": "Cannot delete resolved records"}), 403

        db.session.delete(entity)
        db.session.commit()
        return jsonify({"message": "Record deleted"}), 204

    def update_location(id):
        entity_class = RedFlag if entity_type == 'redflags' else Intervention
        entity = entity_class.query.get_or_404(id)
        if entity.user_id != get_jwt_identity():
            return jsonify({"message": "Unauthorized"}), 403
        if entity.status != 'draft':
            return jsonify({"message": "Cannot update location"}), 403

        data = request.get_json()
        lat, lng = data.get('latitude'), data.get('longitude')
        if None in (lat, lng) or not validate_geolocation(lat, lng):
            return jsonify({"message": "Invalid coordinates"}), 400

        entity.latitude = lat
        entity.longitude = lng
        db.session.commit()
        return jsonify(entity.to_dict()), 200

    return get_all, get_one, update_entity, delete_entity, update_location

# Apply common routes
for entity in ['redflags', 'interventions']:
    get_all, get_one, update_entity, delete_entity, update_location = create_entity_routes(entity)
    app.add_url_rule(f'/{entity}', view_func=get_all, methods=['GET'])
    app.add_url_rule(f'/{entity}/<int:id>', view_func=get_one, methods=['GET'])
    app.add_url_rule(f'/{entity}/<int:id>', view_func=update_entity, methods=['PATCH'])
    app.add_url_rule(f'/{entity}/<int:id>', view_func=delete_entity, methods=['DELETE'])
    app.add_url_rule(f'/{entity}/<int:id>/location', view_func=update_location, methods=['PATCH'])

# Notification Routes
@app.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    notifications = Notification.query.filter_by(user_id=get_jwt_identity()).all()
    return jsonify([n.to_dict() for n in notifications]), 200

@app.route('/notifications/<int:id>', methods=['PATCH'])
@jwt_required()
def mark_notification_read(id):
    notification = Notification.query.get_or_404(id)
    if notification.user_id != get_jwt_identity():
        return jsonify({"message": "Unauthorized"}), 403
    notification.is_read = True
    db.session.commit()
    return jsonify(notification.to_dict()), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)