# from flask import Flask, request, jsonify
# from flask_sqlalchemy import SQLAlchemy
# from flask_migrate import Migrate
# from flask_bcrypt import Bcrypt
# from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
# from flask_cors import CORS
# from models import db, User, RedFlag, Intervention, Media
# from serializers import user_schema, redflag_schema, redflags_schema, intervention_schema, interventions_schema
# import os
# from dotenv import load_dotenv

# # Load environment variables from .env file
# load_dotenv()

# app = Flask(__name__)

# # ---------- CONFIGURATION ---------- #
# app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ireporter.db')  # PostgreSQL recommended
# app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'supersecretkey')  # Use environment variables

# # Initialize Extensions
# db.init_app(app)
# migrate = Migrate(app, db)
# bcrypt = Bcrypt(app)
# jwt = JWTManager(app)

# # Enable CORS for frontend at http://localhost:3000
# CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# # ---------- HELPER FUNCTIONS ---------- #

# def validate_required_fields(data, required_fields):
#     """Validate that all required fields are present in the request data."""
#     missing_fields = [field for field in required_fields if field not in data]
#     if missing_fields:
#         return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
#     return None

# @app.errorhandler(500)
# def handle_500_error(e):
#     """Handle unexpected server errors gracefully."""
#     return jsonify({"error": "Internal Server Error"}), 500

# # ---------- AUTHENTICATION ROUTES ---------- #

# @app.route('/signup', methods=['POST'])
# def signup():
#     """Register a new user."""
#     data = request.json
#     required_fields = ['first_name', 'last_name', 'email', 'password']
#     error_response = validate_required_fields(data, required_fields)
#     if error_response:
#         return error_response

#     if User.query.filter_by(email=data['email']).first():
#         return jsonify({"error": "Email already registered"}), 400
    
#     hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
#     user = User(
#         first_name=data['first_name'],
#         last_name=data['last_name'],
#         email=data['email'],
#         password_hash=hashed_pw,
#         is_admin=data.get('is_admin', False)  # Admins should not be created from sign-up
#     )
    
#     db.session.add(user)
#     db.session.commit()

#     # Generate JWT Token
#     token = create_access_token(identity={"id": user.id, "role": "admin" if user.is_admin else "user"})

#     return jsonify({"message": "User created successfully", "token": token, "user": user_schema.dump(user)}), 201

# @app.route('/login', methods=['POST'])
# def login():
#     """Log in a user and return JWT token."""
#     data = request.json
#     required_fields = ['email', 'password']
#     error_response = validate_required_fields(data, required_fields)
#     if error_response:
#         return error_response

#     user = User.query.filter_by(email=data['email']).first()

#     if user and bcrypt.check_password_hash(user.password_hash, data['password']):
#         token = create_access_token(identity={"id": user.id, "role": "admin" if user.is_admin else "user"})
#         return jsonify({"message": "Login successful", "token": token, "role": "admin" if user.is_admin else "user", "user": user_schema.dump(user)}), 200

#     return jsonify({"error": "Invalid credentials"}), 401

# @app.route('/logout', methods=['POST'])
# @jwt_required()
# def logout():
#     """JWT does not support logout, so logout is handled on the frontend by clearing the token."""
#     return jsonify({"message": "Logged out successfully"}), 200

# # ---------- REDFLAG CRUD ROUTES ---------- #

# @app.route('/redflags', methods=['POST'])
# @jwt_required()
# def create_redflag():
#     """Create a new red flag."""
#     current_user = get_jwt_identity()
#     data = request.json
#     required_fields = ['title', 'description']
#     error_response = validate_required_fields(data, required_fields)
#     if error_response:
#         return error_response
    
#     redflag = RedFlag(
#         title=data['title'],
#         description=data['description'],
#         location=data.get('location', 'Unknown'),
#         user_id=current_user['id']
#     )

#     db.session.add(redflag)
#     db.session.commit()
#     return jsonify({"message": "Red flag created", "redflag": redflag_schema.dump(redflag)}), 201

# @app.route('/redflags', methods=['GET'])
# @jwt_required()
# def get_redflags():
#     """Get all red flags."""
#     redflags = RedFlag.query.all()
#     return jsonify(redflags_schema.dump(redflags)), 200

# @app.route('/redflags/<int:redflag_id>', methods=['PUT'])
# @jwt_required()
# def update_redflag(redflag_id):
#     """Update a red flag."""
#     current_user = get_jwt_identity()
#     redflag = RedFlag.query.get_or_404(redflag_id)

#     if redflag.user_id != current_user['id']:
#         return jsonify({"error": "Unauthorized"}), 403

#     data = request.json
#     redflag.title = data.get('title', redflag.title)
#     redflag.description = data.get('description', redflag.description)
#     redflag.location = data.get('location', redflag.location)

#     db.session.commit()
#     return jsonify({"message": "Red flag updated", "redflag": redflag_schema.dump(redflag)}), 200

# @app.route('/redflags/<int:redflag_id>', methods=['DELETE'])
# @jwt_required()
# def delete_redflag(redflag_id):
#     """Delete a red flag."""
#     current_user = get_jwt_identity()
#     redflag = RedFlag.query.get_or_404(redflag_id)

#     if redflag.user_id != current_user['id']:
#         return jsonify({"error": "Unauthorized"}), 403

#     db.session.delete(redflag)
#     db.session.commit()
#     return jsonify({"message": "Red flag deleted"}), 200

# # ---------- INTERVENTION CRUD ROUTES ---------- #

# @app.route('/interventions', methods=['POST'])
# @jwt_required()
# def create_intervention():
#     """Create a new intervention."""
#     current_user = get_jwt_identity()
#     data = request.json
#     required_fields = ['title', 'description']
#     error_response = validate_required_fields(data, required_fields)
#     if error_response:
#         return error_response
    
