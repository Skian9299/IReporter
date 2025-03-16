from datetime import datetime 
from flask import request, jsonify
from models import db, RedFlag, Intervention, User
from flask_jwt_extended import jwt_required, get_jwt_identity
import resend

def report_routes(app):
    @app.route('/redflags', methods=['POST'])
    @jwt_required()
    def create_redflag():
        data = request.get_json()
        user_id = get_jwt_identity()

        # Validate required fields
        required_fields = ['title', 'description']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing fields: {", ".join(missing_fields)}'}), 400

        # Create a new RedFlag instance
        new_redflag = RedFlag(
            title=data['title'],
            description=data['description'],
            user_id=user_id,
            location=data.get('location'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            image_url=data.get('image_url'),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Add the record to the database and commit the session
        try:
            db.session.add(new_redflag)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to create redflag', 'message': str(e)}), 500

        # Return the created redflag as JSON using SerializerMixin's to_dict method
        return jsonify(new_redflag.to_dict()), 201
    
    @app.route('/redflags', methods=['GET'])
    def get_redflags():
        try:
            redflags = RedFlag.query.all()
            redflags_list = [redflag.to_dict() for redflag in redflags]
            return jsonify(redflags_list), 200
        except Exception as e:
            return jsonify({'error': 'Unable to fetch redflags', 'message': str(e)}), 500
        
    
    @app.route('/user/redflags', methods=['GET'])
    @jwt_required()
    def get_user_redflags():
        user_id = get_jwt_identity()

        try:
            # Query for redflag records that belong to the current user
            redflags = RedFlag.query.filter_by(user_id=user_id).all()
            redflags_list = [redflag.to_dict() for redflag in redflags]
            return jsonify(redflags_list), 200
        except Exception as e:
            return jsonify({'error': 'Unable to fetch redflags for the user', 'message': str(e)}), 500
    
    
    @app.route('/interventions', methods=['POST'])
    @jwt_required()
    def create_intervention():
        data = request.get_json()
        user_id = get_jwt_identity()

        # Validate required fields
        required_fields = ['title', 'description']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({'error': f'Missing fields: {", ".join(missing_fields)}'}), 400

        # Create a new Intervention instance
        new_intervention = Intervention(
            title=data['title'],
            description=data['description'],
            user_id=user_id,
            location=data.get('location'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            image_url=data.get('image_url'),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        # Add the record to the database and commit the session
        try:
            db.session.add(new_intervention)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to create intervention', 'message': str(e)}), 500

        # Return the created intervention as JSON using SerializerMixin's to_dict method
        return jsonify(new_intervention.to_dict()), 201
    
    @app.route('/interventions', methods=['GET'])
    def get_interventions():
        try:
            interventions = Intervention.query.all()
            interventions_list = [intervention.to_dict() for intervention in interventions]
            return jsonify(interventions_list), 200
        except Exception as e:
            return jsonify({'error': 'Unable to fetch interventions', 'message': str(e)}), 500
        
    
    @app.route('/user/interventions', methods=['GET'])
    @jwt_required()
    def get_user_interventions():
        user_id = get_jwt_identity()

        try:
            # Query for intervention records that belong to the current user
            interventions = Intervention.query.filter_by(user_id=user_id).all()
            interventions_list = [intervention.to_dict() for intervention in interventions]
            return jsonify(interventions_list), 200
        except Exception as e:
            return jsonify({'error': 'Unable to fetch interventions for the user', 'message': str(e)}), 500
        
    
    
    @app.route('/redflags/<int:redflag_id>', methods=['PATCH'])
    @jwt_required()
    def update_redflag(redflag_id):
        user_id = get_jwt_identity()
        redflag = RedFlag.query.get(redflag_id)
        if not redflag:
            return jsonify({'error': 'RedFlag not found'}), 404

        data = request.get_json()
        # Update non-status fields
        if 'title' in data:
            redflag.title = data['title']
        if 'description' in data:
            redflag.description = data['description']
        if 'location' in data:
            redflag.location = data['location']
        if 'latitude' in data:
            redflag.latitude = data['latitude']
        if 'longitude' in data:
            redflag.longitude = data['longitude']
        if 'image_url' in data:
            redflag.image_url = data['image_url']

        # Capture and update the status if provided
        new_status = None
        if 'status' in data:
            new_status = data['status']
            redflag.status = new_status

        redflag.updated_at = datetime.utcnow()

        # Commit changes first
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to update red flag', 'message': str(e)}), 500

        email_message = None
        # If status changed, send the email
        if new_status:
            user = User.query.get(redflag.user_id)
            if user and user.email:
                status_email = {
                    "from": "Ireporter <change@hello.fueldash.net>",
                    "to": [user.email],
                    "subject": "Status Change Notification",
                    "html": f"<p>Your red flag status has been changed to: {new_status}</p>"
                }
                try:
                    resend.Emails.send(status_email)
                    email_message = "Email sent successfully. Please check your email."
                except Exception as e:
                    return jsonify({'error': 'Failed to send email notification', 'message': str(e)}), 500

        # Build response: if email was sent, include the message; otherwise just the updated record.
        response = redflag.to_dict()
        if email_message:
            response['email_message'] = email_message
        return jsonify(response), 200


    @app.route('/redflags/<int:redflag_id>', methods=['DELETE'])
    @jwt_required()
    def delete_redflag(redflag_id):
        user_id = get_jwt_identity()
        redflag = RedFlag.query.get(redflag_id)
        if not redflag:
            return jsonify({'error': 'RedFlag not found'}), 404
       

        try:
            db.session.delete(redflag)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to delete red flag', 'message': str(e)}), 500

        return jsonify({'message': 'Red flag deleted successfully'}), 200

    @app.route('/interventions/<int:intervention_id>', methods=['PATCH'])
    @jwt_required()
    def update_intervention(intervention_id):
        user_id = get_jwt_identity()
        intervention = Intervention.query.get(intervention_id)
        if not intervention:
            return jsonify({'error': 'Intervention not found'}), 404

        data = request.get_json()
        # Update non-status fields
        if 'title' in data:
            intervention.title = data['title']
        if 'description' in data:
            intervention.description = data['description']
        if 'location' in data:
            intervention.location = data['location']
        if 'latitude' in data:
            intervention.latitude = data['latitude']
        if 'longitude' in data:
            intervention.longitude = data['longitude']
        if 'image_url' in data:
            intervention.image_url = data['image_url']

        # Capture and update the status if provided
        new_status = None
        if 'status' in data:
            new_status = data['status']
            intervention.status = new_status

        intervention.updated_at = datetime.utcnow()

        # Commit changes first
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to update intervention', 'message': str(e)}), 500

        email_message = None
        # If status changed, send the email
        if new_status:
            user = User.query.get(intervention.user_id)
            if user and user.email:
                status_email = {
                    "from": "Ireporter <change@hello.fueldash.net>",
                    "to": [user.email],
                    "subject": "Status Change Notification",
                    "html": f"<p>Your intervention status has been changed to: {new_status}</p>"
                }
                try:
                    resend.Emails.send(status_email)
                    email_message = "Email sent successfully. Please check your email."
                except Exception as e:
                    return jsonify({'error': 'Failed to send email notification', 'message': str(e)}), 500

        # Build response: if email was sent, include the message; otherwise just the updated record.
        response = intervention.to_dict()
        if email_message:
            response['email_message'] = email_message
        return jsonify(response), 200

    @app.route('/interventions/<int:intervention_id>', methods=['DELETE'])
    @jwt_required()
    def delete_intervention(intervention_id):
        user_id = get_jwt_identity()
        intervention = Intervention.query.get(intervention_id)
        if not intervention:
            return jsonify({'error': 'Intervention not found'}), 404
        

        try:
            db.session.delete(intervention)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Failed to delete intervention', 'message': str(e)}), 500

        return jsonify({'message': 'Intervention deleted successfully'}), 200
    
    