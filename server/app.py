import os
from datetime import datetime
from functools import wraps
import os
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from auth import auth_bp, blacklist
from flask_jwt_extended import JWTManager
from models import db, Intervention, RedFlag




# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])
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


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///reports.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'mov', 'avi'}
app.config['JWT_SECRET_KEY'] = 'your-secret-key-here'  # Change in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # For development only

# Initialize extensions
# db = SQLAlchemy(app)
db.init_app(app)
migrate = Migrate(app, db)

# Serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

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
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split()[1]
        if not token:
            return jsonify({'message': 'Token missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except:
            return jsonify({'message': 'Invalid token!'}), 401
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
    try:
        title = request.form['title']
        description = request.form['description']
    except KeyError:
        return jsonify({'error': 'Missing required fields'}), 400

    file = request.files.get('image')
    filename = None
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    redflag = RedFlag(
        title=title,
        description=description,
        location=request.form.get('location'),
        latitude=request.form.get('latitude', type=float),
        longitude=request.form.get('longitude', type=float),
        image_url=filename,
        user_id=current_user_id
    )
    db.session.add(redflag)
    db.session.commit()
    return jsonify(redflag.to_dict()), 201

@app.route('/redflags', methods=['GET'])
@token_required
def get_redflags(current_user_id):
    redflags = RedFlag.query.filter_by(user_id=current_user_id).all()
    return jsonify([r.to_dict() for r in redflags])

@app.route('/redflags/<int:id>', methods=['PUT'])
@token_required
def update_redflag(current_user_id, id):
    redflag = RedFlag.query.get_or_404(id)
    if redflag.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if 'title' in request.form:
        redflag.title = request.form['title']
    if 'description' in request.form:
        redflag.description = request.form['description']
    if 'location' in request.form:
        redflag.location = request.form['location']
    if 'latitude' in request.form:
        redflag.latitude = request.form.get('latitude', type=float)
    if 'longitude' in request.form:
        redflag.longitude = request.form.get('longitude', type=float)

    file = request.files.get('image')
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        redflag.image_url = filename

    db.session.commit()
    return jsonify(redflag.to_dict())

@app.route('/redflags/<int:id>', methods=['DELETE'])
@token_required
def delete_redflag(current_user_id, id):
    redflag = RedFlag.query.get_or_404(id)
    if redflag.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(redflag)
    db.session.commit()
    return jsonify({'message': 'Red flag deleted'}), 200

# Intervention Routes (similar to redflags)
@app.route('/interventions', methods=['POST'])
@token_required
def create_intervention(current_user_id):
    try:
        title = request.form['title']
        description = request.form['description']
    except KeyError:
        return jsonify({'error': 'Missing required fields'}), 400

    file = request.files.get('image')
    filename = None
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    intervention = Intervention(
        title=title,
        description=description,
        location=request.form.get('location'),
        latitude=request.form.get('latitude', type=float),
        longitude=request.form.get('longitude', type=float),
        image_url=filename,
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

@app.route('/interventions/<int:id>', methods=['PUT'])
@token_required
def update_intervention(current_user_id, id):
    intervention = Intervention.query.get_or_404(id)
    if intervention.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    if 'title' in request.form:
        intervention.title = request.form['title']
    if 'description' in request.form:
        intervention.description = request.form['description']
    if 'location' in request.form:
        intervention.location = request.form['location']
    if 'latitude' in request.form:
        intervention.latitude = request.form.get('latitude', type=float)
    if 'longitude' in request.form:
        intervention.longitude = request.form.get('longitude', type=float)

    file = request.files.get('image')
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        intervention.image_url = filename

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

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