#     intervention = Intervention(
#         title=data['title'],
#         description=data['description'],
#         location=data.get('location', 'Unknown'),
#         user_id=current_user['id']
#     )

#     db.session.add(intervention)
#     db.session.commit()
#     return jsonify({"message": "Intervention created", "intervention": intervention_schema.dump(intervention)}), 201

# @app.route('/interventions', methods=['GET'])
# @jwt_required()
# def get_interventions():
#     """Get all interventions."""
#     interventions = Intervention.query.all()
#     return jsonify(interventions_schema.dump(interventions)), 200

# # ---------- RUN APP ---------- #
# if __name__ == '__main__':
#     app.run(debug=True) 


from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, RedFlag, Intervention, Media
from serializers import user_schema, redflag_schema, redflags_schema, intervention_schema, interventions_schema
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# ---------- CONFIGURATION ---------- #
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///ireporter.db')  # PostgreSQL recommended
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'supersecretkey')  # Use environment variables

# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Enable CORS for frontend at http://localhost:3000
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# ---------- HELPER FUNCTIONS ---------- #

def validate_required_fields(data, required_fields):
    """Validate that all required fields are present in the request data."""
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
    return None

@app.errorhandler(500)
def handle_500_error(e):
    """Handle unexpected server errors gracefully."""
    return jsonify({"error": "Internal Server Error"}), 500

# ---------- AUTHENTICATION ROUTES ---------- #

@app.route('/signup', methods=['POST'])
def signup():
    """Register a new user."""
    data = request.json
    required_fields = ['first_name', 'last_name', 'email', 'password']
    error_response = validate_required_fields(data, required_fields)
    if error_response:
        return error_response

    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        password_hash=hashed_pw,
        is_admin=data.get('is_admin', False)  # Admins should not be created from sign-up
    )
    
    db.session.add(user)
    db.session.commit()

    # Generate JWT Token
    token = create_access_token(identity={"id": user.id, "role": "admin" if user.is_admin else "user"})

    return jsonify({"message": "User created successfully", "token": token, "user": user_schema.dump(user)}), 201

@app.route('/login', methods=['POST'])
def login():
    """Log in a user and return JWT token."""
    data = request.json
    required_fields = ['email', 'password']
    error_response = validate_required_fields(data, required_fields)
    if error_response:
        return error_response

    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        token = create_access_token(identity={"id": user.id, "role": "admin" if user.is_admin else "user"})
        response = {
            "message": "Login successful",
            "token": token,
            "role": "admin" if user.is_admin else "user",
            "user": user_schema.dump(user)
        }
        print("Login Response:", response)  # Debugging log
        return jsonify(response), 200

    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """JWT does not support logout, so logout is handled on the frontend by clearing the token."""
    return jsonify({"message": "Logged out successfully"}), 200

# ---------- REDFLAG CRUD ROUTES ---------- #

@app.route('/redflags', methods=['POST'])
@jwt_required()
def create_redflag():
    """Create a new red flag."""
    current_user = get_jwt_identity()
    data = request.json
    required_fields = ['title', 'description']
    error_response = validate_required_fields(data, required_fields)
    if error_response:
        return error_response
    
    redflag = RedFlag(
        title=data['title'],
        description=data['description'],
        location=data.get('location', 'Unknown'),
        user_id=current_user['id']
    )

    db.session.add(redflag)
    db.session.commit()
    return jsonify({"message": "Red flag created", "redflag": redflag_schema.dump(redflag)}), 201

@app.route('/redflags', methods=['GET'])
@jwt_required()
def get_redflags():
    """Get all red flags."""
    redflags = RedFlag.query.all()
    return jsonify(redflags_schema.dump(redflags)), 200

@app.route('/redflags/<int:redflag_id>', methods=['PUT'])
@jwt_required()
def update_redflag(redflag_id):
    """Update a red flag."""
    current_user = get_jwt_identity()
    redflag = RedFlag.query.get_or_404(redflag_id)

    if redflag.user_id != current_user['id']:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    redflag.title = data.get('title', redflag.title)
    redflag.description = data.get('description', redflag.description)
    redflag.location = data.get('location', redflag.location)

    db.session.commit()
    return jsonify({"message": "Red flag updated", "redflag": redflag_schema.dump(redflag)}), 200

@app.route('/redflags/<int:redflag_id>', methods=['DELETE'])
@jwt_required()
def delete_redflag(redflag_id):
    """Delete a red flag."""
    current_user = get_jwt_identity()
    redflag = RedFlag.query.get_or_404(redflag_id)

    if redflag.user_id != current_user['id']:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(redflag)
    db.session.commit()
    return jsonify({"message": "Red flag deleted"}), 200

# ---------- INTERVENTION CRUD ROUTES ---------- #

@app.route('/interventions', methods=['POST'])
@jwt_required()
def create_intervention():
    """Create a new intervention."""
    current_user = get_jwt_identity()
    data = request.json
    required_fields = ['title', 'description']
    error_response = validate_required_fields(data, required_fields)
    if error_response:
        return error_response
    
    intervention = Intervention(
        title=data['title'],
        description=data['description'],
        location=data.get('location', 'Unknown'),
        user_id=current_user['id']
    )

    db.session.add(intervention)
    db.session.commit()
    return jsonify({"message": "Intervention created", "intervention": intervention_schema.dump(intervention)}), 201

@app.route('/interventions', methods=['GET'])
@jwt_required()
def get_interventions():
    """Get all interventions."""
    interventions = Intervention.query.all()
    return jsonify(interventions_schema.dump(interventions)), 200

# ---------- RUN APP ---------- #
if __name__ == '__main__':
    app.run(debug=True) 
