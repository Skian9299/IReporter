from flask import jsonify, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

def init_auth_routes(app, bcrypt):
    @app.route('/signup', methods=['POST'])
    def signup_user():
        data = request.get_json()

        # Validate required fields
        required_fields = ['first_name', 'last_name', 'email', 'password']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing fields: {", ".join(missing_fields)}'}), 400

        first_name = data['first_name']
        last_name = data['last_name']
        email = data['email']
        password = data['password']
        role = data.get('role', 'user')  

        # Check if the email is already registered
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        # Create a new user instance
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        new_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hashed_password,
            role=role
        )

        # Save the new user to the database
        try:
            db.session.add(new_user)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to create user', 'message': str(e)}), 500

        # Return the newly created user's details (excluding the password)
        return jsonify(new_user.to_dict()), 201
    
    @app.route('/login', methods=['POST'])
    def login_user():
        data = request.get_json()

        # Validate that both email and password are provided
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password are required'}), 400

        email = data['email']
        password = data['password']

        # Look up the user by email
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            access_token = create_access_token(identity=str(user.id))
            return jsonify({'message': 'Login Success!', 'access_token': access_token, 'role': 'user'})

        # Successful login, return the user details (excluding password)
        return jsonify({'message': 'Login Failed!, check credentials'}), 401
    
    @app.route('/user', methods=['GET'])
    @jwt_required()
    def get_user():
        # Retrieve the user ID from the JWT token
        user_id = get_jwt_identity()
        
        # Query the database for the user with the given ID
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Return the user's details (excluding sensitive data)
        return jsonify(user.to_dict()), 200