from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from models import db, User, RedFlag, Intervention, Media
from serializers import user_schema, redflag_schema, redflags_schema, intervention_schema, interventions_schema



app = Flask(__name__)
CORS(app)  # Allow cross-origin requests (important for frontend)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ireporter.db'  # Change to PostgreSQL if needed
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'

# Initialize Extensions
db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# ---------- AUTHENTICATION ROUTES ---------- #

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(
        first_name=data['first_name'],
        last_name=data['last_name'],
        email=data['email'],
        password_hash=hashed_pw,
        is_admin=data.get('is_admin', False)
    )
    
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "User created successfully", "user": user_schema.dump(user)}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.check_password_hash(user.password_hash, data['password']):
        login_user(user)
        return jsonify({"message": "Login successful", "user": user_schema.dump(user)}), 200

    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

# ---------- REDFLAG CRUD ROUTES ---------- #

@app.route('/redflags', methods=['POST'])
@login_required
def create_redflag():
    data = request.json
    if not data.get("title") or not data.get("description"):
        return jsonify({"error": "Title and description are required"}), 400
    
    redflag = RedFlag(
        title=data['title'],
        description=data['description'],
        location=data.get('location', 'Unknown'),
        user_id=current_user.id
    )

    db.session.add(redflag)
    db.session.commit()
    return jsonify({"message": "Red flag created", "redflag": redflag_schema.dump(redflag)}), 201

@app.route('/redflags', methods=['GET'])
def get_redflags():
    redflags = RedFlag.query.all()
    return jsonify(redflags_schema.dump(redflags)), 200

@app.route('/redflags/<int:redflag_id>', methods=['PUT'])
@login_required
def update_redflag(redflag_id):
    redflag = RedFlag.query.get_or_404(redflag_id)

    if redflag.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    redflag.title = data.get('title', redflag.title)
    redflag.description = data.get('description', redflag.description)
    redflag.location = data.get('location', redflag.location)

    db.session.commit()
    return jsonify({"message": "Red flag updated", "redflag": redflag_schema.dump(redflag)}), 200

@app.route('/redflags/<int:redflag_id>', methods=['DELETE'])
@login_required
def delete_redflag(redflag_id):
    redflag = RedFlag.query.get_or_404(redflag_id)

    if redflag.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(redflag)
    db.session.commit()
    return jsonify({"message": "Red flag deleted"}), 200

# ---------- INTERVENTION CRUD ROUTES ---------- #

@app.route('/interventions', methods=['POST'])
@login_required
def create_intervention():
    data = request.json
    if not data.get("title") or not data.get("description"):
        return jsonify({"error": "Title and description are required"}), 400
    
    intervention = Intervention(
        title=data['title'],
        description=data['description'],
        location=data.get('location', 'Unknown'),
        user_id=current_user.id
    )

    db.session.add(intervention)
    db.session.commit()
    return jsonify({"message": "Intervention created", "intervention": intervention_schema.dump(intervention)}), 201

@app.route('/interventions', methods=['GET'])
def get_interventions():
    interventions = Intervention.query.all()
    return jsonify(interventions_schema.dump(interventions)), 200

@app.route('/interventions/<int:intervention_id>', methods=['PUT'])
@login_required
def update_intervention(intervention_id):
    intervention = Intervention.query.get_or_404(intervention_id)

    if intervention.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.json
    intervention.title = data.get('title', intervention.title)
    intervention.description = data.get('description', intervention.description)
    intervention.location = data.get('location', intervention.location)

    db.session.commit()
    return jsonify({"message": "Intervention updated", "intervention": intervention_schema.dump(intervention)}), 200

@app.route('/interventions/<int:intervention_id>', methods=['DELETE'])
@login_required
def delete_intervention(intervention_id):
    intervention = Intervention.query.get_or_404(intervention_id)

    if intervention.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(intervention)
    db.session.commit()
    return jsonify({"message": "Intervention deleted"}), 200

# ---------- RUN APP ---------- #
if __name__ == '__main__':
    app.run(debug=True)
