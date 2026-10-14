from flask import Blueprint, request, jsonify
from app.services.banker_deadlock import (
    validate_and_compute_matrices,
    run_bankers_safety,
    simulate_resource_request,
    run_deadlock_detection,
    build_resource_allocation_graph
)

deadlock_bp = Blueprint("deadlock", __name__)


@deadlock_bp.route("/validate", methods=["POST"])
def validate():
    data = request.get_json() or {}
    processes = data.get("processes", [])
    resources = data.get("resources", [])
    total_resources = data.get("total_resources", [])
    allocation = data.get("allocation", [])
    max_demand = data.get("max_demand", [])

    try:
        res = validate_and_compute_matrices(
            processes, resources, total_resources, allocation, max_demand
        )
        return jsonify(res), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Matrix validation error: {str(e)}"}), 500


@deadlock_bp.route("/safety", methods=["POST"])
def safety():
    data = request.get_json() or {}
    processes = data.get("processes", [])
    resources = data.get("resources", [])
    available = data.get("available", [])
    allocation = data.get("allocation", [])
    need = data.get("need", [])

    if not processes or not resources or not available or not allocation or not need:
        return jsonify({"error": "Missing required matrix or vector inputs for safety check."}), 400

    try:
        res = run_bankers_safety(processes, resources, available, allocation, need)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": f"Safety check error: {str(e)}"}), 500


@deadlock_bp.route("/request", methods=["POST"])
def resource_request():
    data = request.get_json() or {}
    processes = data.get("processes", [])
    resources = data.get("resources", [])
    available = data.get("available", [])
    allocation = data.get("allocation", [])
    need = data.get("need", [])
    requesting_process_idx = int(data.get("requesting_process_idx", 0))
    request_vector = data.get("request", [])

    try:
        res = simulate_resource_request(
            processes, resources, available, allocation, need,
            requesting_process_idx, request_vector
        )
        return jsonify(res), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Resource request error: {str(e)}"}), 500


@deadlock_bp.route("/detect", methods=["POST"])
def detect_deadlock():
    data = request.get_json() or {}
    processes = data.get("processes", [])
    resources = data.get("resources", [])
    available = data.get("available", [])
    allocation = data.get("allocation", [])
    request_matrix = data.get("request_matrix", [])

    if not processes or not resources or not allocation or not request_matrix:
        return jsonify({"error": "Missing inputs for deadlock detection."}), 400

    try:
        res = run_deadlock_detection(processes, resources, available, allocation, request_matrix)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": f"Deadlock detection error: {str(e)}"}), 500


@deadlock_bp.route("/rag", methods=["POST"])
def rag_graph():
    data = request.get_json() or {}
    processes = data.get("processes", [])
    resources = data.get("resources", [])
    total_resources = data.get("total_resources", [])
    allocation = data.get("allocation", [])
    request_or_need = data.get("request_or_need", [])

    try:
        res = build_resource_allocation_graph(
            processes, resources, total_resources, allocation, request_or_need
        )
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": f"RAG graph error: {str(e)}"}), 500
