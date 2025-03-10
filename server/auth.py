from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt
)
from models import db, User

auth_bp = Blueprint('auth', __name__)  # Define blueprint first
CORS(auth_bp)  # Apply CORS to the entire auth blueprint
# In-memory store for revoked tokens (for demonstration purposes)
blacklist = set()
@auth_bp.route('/register', methods=['POST'])
@cross_origin()
def register():
    data = request.get_json()
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'user')

    # Check if the user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User already exists"}), 400

    # Create new user and hash password
    new_user = User(first_name=first_name, last_name=last_name, email=email, role=role)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
@cross_origin(supports_credentials=True) 
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

     # Create access token
    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        access_token=access_token,
        role=user.role,
        user={
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    ), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
@cross_origin()
def logout():
    jti = get_jwt()['jti']
    blacklist.add(jti)
    return jsonify({"msg": "Successfully logged out"}), 200

@auth_bp.route('/reset-password', methods=['POST'])
@cross_origin()
def reset_password():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not email or not new_password or not confirm_password:
        return jsonify({"error": "Missing required fields."}), 400
    
    if new_password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "User not found."}), 404

    # Update the user's password after hashing it
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password updated successfully."}), 200
