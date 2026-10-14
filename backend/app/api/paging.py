from flask import Blueprint, request, jsonify
from app.services.page_replacer import (
    run_page_replacement,
    compare_page_replacements,
    run_belady_anomaly_demo
)

paging_bp = Blueprint("paging", __name__)


@paging_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json() or {}
    reference_string = data.get("reference_string", [])
    num_frames = int(data.get("num_frames", 3))
    algorithm = data.get("algorithm", "FIFO")

    if not reference_string:
        return jsonify({"error": "Reference string is required."}), 400

    try:
        result = run_page_replacement(
            reference_string=reference_string,
            num_frames=num_frames,
            algorithm=algorithm
        )
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Paging simulation error: {str(e)}"}), 500


@paging_bp.route("/compare", methods=["POST"])
def compare():
    data = request.get_json() or {}
    reference_string = data.get("reference_string", [])
    num_frames = int(data.get("num_frames", 3))

    if not reference_string:
        return jsonify({"error": "Reference string is required for comparison."}), 400

    try:
        result = compare_page_replacements(
            reference_string=reference_string,
            num_frames=num_frames
        )
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Comparison error: {str(e)}"}), 500


@paging_bp.route("/belady", methods=["GET", "POST"])
def belady_demo():
    if request.method == "POST":
        data = request.get_json() or {}
        custom_ref = data.get("reference_string")
        frames_range = data.get("frames_range")
    else:
        custom_ref = None
        frames_range = None

    result = run_belady_anomaly_demo(custom_ref, frames_range)
    return jsonify(result), 200
