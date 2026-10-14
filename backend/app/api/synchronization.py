from flask import Blueprint, request, jsonify
from app.services.synchronizer import (
    simulate_producer_consumer,
    simulate_readers_writers,
    simulate_dining_philosophers
)

synchronization_bp = Blueprint("synchronization", __name__)


@synchronization_bp.route("/producer-consumer", methods=["POST"])
def producer_consumer():
    data = request.get_json() or {}
    capacity = int(data.get("capacity", 5))
    operations = data.get("operations")
    mode = data.get("mode", "SAFE")

    try:
        res = simulate_producer_consumer(capacity, operations, mode)
        return jsonify(res), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Synchronization simulation error: {str(e)}"}), 500


@synchronization_bp.route("/readers-writers", methods=["POST"])
def readers_writers():
    data = request.get_json() or {}
    operations = data.get("operations")
    priority_policy = data.get("priority_policy", "READER_PREFERENCE")

    try:
        res = simulate_readers_writers(operations, priority_policy)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": f"Readers-writers error: {str(e)}"}), 500


@synchronization_bp.route("/dining-philosophers", methods=["POST"])
def dining_philosophers():
    data = request.get_json() or {}
    strategy = data.get("strategy", "ASYMMETRIC")

    try:
        res = simulate_dining_philosophers(strategy)
        return jsonify(res), 200
    except Exception as e:
        return jsonify({"error": f"Dining philosophers error: {str(e)}"}), 500
