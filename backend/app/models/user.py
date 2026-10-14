import datetime
import json
from werkzeug.security import generate_password_hash, check_password_hash
from app.database import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    theme = db.Column(db.String(20), default="dark")
    settings = db.Column(db.Text, default="{}")
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    # Relationships
    experiments = db.relationship("Experiment", backref="owner", lazy=True, cascade="all, delete-orphan")
    comparisons = db.relationship("SavedComparison", backref="owner", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def get_settings(self):
        try:
            return json.loads(self.settings or "{}")
        except Exception:
            return {}

    def set_settings(self, settings_dict):
        self.settings = json.dumps(settings_dict)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "theme": self.theme,
            "settings": self.get_settings(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
