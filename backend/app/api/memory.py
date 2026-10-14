from flask import Blueprint, request, jsonify
from app.services.memory_allocator import run_memory_allocation

memory_bp = Blueprint("memory", __name__)


@memory_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json() or {}
    initial_blocks = data.get("initial_blocks", [])
    operations = data.get("operations", [])
    algorithm = data.get("algorithm", "FIRST_FIT")
    is_fixed_partition = bool(data.get("is_fixed_partition", False))

    if not initial_blocks:
        return jsonify({"error": "Initial memory blocks configuration is required."}), 400
    if not operations:
        return jsonify({"error": "At least one allocation or deallocation operation is required."}), 400

    try:
        result = run_memory_allocation(
            initial_blocks=initial_blocks,
            operations=operations,
            algorithm=algorithm,
            is_fixed_partition=is_fixed_partition
        )
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Memory simulation error: {str(e)}"}), 500


@memory_bp.route("/compare", methods=["POST"])
def compare():
    data = request.get_json() or {}
    initial_blocks = data.get("initial_blocks", [])
    operations = data.get("operations", [])
    is_fixed_partition = bool(data.get("is_fixed_partition", False))

    if not initial_blocks or not operations:
        return jsonify({"error": "Both initial_blocks and operations are required for comparison."}), 400

    algos = ["FIRST_FIT", "BEST_FIT", "WORST_FIT"]
    results = {}
    summary = []

    for a in algos:
        try:
            res = run_memory_allocation(
                initial_blocks=initial_blocks,
                operations=operations,
                algorithm=a,
                is_fixed_partition=is_fixed_partition
            )
            results[a] = res
            summary.append({
                "algorithm": a,
                "successful_allocations": res["successful_allocations"],
                "failed_allocations": res["failed_allocations"],
                "utilization": res["final_stats"]["utilization"],
                "free_memory": res["final_stats"]["free_memory"],
                "internal_fragmentation": res["final_stats"]["internal_fragmentation"],
                "external_fragmentation": res["final_stats"]["external_fragmentation"]
            })
        except Exception as e:
            results[a] = {"error": str(e)}

    return jsonify({
        "initial_blocks": initial_blocks,
        "operations": operations,
        "results": results,
        "summary": summary
    }), 200
