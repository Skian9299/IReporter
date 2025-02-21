from flask import Blueprint, request, jsonify
from models import User, Report
from database import db, bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

# Define Blueprints
auth_routes = Blueprint("auth_routes", __name__)
report_routes = Blueprint("report_routes", __name__)
admin_routes = Blueprint("admin_routes", __name__)

# Admin credentials
ADMIN_EMAIL = "quincy@example.com"

# User Sign-up
@auth_routes.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    if password != confirm_password:
        return jsonify({"message": "Passwords do not match"}), 400

    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"message": "Email already exists"}), 400

    # Hash password and create user
    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    new_user = User(first_name=first_name, last_name=last_name, email=email, password=hashed_password)
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User registered successfully"}), 201

# User Login
@auth_routes.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "Invalid email or password"}), 401

    # Generate token
    access_token = create_access_token(identity={"id": user.id, "email": user.email})
    
    # Redirect based on user role
    if email == ADMIN_EMAIL:
        return jsonify({"token": access_token, "redirect": "/admin-dashboard"}), 200
    else:
        return jsonify({"token": access_token, "redirect": "/dashboard"}), 200

# Create Report
@report_routes.route("/api/reports", methods=["POST"])
@jwt_required()
def create_report():
    user_id = get_jwt_identity()["id"]
    data = request.get_json()
    title = data.get("title")
    description = data.get("description")
    image_url = data.get("image_url")
    location = data.get("location")

    new_report = Report(user_id=user_id, title=title, description=description, image_url=image_url, location=location)
    
    db.session.add(new_report)
    db.session.commit()
    return jsonify({"message": "Report created successfully"}), 201

# Get All Reports for Logged-in User
@report_routes.route("/api/reports", methods=["GET"])
@jwt_required()
def get_reports():
    user_id = get_jwt_identity()["id"]
    reports = Report.query.filter_by(user_id=user_id).all()

    report_list = [{"id": r.id, "title": r.title, "description": r.description, "image_url": r.image_url, "location": r.location} for r in reports]
    
    return jsonify(report_list), 200

# Edit Report
@report_routes.route("/api/reports/<int:report_id>", methods=["PUT"])
@jwt_required()
def edit_report(report_id):
    user_id = get_jwt_identity()["id"]
    report = Report.query.filter_by(id=report_id, user_id=user_id).first()

    if not report:
        return jsonify({"message": "Report not found"}), 404

    data = request.get_json()
    report.title = data.get("title", report.title)
    report.description = data.get("description", report.description)
    report.image_url = data.get("image_url", report.image_url)
    report.location = data.get("location", report.location)

    db.session.commit()
    return jsonify({"message": "Report updated successfully"}), 200

# Delete Report
@report_routes.route("/api/reports/<int:report_id>", methods=["DELETE"])
@jwt_required()
def delete_report(report_id):
    user_id = get_jwt_identity()["id"]
    report = Report.query.filter_by(id=report_id, user_id=user_id).first()

    if not report:
        return jsonify({"message": "Report not found"}), 404

    db.session.delete(report)
    db.session.commit()
    return jsonify({"message": "Report deleted successfully"}), 200

# Admin - View All Reports
@admin_routes.route("/api/admin/reports", methods=["GET"])
@jwt_required()
def admin_get_reports():
    user_email = get_jwt_identity()["email"]
    if user_email != ADMIN_EMAIL:
        return jsonify({"message": "Unauthorized"}), 403

    reports = Report.query.all()
    report_list = [{"id": r.id, "title": r.title, "description": r.description, "image_url": r.image_url, "location": r.location} for r in reports]
    
    return jsonify(report_list), 200
