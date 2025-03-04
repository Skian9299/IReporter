from flask import Flask, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required, create_access_token, get_jwt_identity
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
import traceback
import os
from models import db, User, RedFlag, Intervention
from serializers import user_schema, redflag_schema, redflags_schema, intervention_schema, interventions_schema
from flask_cors import cross_origin

bcrypt = Bcrypt()

def register_routes(app):
    # ---------- HELPER FUNCTIONS ---------- #
    def allowed_file(filename):
        return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

    # ---------- HANDLE CORS PRE-FLIGHT REQUESTS ---------- #
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            return jsonify({"message": "CORS preflight passed"}), 200

    # ---------- AUTHENTICATION ROUTES ---------- #
    @app.route('/signup', methods=['POST'])
    def signup():
        try:
            data = request.json
            first_name, last_name, email = data.get('first_name'), data.get('last_name'), data.get('email')
            password, confirm_password = data.get('password'), data.get('confirm_password')

            if not all([first_name, last_name, email, password, confirm_password]):
                return jsonify({"error": "All fields are required"}), 400

            if password != confirm_password:
                return jsonify({"error": "Passwords do not match"}), 400

            existing_user = User.query.filter_by(email=email).first()
            if existing_user:
                return jsonify({"error": "Email already in use"}), 400

            hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

            new_user = User(first_name=first_name, last_name=last_name, email=email, password_hash=hashed_password)
            db.session.add(new_user)
            db.session.commit()

            token = create_access_token(identity={"id": new_user.id, "role": "user"})
            return jsonify({"message": "Sign-up successful", "token": token, "user": user_schema.dump(new_user)}), 201
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

    @app.route('/login', methods=['POST'])
    def login():
        try:
            data = request.json
            email, password = data.get('email'), data.get('password')

            if not email or not password:
                return jsonify({"error": "Email and password are required"}), 400

            user = User.query.filter_by(email=email).first()
            if not user or not bcrypt.check_password_hash(user.password_hash, password):
                return jsonify({"error": "Invalid email or password"}), 401

            token = create_access_token(identity={"id": user.id, "role": "user"})
            return jsonify({"message": "Login successful", "token": token, "user": user_schema.dump(user)}), 200
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

    @app.route("/admin/login", methods=["POST"])
    @cross_origin()
    def admin_login():
        try:
            data = request.get_json()
            email = data.get("email")
            password = data.get("password")

            admin = User.query.filter_by(email=email, is_admin=True).first()

            if admin and bcrypt.check_password_hash(admin.password_hash, password):
                token = create_access_token(identity={"id": admin.id, "role": "admin"})
                return jsonify({"message": "Admin login successful", "token": token}), 200

            return jsonify({"error": "Invalid credentials"}), 401
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

    # ---------- CREATE REPORT ROUTES ---------- #
    @app.route('/redflags', methods=['POST'])
    @jwt_required()
    def create_redflag():
        try:
            current_user = get_jwt_identity()
            user_id = current_user.get("id")

            data = request.json
            title, description, location = data.get('title'), data.get('description'), data.get('location')

            if not title or not description or not location:
                return jsonify({"error": "Title, description, and location are required"}), 400

            new_redflag = RedFlag(title=title, description=description, location=location, user_id=user_id)
            db.session.add(new_redflag)
            db.session.commit()
            return jsonify(redflag_schema.dump(new_redflag)), 201
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

    @app.route('/interventions', methods=['POST'])
    @jwt_required()
    def create_intervention():
        try:
            current_user = get_jwt_identity()
            user_id = current_user.get("id")

            data = request.json
            title, description, location = data.get('title'), data.get('description'), data.get('location')

            if not title or not description or not location:
                return jsonify({"error": "Title, description, and location are required"}), 400

            new_intervention = Intervention(title=title, description=description, location=location, user_id=user_id)
            db.session.add(new_intervention)
            db.session.commit()
            return jsonify(intervention_schema.dump(new_intervention)), 201
        except Exception as e:
            traceback.print_exc()
            return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

    # ---------- DELETE REPORT ROUTES ---------- #
    @app.route('/redflags/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_redflag(id):
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        redflag = RedFlag.query.filter_by(id=id, user_id=user_id).first()
        if not redflag:
            return jsonify({"error": "Red flag not found or unauthorized"}), 404

        db.session.delete(redflag)
        db.session.commit()
        return jsonify({"message": "Red flag deleted successfully"}), 200

    @app.route('/interventions/<int:id>', methods=['DELETE'])
    @jwt_required()
    def delete_intervention(id):
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        intervention = Intervention.query.filter_by(id=id, user_id=user_id).first()
        if not intervention:
            return jsonify({"error": "Intervention not found or unauthorized"}), 404

        db.session.delete(intervention)
        db.session.commit()
        return jsonify({"message": "Intervention deleted successfully"}), 200

    # ---------- FETCH REPORTS ROUTES ---------- #
    @app.route('/redflags', methods=['GET'])
    @jwt_required()
    def get_redflags():
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        redflags = RedFlag.query.filter_by(user_id=user_id).all()
        return jsonify(redflags_schema.dump(redflags)), 200

    @app.route('/interventions', methods=['GET'])
    @jwt_required()
    def get_interventions():
        current_user = get_jwt_identity()
        user_id = current_user.get("id")

        interventions = Intervention.query.filter_by(user_id=user_id).all()
        return jsonify(interventions_schema.dump(interventions)), 200
