from flask import Flask
from models import db, User, RedFlag, Intervention
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///ireporter.db'  # Change to PostgreSQL if needed
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'

# Initialize database and bcrypt
bcrypt = Bcrypt(app)
db.init_app(app)

# Seed function
def seed_data():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Create users
        user1 = User(
            first_name='John',
            last_name='Doe',
            email='john.doe@example.com',
            password_hash=bcrypt.generate_password_hash('password123').decode('utf-8'),
            is_admin=False
        )
        user2 = User(
            first_name='Jane',
            last_name='Smith',
            email='jane.smith@example.com',
            password_hash=bcrypt.generate_password_hash('password123').decode('utf-8'),
            is_admin=True
        )

        db.session.add_all([user1, user2])
        db.session.commit()

        # Create red flags
        redflag1 = RedFlag(
            title='Bribery at City Hall',
            description='Officials are demanding bribes for permits.',
            location='Nairobi, Kenya',
            user_id=user1.id
        )
        redflag2 = RedFlag(
            title='Police Corruption',
            description='Traffic officers are collecting illegal fines.',
            location='Mombasa, Kenya',
            user_id=user2.id
        )

        db.session.add_all([redflag1, redflag2])
        db.session.commit()

        # Create interventions
        intervention1 = Intervention(
            title='Fix Potholes',
            description='There are dangerous potholes on Main Street.',
            location='Nairobi, Kenya',
            user_id=user1.id
        )
        intervention2 = Intervention(
            title='Clean Up the Market',
            description='Garbage is piling up in the market area.',
            location='Kisumu, Kenya',
            user_id=user2.id
        )

        db.session.add_all([intervention1, intervention2])
        db.session.commit()

        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_data()
