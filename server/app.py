from functools import wraps
import os
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS, cross_origin
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from auth import auth_bp, blacklist
from flask_jwt_extended import JWTManager, get_jwt_identity, jwt_required
from models import db, Report, User, Intervention, RedFlag, Status
from flask_mail import Mail, Message


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
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Ensure upload directory exists
if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# Initialize extensions
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

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return jti in blacklist

# Register the authentication blueprint
app.register_blueprint(auth_bp, url_prefix='/auth')

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# -------------------------
# RedFlag Routes
# -------------------------

@app.route('/redflags', methods=['POST'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def create_redflag():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing JSON data'}), 400

    # Validate required fields
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
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def edit_redflag(id):
    current_user_id = get_jwt_identity()
    redflag = RedFlag.query.get_or_404(id)
    if int(redflag.user_id) != int(current_user_id):
     return jsonify({'error': 'Unauthorized access.'}), 403


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

@app.route('/redflags/<int:id>', methods=['DELETE'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def delete_redflag(id):
    current_user_id = get_jwt_identity()
    redflag = RedFlag.query.get_or_404(id)
    if int(redflag.user_id) != int(current_user_id):
        return jsonify({'error': 'Unauthorized access.'}), 403
       


    db.session.delete(redflag)
    db.session.commit()
    return jsonify({'message': 'Red flag deleted successfully.'}), 200

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
@app.route('/interventions/<int:id>', methods=['PUT'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def edit_intervention(id):
    current_user_id = get_jwt_identity()  # Get user ID from JWT
    intervention = Intervention.query.get_or_404(id)

    print(f"📝 Edit Attempt - JWT User: {current_user_id}, Report Owner: {intervention.user_id}")

    if int(intervention.user_id) != int(current_user_id):
        print(f"❌ Edit Denied - User {current_user_id} does not own Intervention {id}")
        return jsonify({'error': 'Unauthorized access.'}), 403

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
    print(f"✅ Edit Successful - Intervention {id} updated by User {current_user_id}")
    return jsonify(intervention.to_dict()), 200


@app.route('/interventions/<int:id>', methods=['DELETE'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def delete_intervention(id):
    current_user_id = get_jwt_identity()
    intervention = Intervention.query.get_or_404(id)

    print(f"🗑 Delete Attempt - JWT User: {current_user_id}, Report Owner: {intervention.user_id}")

    if int(intervention.user_id) != int(current_user_id):
        print(f"❌ Delete Denied - User {current_user_id} does not own Intervention {id}")
        return jsonify({'error': 'Unauthorized access.'}), 403

    print(f"✅ Delete Successful - User {current_user_id} deleted Intervention {id}")
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
    redflags = RedFlag.query.filter_by(user_id=current_user_id).all()
    interventions = Intervention.query.filter_by(user_id=current_user_id).all()
    return jsonify({
        "redflags": [r.to_dict() for r in redflags],
        "interventions": [i.to_dict() for i in interventions]
    }), 200

# Get all red flags for the currently authenticated user
@app.route('/redflags', methods=['GET'])
@jwt_required()
def get_redflags():
    redflags = RedFlag.query.all()
    return jsonify([redflag.to_dict() for redflag in redflags]), 200

@app.route('/interventions', methods=['GET'])
@jwt_required()
def get_interventions():
    interventions = Intervention.query.all()
    return jsonify([intervention.to_dict() for intervention in interventions]), 200

# Update Report Status (Admin Only)

@app.route('/reports/<int:report_id>/status', methods=['PATCH'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def update_report_status(report_id):
    current_user_id = get_jwt_identity()
    print(f"🔍 Admin Attempt - JWT User: {current_user_id}")

    # Fetch the admin user from the database
    admin_user = User.query.filter_by(id=current_user_id).first()

    if not admin_user:
        print("❌ User Not Found in Database")
        return jsonify({"error": "User not found"}), 404

    print(f"✅ User Found: {admin_user.id}, Role: {admin_user.role}")

    # Ensure user is an admin
    if admin_user.role != "admin":
        print(f"❌ Access Denied - User {current_user_id} is NOT an admin.")
        return jsonify({"error": "Unauthorized access. Only admins can update reports."}), 403

    # Fetch the report
    report = Report.query.get(report_id)
    if not report:
        print(f"❌ Report {report_id} Not Found")
        return jsonify({"error": "Report not found"}), 404

    # Get status from request
    data = request.get_json()
    if not data or "status" not in data:
        return jsonify({"error": "Missing status field"}), 400

    new_status = data["status"].strip().upper()  # Convert status to uppercase
    allowed_statuses = ["RESOLVED", "REJECTED"]

    if new_status not in allowed_statuses:
        return jsonify({"error": f"Invalid status value. Allowed values: {allowed_statuses}"}), 400

    # Update report status
    report.status = new_status
    db.session.commit()

    print(f"✅ Status Updated - Report {report_id} set to {new_status} by Admin {current_user_id}")
    return jsonify({"message": f"Report {report_id} marked as {new_status}"}), 200




@app.route('/send-email', methods=['POST', 'OPTIONS'])
@cross_origin(origin="*", supports_credentials=True)
@jwt_required()
def send_email():
    data = request.get_json()
    print("📩 Raw Request Data:", request.get_json())  # Debugging received JSON

    

    # Additional debugging to check which fields are missing
    missing_fields = [key for key in ["email", "status", "report_id"] if key not in data]
    if missing_fields:
        print(f"❌ ERROR: Missing fields in request: {missing_fields}")

    # Validate required fields
    if not all(key in data for key in ["email", "status", "report_id"]):
        return jsonify({"error": "Missing required fields", "received": data}), 400

    user_email = data["email"]
    report_status = data["status"]
    report_id = data["report_id"]

    print("✅ Final Data to Send Email:", user_email, report_status, report_id)  # Debugging extracted values

    subject = "Report Status Update"
    body = f"Hello,\n\nYour report (ID: {report_id}) has been updated to: {report_status}.\n\nThank you."

    try:
        # Send email
        msg = Message(subject, recipients=[user_email])
        msg.body = body
        mail.send(msg)

        return jsonify({"message": f"Email sent to {user_email} about report {report_id}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500




if __name__ == '__main__':
    app.run(debug=True)
