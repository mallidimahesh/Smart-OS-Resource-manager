import json
from flask import Blueprint, jsonify
from app.models.experiment import Experiment
from app.api.auth import get_current_user_optional

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.route("/overview", methods=["GET"])
def get_analytics_overview():
    user = get_current_user_optional()
    query = Experiment.query
    if user:
        query = query.filter((Experiment.user_id == user.id) | (Experiment.user_id == None))
    else:
        query = query.filter(Experiment.user_id == None)

    experiments = query.order_by(Experiment.created_at.desc()).all()

    total_experiments = len(experiments)
    module_counts = {}
    algo_counts = {}

    cpu_tat_list = []
    cpu_wt_list = []
    paging_hit_ratios = []
    disk_movements = []

    for exp in experiments:
        m = exp.module
        module_counts[m] = module_counts.get(m, 0) + 1
        algo = exp.algorithm
        algo_counts[algo] = algo_counts.get(algo, 0) + 1

        met = exp.get_metrics()
        if m in ("cpu_scheduling", "cpu"):
            if "avg_turnaround_time" in met:
                cpu_tat_list.append(met["avg_turnaround_time"])
            if "avg_waiting_time" in met:
                cpu_wt_list.append(met["avg_waiting_time"])
        elif m in ("page_replacement", "paging"):
            if "hit_ratio" in met:
                paging_hit_ratios.append(met["hit_ratio"])
        elif m in ("disk_scheduling", "disk"):
            if "total_head_movement" in met:
                disk_movements.append(met["total_head_movement"])

    avg_cpu_tat = round(sum(cpu_tat_list) / len(cpu_tat_list), 2) if cpu_tat_list else 0
    avg_cpu_wt = round(sum(cpu_wt_list) / len(cpu_wt_list), 2) if cpu_wt_list else 0
    avg_hit_ratio = round(sum(paging_hit_ratios) / len(paging_hit_ratios), 2) if paging_hit_ratios else 0
    avg_disk_movement = round(sum(disk_movements) / len(disk_movements), 2) if disk_movements else 0

    recent_experiments = [e.to_dict() for e in experiments[:6]]

    return jsonify({
        "total_experiments": total_experiments,
        "module_distribution": [{"name": k, "count": v} for k, v in module_counts.items()],
        "top_algorithms": [{"name": k, "count": v} for k, v in sorted(algo_counts.items(), key=lambda x: -x[1])[:8]],
        "simulated_metrics": {
            "avg_turnaround_time": avg_cpu_tat,
            "avg_waiting_time": avg_cpu_wt,
            "avg_hit_ratio": avg_hit_ratio,
            "avg_disk_movement": avg_disk_movement
        },
        "recent_experiments": recent_experiments
    }), 200
