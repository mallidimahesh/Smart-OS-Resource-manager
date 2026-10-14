import datetime
import functools
import jwt
from flask import Blueprint, request, jsonify, current_app
from app.database import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


def generate_token(user_id: int) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "user_id": user_id,
        "exp": now + datetime.timedelta(days=7),
        "iat": now
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])


def get_current_user_optional():
    """Extract user if valid token present, else return None."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        user_id = payload.get("user_id")
        return db.session.get(User, user_id)
    except Exception:
        return None


def login_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authentication token missing or invalid."}), 401
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
            user_id = payload.get("user_id")
            user = db.session.get(User, user_id)
            if not user:
                return jsonify({"error": "User no longer exists."}), 401
            request.current_user = user
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session token has expired. Please log in again."}), 401
        except Exception:
            return jsonify({"error": "Invalid authentication token."}), 401

        return f(*args, **kwargs)
    return decorated_function


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters long."}), 400
    if not email or "@" not in email:
        return jsonify({"error": "Valid email address is required."}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username is already taken."}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email is already registered."}), 409

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    token = generate_token(new_user.id)
    return jsonify({
        "message": "User registered successfully.",
        "token": token,
        "user": new_user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    identifier = data.get("username", "").strip()  # can be username or email
    password = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Username/email and password are required."}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier.lower())
    ).first()

    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid username or password."}), 401

    token = generate_token(user.id)
    return jsonify({
        "message": "Logged in successfully.",
        "token": token,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_me():
    return jsonify({"user": request.current_user.to_dict()}), 200


@auth_bp.route("/settings", methods=["PUT"])
@login_required
def update_settings():
    data = request.get_json() or {}
    user = request.current_user

    if "theme" in data and data["theme"] in ("dark", "light"):
        user.theme = data["theme"]

    if "settings" in data and isinstance(data["settings"], dict):
        user.set_settings(data["settings"])

    db.session.commit()
    return jsonify({
        "message": "Settings updated.",
        "user": user.to_dict()
    }), 200
