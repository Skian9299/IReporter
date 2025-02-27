from flask import Blueprint, request, jsonify
from models import User, RedFlag, Intervention, db
from database import bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_cors import cross_origin

auth_routes = Blueprint("auth_routes", __name__)
report_routes = Blueprint("report_routes", __name__)
admin_routes = Blueprint("admin_routes", __name__)

ADMIN_EMAIL = "kamalabdi042@gmail.com"

# ==============================
# 🚀 USER AUTHENTICATION ROUTES
# ==============================

# ✅ User Signup
@auth_routes.route("/signup", methods=["POST"])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request. No data provided"}), 400

        first_name, last_name, email, password = map(str.strip, [
            data.get("first_name", ""), data.get("last_name", ""),
            data.get("email", ""), data.get("password", "")
        ])

        if not all([first_name, last_name, email, password]):
            return jsonify({"error": "All fields are required"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

        new_user = User(first_name=first_name, last_name=last_name, email=email, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ✅ User Login
@auth_routes.route("/login", methods=["POST"])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request. No data provided"}), 400

        email, password = map(str.strip, [data.get("email", ""), data.get("password", "")])
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password, password):
            return jsonify({"error": "Invalid email or password"}), 401

        role = "admin" if email == ADMIN_EMAIL else "user"
        access_token = create_access_token(identity={"id": user.id, "email": user.email})

        return jsonify({
            "token": access_token, "role": role,
            "user": {"id": user.id, "first_name": user.first_name, "last_name": user.last_name, "email": user.email},
            "redirect": "/admin-dashboard" if role == "admin" else "/dashboard"
        }), 200

    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ==============================
# 🚀 RED FLAG REPORT ROUTES
# ==============================

# ✅ Create RedFlag Report
@report_routes.route("/redflags", methods=["POST"])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
@jwt_required()
def create_redflag():
    try:
        user_id = get_jwt_identity().get("id")
        data = request.get_json()

        if not all([data.get("title"), data.get("description"), data.get("location")]):
            return jsonify({"error": "All fields are required"}), 400

        new_redflag = RedFlag(title=data["title"], description=data["description"], location=data["location"], user_id=user_id)
        db.session.add(new_redflag)
        db.session.commit()

        return jsonify({"message": "RedFlag created successfully"}), 201

    except Exception as e:
        print(f"RedFlag error: {e}")
        return jsonify({"error": "Internal server error"}), 500


# ==============================
# 🚀 ADMIN ROUTES
# ==============================

# ✅ Get All Reports (Admin)
@admin_routes.route("/all-reports", methods=["GET"])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
@jwt_required()
def get_all_reports():
    try:
        current_user = get_jwt_identity()
        if current_user["email"] != ADMIN_EMAIL:
            return jsonify({"error": "Unauthorized"}), 403

        redflags = RedFlag.query.all()
        interventions = Intervention.query.all()

        reports = {
            "redflags": [{"id": r.id, "title": r.title, "description": r.description, "status": r.status.value} for r in redflags],
            "interventions": [{"id": i.id, "title": i.title, "description": i.description, "status": i.status.value} for i in interventions]
        }

        return jsonify(reports), 200

    except Exception as e:
        print(f"Admin fetch reports error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    

# ✅ Admin Login (Fix)
@admin_routes.route("/login", methods=["POST", "OPTIONS"])
@cross_origin(origins="http://localhost:3000", supports_credentials=True)
def admin_login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request. No data provided"}), 400

        email, password = map(str.strip, [data.get("email", ""), data.get("password", "")])
        if email != ADMIN_EMAIL:
            return jsonify({"error": "Unauthorized access"}), 401

        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password, password):
            return jsonify({"error": "Invalid email or password"}), 401

        access_token = create_access_token(identity={"id": user.id, "email": user.email})
        return jsonify({"token": access_token, "role": "admin"}), 200

    except Exception as e:
        print(f"Admin login error: {e}")
        return jsonify({"error": "Internal server error"}), 500
