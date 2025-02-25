from flask import Blueprint, request, jsonify
from models import User, RedFlag, Intervention, db
from database import bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_routes = Blueprint("auth_routes", __name__)
report_routes = Blueprint("report_routes", __name__)
admin_routes = Blueprint("admin_routes", __name__)

ADMIN_EMAIL = "kamalabdi042@gmail.com"

# ==============================
# 🚀 USER AUTHENTICATION ROUTES
# ==============================

# ✅ User Signup
@auth_routes.route("/signup", methods=["POST"])
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request. No data provided"}), 400

        first_name = data.get("first_name", "").strip()
        last_name = data.get("last_name", "").strip()
        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        # Validate required fields
        if not first_name or not last_name or not email or not password:
            return jsonify({"error": "All fields are required"}), 400

        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        # Hash the password
        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

        # Create new user
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hashed_password
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        print(f"Signup error: {e}")  # Log error for debugging
        return jsonify({"error": "Internal server error"}), 500


# ✅ User Login
@auth_routes.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request. No data provided"}), 400

        email = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password, password):
            return jsonify({"error": "Invalid email or password"}), 401

        # Determine user role
        role = "admin" if email == ADMIN_EMAIL else "user"

        # Create JWT token
        access_token = create_access_token(identity={"id": user.id, "email": user.email})

        return jsonify({
            "token": access_token,
            "role": role,
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email
            },
            "redirect": "/admin-dashboard" if role == "admin" else "/dashboard"
        }), 200

    except Exception as e:
        print(f"Login error: {e}")  # Log error for debugging
        return jsonify({"error": "Internal server error"}), 500


# ==============================
# 🚀 RED FLAG REPORT ROUTES
# ==============================

# ✅ Create RedFlag Report
@report_routes.route("/redflags", methods=["POST"])
@jwt_required()
def create_redflag():
    try:
        user_id = get_jwt_identity().get("id")
        data = request.get_json()

        if not data or not data.get("title") or not data.get("description") or not data.get("location"):
            return jsonify({"error": "All fields are required"}), 400

        new_redflag = RedFlag(
            title=data["title"],
            description=data["description"],
            location=data["location"],
            user_id=user_id
        )

        db.session.add(new_redflag)
        db.session.commit()

        return jsonify({"message": "RedFlag created successfully"}), 201

    except Exception as e:
        print(f"RedFlag error: {e}")  # Log error
        return jsonify({"error": "Internal server error"}), 500


# ✅ Get All RedFlags for Logged-in User
@report_routes.route("/redflags", methods=["GET"])
@jwt_required()
def get_redflags():
    try:
        user_id = get_jwt_identity().get("id")
        redflags = RedFlag.query.filter_by(user_id=user_id).all()

        return jsonify([{
            "id": r.id, "title": r.title, "description": r.description, "status": r.status.value
        } for r in redflags]), 200

    except Exception as e:
        print(f"Fetch RedFlags error: {e}")  # Log error
        return jsonify({"error": "Internal server error"}), 500


# ==============================
# 🚀 ADMIN ROUTES
# ==============================

# ✅ Get All Reports (Admin)
@admin_routes.route("/all-reports", methods=["GET"])
@jwt_required()
def get_all_reports():
    try:
        current_user = get_jwt_identity()
        if current_user["email"] != ADMIN_EMAIL:
            return jsonify({"error": "Unauthorized"}), 403

        redflags = RedFlag.query.all()
        interventions = Intervention.query.all()

        reports = {
            "redflags": [{
                "id": r.id, "title": r.title, "description": r.description, "status": r.status.value
            } for r in redflags],

            "interventions": [{
                "id": i.id, "title": i.title, "description": i.description, "status": i.status.value
            } for i in interventions]
        }

        return jsonify(reports), 200

    except Exception as e:
        print(f"Admin fetch reports error: {e}")  # Log error
        return jsonify({"error": "Internal server error"}), 500


# ✅ Update Report Status (Admin)
@admin_routes.route("/update-status/<int:report_id>", methods=["PUT"])
@jwt_required()
def update_report_status(report_id):
    try:
        current_user = get_jwt_identity()
        if current_user["email"] != ADMIN_EMAIL:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json()
        if not data or "status" not in data:
            return jsonify({"error": "New status is required"}), 400

        # Update status of either RedFlag or Intervention
        report = RedFlag.query.get(report_id) or Intervention.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404

        report.status = data["status"]
        db.session.commit()

        return jsonify({"message": "Report status updated successfully"}), 200

    except Exception as e:
        print(f"Update report status error: {e}")  # Log error
        return jsonify({"error": "Internal server error"}), 500
