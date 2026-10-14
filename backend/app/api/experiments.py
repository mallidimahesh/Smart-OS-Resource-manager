import json
from flask import Blueprint, request, jsonify
from app.database import db
from app.models.experiment import Experiment
from app.api.auth import get_current_user_optional, login_required

experiments_bp = Blueprint("experiments", __name__)


@experiments_bp.route("", methods=["POST"])
def create_experiment():
    data = request.get_json() or {}
    user = get_current_user_optional()

    title = data.get("title", "").strip() or f"Experiment on {data.get('algorithm', 'Algorithm')}"
    module = data.get("module", "").strip()
    algorithm = data.get("algorithm", "").strip()
    input_data = data.get("input_data", {})
    result_data = data.get("result_data", {})
    metrics = data.get("metrics", {})

    if not module or not algorithm:
        return jsonify({"error": "Module and algorithm are required fields."}), 400

    exp = Experiment(
        user_id=user.id if user else None,
        title=title,
        module=module,
        algorithm=algorithm,
        input_data=json.dumps(input_data),
        result_data=json.dumps(result_data),
        metrics=json.dumps(metrics)
    )
    db.session.add(exp)
    db.session.commit()

    return jsonify({"message": "Experiment saved successfully.", "experiment": exp.to_dict()}), 201


@experiments_bp.route("", methods=["GET"])
def list_experiments():
    user = get_current_user_optional()
    module = request.args.get("module")
    search = request.args.get("search")

    query = Experiment.query

    if user:
        # Show experiments owned by this user or guest experiments
        query = query.filter((Experiment.user_id == user.id) | (Experiment.user_id == None))
    else:
        # Show guest experiments
        query = query.filter(Experiment.user_id == None)

    if module:
        query = query.filter_by(module=module)

    if search:
        query = query.filter(Experiment.title.ilike(f"%{search}%"))

    experiments = query.order_by(Experiment.created_at.desc()).all()
    return jsonify({"experiments": [e.to_dict() for e in experiments]}), 200


@experiments_bp.route("/<int:exp_id>", methods=["GET"])
def get_experiment(exp_id):
    user = get_current_user_optional()
    exp = db.session.get(Experiment, exp_id)
    if not exp:
        return jsonify({"error": "Experiment not found."}), 404

    # Authorization check: if user_id is set and user doesn't match
    if exp.user_id is not None:
        if not user or user.id != exp.user_id:
            return jsonify({"error": "Unauthorized access to this experiment."}), 403

    return jsonify({"experiment": exp.to_dict()}), 200


@experiments_bp.route("/<int:exp_id>", methods=["PUT"])
def update_experiment(exp_id):
    user = get_current_user_optional()
    exp = db.session.get(Experiment, exp_id)
    if not exp:
        return jsonify({"error": "Experiment not found."}), 404

    if exp.user_id is not None and (not user or user.id != exp.user_id):
        return jsonify({"error": "Unauthorized to update this experiment."}), 403

    data = request.get_json() or {}
    if "title" in data and data["title"].strip():
        exp.title = data["title"].strip()
    if "input_data" in data:
        exp.input_data = json.dumps(data["input_data"])
    if "result_data" in data:
        exp.result_data = json.dumps(data["result_data"])
    if "metrics" in data:
        exp.metrics = json.dumps(data["metrics"])

    db.session.commit()
    return jsonify({"message": "Experiment updated.", "experiment": exp.to_dict()}), 200


@experiments_bp.route("/<int:exp_id>", methods=["DELETE"])
def delete_experiment(exp_id):
    user = get_current_user_optional()
    exp = db.session.get(Experiment, exp_id)
    if not exp:
        return jsonify({"error": "Experiment not found."}), 404

    if exp.user_id is not None and (not user or user.id != exp.user_id):
        return jsonify({"error": "Unauthorized to delete this experiment."}), 403

    db.session.delete(exp)
    db.session.commit()
    return jsonify({"message": "Experiment deleted successfully."}), 200


@experiments_bp.route("/<int:exp_id>/duplicate", methods=["POST"])
def duplicate_experiment(exp_id):
    user = get_current_user_optional()
    exp = db.session.get(Experiment, exp_id)
    if not exp:
        return jsonify({"error": "Experiment not found."}), 404

    new_exp = Experiment(
        user_id=user.id if user else None,
        title=f"Copy of {exp.title}",
        module=exp.module,
        algorithm=exp.algorithm,
        input_data=exp.input_data,
        result_data=exp.result_data,
        metrics=exp.metrics
    )
    db.session.add(new_exp)
    db.session.commit()
    return jsonify({"message": "Experiment duplicated.", "experiment": new_exp.to_dict()}), 201
