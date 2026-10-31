from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.database import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    from app.api.auth import auth_bp
    from app.api.scheduling import scheduling_bp
    from app.api.memory import memory_bp
    from app.api.paging import paging_bp
    from app.api.deadlock import deadlock_bp
    from app.api.synchronization import synchronization_bp
    from app.api.disk import disk_bp
    from app.api.experiments import experiments_bp
    from app.api.comparisons import comparisons_bp
    from app.api.analytics import analytics_bp
    from app.api.tutor import tutor_bp
    from app.api.exports import exports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(scheduling_bp, url_prefix="/api/scheduling")
    app.register_blueprint(memory_bp, url_prefix="/api/memory")
    app.register_blueprint(paging_bp, url_prefix="/api/paging")
    app.register_blueprint(deadlock_bp, url_prefix="/api/deadlock")
    app.register_blueprint(synchronization_bp, url_prefix="/api/synchronization")
    app.register_blueprint(disk_bp, url_prefix="/api/disk")
    app.register_blueprint(experiments_bp, url_prefix="/api/experiments")
    app.register_blueprint(comparisons_bp, url_prefix="/api/comparisons")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(tutor_bp, url_prefix="/api/tutor")
    app.register_blueprint(exports_bp, url_prefix="/api/exports")

    with app.app_context():
        # Import models so SQLAlchemy registers them
        from app.models import user, experiment
        db.create_all()

        # Ensure demo user exists
        try:
            from app.models.user import User
            student = User.query.filter_by(username="os_scholar").first()
            if not student:
                student = User(username="os_scholar", email="scholar@os-lab.edu", theme="dark")
                student.set_password("os_scholar_2026")
                db.session.add(student)
                db.session.commit()
        except Exception:
            db.session.rollback()

    return app
