from flask import Blueprint, request, jsonify
from app.services.disk_scheduler import run_disk_scheduling, compare_disk_scheduling

disk_bp = Blueprint("disk", __name__)


@disk_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json() or {}
    requests = data.get("requests", [])
    initial_head = int(data.get("initial_head", 50))
    disk_size = int(data.get("disk_size", 200))
    direction = data.get("direction", "UP")
    algorithm = data.get("algorithm", "FCFS")
    include_jump = bool(data.get("include_jump", True))

    if not requests:
        return jsonify({"error": "Requests list is required."}), 400

    try:
        res = run_disk_scheduling(
            requests=requests,
            initial_head=initial_head,
            disk_size=disk_size,
            direction=direction,
            algorithm=algorithm,
            include_jump_in_movement=include_jump
        )
        return jsonify(res), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Disk simulation error: {str(e)}"}), 500


@disk_bp.route("/compare", methods=["POST"])
def compare():
    data = request.get_json() or {}
    requests = data.get("requests", [])
    initial_head = int(data.get("initial_head", 50))
    disk_size = int(data.get("disk_size", 200))
    direction = data.get("direction", "UP")
    include_jump = bool(data.get("include_jump", True))

    if not requests:
        return jsonify({"error": "Requests list is required for comparison."}), 400

    try:
        res = compare_disk_scheduling(
            requests=requests,
            initial_head=initial_head,
            disk_size=disk_size,
            direction=direction,
            include_jump_in_movement=include_jump
        )
        return jsonify(res), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Disk comparison error: {str(e)}"}), 500
