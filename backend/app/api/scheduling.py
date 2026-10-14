from flask import Blueprint, request, jsonify
from app.services.cpu_scheduler import run_cpu_scheduling

scheduling_bp = Blueprint("scheduling", __name__)


@scheduling_bp.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json() or {}
    processes = data.get("processes", [])
    algorithm = data.get("algorithm", "FCFS")
    time_quantum = int(data.get("time_quantum", 2))
    aging_interval = int(data.get("aging_interval", 5))
    lower_is_higher = bool(data.get("lower_is_higher", True))
    cs_overhead = int(data.get("cs_overhead", 0))

    if not processes:
        return jsonify({"error": "Processes list is required and cannot be empty."}), 400

    try:
        result = run_cpu_scheduling(
            processes=processes,
            algorithm=algorithm,
            time_quantum=time_quantum,
            aging_interval=aging_interval,
            lower_is_higher=lower_is_higher,
            cs_overhead=cs_overhead
        )
        return jsonify(result), 200
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Internal simulation error: {str(e)}"}), 500


@scheduling_bp.route("/compare", methods=["POST"])
def compare():
    data = request.get_json() or {}
    processes = data.get("processes", [])
    algorithms = data.get("algorithms", ["FCFS", "SJF", "SRTF", "ROUND_ROBIN", "PRIORITY_NP", "PRIORITY_P"])
    time_quantum = int(data.get("time_quantum", 2))
    aging_interval = int(data.get("aging_interval", 5))
    lower_is_higher = bool(data.get("lower_is_higher", True))
    cs_overhead = int(data.get("cs_overhead", 0))

    if not processes:
        return jsonify({"error": "Processes list is required for comparison."}), 400

    results = {}
    summary = []

    for algo in algorithms:
        try:
            res = run_cpu_scheduling(
                processes=processes,
                algorithm=algo,
                time_quantum=time_quantum,
                aging_interval=aging_interval,
                lower_is_higher=lower_is_higher,
                cs_overhead=cs_overhead
            )
            results[algo] = res
            summary.append({
                "algorithm": res["algorithm"],
                "raw_algo": algo,
                "avg_waiting_time": res["avg_waiting_time"],
                "avg_turnaround_time": res["avg_turnaround_time"],
                "avg_response_time": res["avg_response_time"],
                "cpu_utilization": res["cpu_utilization"],
                "throughput": res["throughput"],
                "context_switches": res["context_switches"]
            })
        except Exception as e:
            results[algo] = {"error": str(e)}

    # Identify best metrics
    valid_summary = [s for s in summary if "avg_waiting_time" in s]
    best_metrics = {}
    if valid_summary:
        best_metrics["min_waiting_time"] = min(valid_summary, key=lambda x: x["avg_waiting_time"])["raw_algo"]
        best_metrics["min_turnaround_time"] = min(valid_summary, key=lambda x: x["avg_turnaround_time"])["raw_algo"]
        best_metrics["max_cpu_utilization"] = max(valid_summary, key=lambda x: x["cpu_utilization"])["raw_algo"]
        best_metrics["max_throughput"] = max(valid_summary, key=lambda x: x["throughput"])["raw_algo"]

    return jsonify({
        "processes": processes,
        "results": results,
        "summary": summary,
        "best_metrics": best_metrics
    }), 200
