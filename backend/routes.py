from flask import Blueprint, request, jsonify
from models import User, RedFlag, Intervention, db
from database import bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_routes = Blueprint("auth_routes", __name__)
report_routes = Blueprint("report_routes", __name__)
admin_routes = Blueprint("admin_routes", __name__)

ADMIN_EMAIL = "kamalabdi042@gmail.com"

# User Signup
@auth_routes.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Email already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(data["password"]).decode("utf-8")
    new_user = User(
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=data["email"],
        password=hashed_password
    )
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

# User Login
@auth_routes.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not bcrypt.check_password_hash(user.password, data["password"]):
        return jsonify({"message": "Invalid email or password"}), 401

    access_token = create_access_token(identity={"id": user.id, "email": user.email})
    
    return jsonify({
        "token": access_token,
        "redirect": "/admin-dashboard" if data["email"] == ADMIN_EMAIL else "/dashboard"
    }), 200

# Create RedFlag Report
@report_routes.route("/redflags", methods=["POST"])
@jwt_required()
def create_redflag():
    user_id = get_jwt_identity().get("id")
    data = request.get_json()

    new_redflag = RedFlag(
        title=data["title"],
        description=data["description"],
        location=data["location"],
        user_id=user_id
    )
    
    db.session.add(new_redflag)
    db.session.commit()

    return jsonify({"message": "RedFlag created successfully"}), 201

# Get All RedFlags for Logged-in User
@report_routes.route("/redflags", methods=["GET"])
@jwt_required()
def get_redflags():
    user_id = get_jwt_identity().get("id")
    redflags = RedFlag.query.filter_by(user_id=user_id).all()
    return jsonify([{
        "id": r.id, "title": r.title, "description": r.description, "status": r.status.value
    } for r in redflags]), 200
