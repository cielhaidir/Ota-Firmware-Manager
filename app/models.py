from werkzeug.security import generate_password_hash, check_password_hash
from app import db  # Import the db object from the app's __init__.py
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    is_account_active = db.Column(db.Boolean, default=True)

    def set_password(self, password):
        self.password = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def is_active(self):
        return self.is_account_active

    def is_authenticated(self):
        # Check if the user is authenticated
        return True  # You can customize this based on your authentication logic


    def get_id(self):
        return str(self.id)
    
class ChangeLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    node_name = db.Column(db.Text, nullable=False)
    version = db.Column(db.String(20), nullable=False)
    change_log = db.Column(db.Text, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow())

    def __repr__(self):
        return f"ChangeLog(id={self.id}, version={self.version}, date={self.date})"

