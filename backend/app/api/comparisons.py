import json
from flask import Blueprint, request, jsonify
from app.database import db
from app.models.experiment import SavedComparison
from app.api.auth import get_current_user_optional

comparisons_bp = Blueprint("comparisons", __name__)


@comparisons_bp.route("", methods=["POST"])
def create_comparison():
    data = request.get_json() or {}
    user = get_current_user_optional()

    title = data.get("title", "").strip() or f"Comparison on {data.get('module', 'Module')}"
    module = data.get("module", "").strip()
    comparison_data = data.get("comparison_data", {})

    if not module or not comparison_data:
        return jsonify({"error": "Module and comparison data are required."}), 400

    comp = SavedComparison(
        user_id=user.id if user else None,
        title=title,
        module=module,
        comparison_data=json.dumps(comparison_data)
    )
    db.session.add(comp)
    db.session.commit()

    return jsonify({"message": "Comparison saved successfully.", "comparison": comp.to_dict()}), 201


@comparisons_bp.route("", methods=["GET"])
def list_comparisons():
    user = get_current_user_optional()
    module = request.args.get("module")

    query = SavedComparison.query
    if user:
        query = query.filter((SavedComparison.user_id == user.id) | (SavedComparison.user_id == None))
    else:
        query = query.filter(SavedComparison.user_id == None)

    if module:
        query = query.filter_by(module=module)

    comps = query.order_by(SavedComparison.created_at.desc()).all()
    return jsonify({"comparisons": [c.to_dict() for c in comps]}), 200


@comparisons_bp.route("/<int:comp_id>", methods=["GET"])
def get_comparison(comp_id):
    user = get_current_user_optional()
    comp = SavedComparison.query.get(comp_id)
    if not comp:
        return jsonify({"error": "Comparison not found."}), 404

    if comp.user_id is not None and (not user or user.id != comp.user_id):
        return jsonify({"error": "Unauthorized access to this comparison."}), 403

    return jsonify({"comparison": comp.to_dict()}), 200


@comparisons_bp.route("/<int:comp_id>", methods=["DELETE"])
def delete_comparison(comp_id):
    user = get_current_user_optional()
    comp = SavedComparison.query.get(comp_id)
    if not comp:
        return jsonify({"error": "Comparison not found."}), 404

    if comp.user_id is not None and (not user or user.id != comp.user_id):
        return jsonify({"error": "Unauthorized to delete this comparison."}), 403

    db.session.delete(comp)
    db.session.commit()
    return jsonify({"message": "Comparison deleted."}), 200
