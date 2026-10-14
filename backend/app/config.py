import os

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "os-lab-super-secret-key-2026-prod-grade")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "os-lab-jwt-secret-key-2026-secure")
    JWT_ACCESS_TOKEN_EXPIRES_DAYS = 7
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'os_manager.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
