import datetime
import json
from app.database import db


class Experiment(db.Model):
    __tablename__ = "experiments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    module = db.Column(db.String(50), nullable=False, index=True)  # cpu_scheduling, memory, paging, deadlock, synchronization, disk
    algorithm = db.Column(db.String(50), nullable=False)
    input_data = db.Column(db.Text, nullable=False, default="{}")
    result_data = db.Column(db.Text, nullable=False, default="{}")
    metrics = db.Column(db.Text, nullable=False, default="{}")
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def get_input(self):
        try:
            return json.loads(self.input_data or "{}")
        except Exception:
            return {}

    def get_result(self):
        try:
            return json.loads(self.result_data or "{}")
        except Exception:
            return {}

    def get_metrics(self):
        try:
            return json.loads(self.metrics or "{}")
        except Exception:
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "module": self.module,
            "algorithm": self.algorithm,
            "input_data": self.get_input(),
            "result_data": self.get_result(),
            "metrics": self.get_metrics(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class SavedComparison(db.Model):
    __tablename__ = "saved_comparisons"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = db.Column(db.String(150), nullable=False)
    module = db.Column(db.String(50), nullable=False)
    comparison_data = db.Column(db.Text, nullable=False, default="{}")
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def get_data(self):
        try:
            return json.loads(self.comparison_data or "{}")
        except Exception:
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "module": self.module,
            "comparison_data": self.get_data(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    score_percentage = db.Column(db.Float, nullable=False)
    correct_count = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    details = db.Column(db.Text, default="{}")
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        try:
            det = json.loads(self.details or "{}")
        except Exception:
            det = {}
        return {
            "id": self.id,
            "user_id": self.user_id,
            "score_percentage": self.score_percentage,
            "correct_count": self.correct_count,
            "total_questions": self.total_questions,
            "details": det,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
