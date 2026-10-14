from flask import Blueprint, request, Response, jsonify
from app.services.export_service import (
    generate_cpu_scheduling_csv,
    generate_memory_csv,
    generate_paging_csv,
    generate_disk_csv
)

exports_bp = Blueprint("exports", __name__)


@exports_bp.route("/csv", methods=["POST"])
def export_csv():
    data = request.get_json() or {}
    module = data.get("module", "").lower()
    result = data.get("result", {})

    if not result:
        return jsonify({"error": "Simulation result is required for export."}), 400

    csv_data = ""
    filename = f"{module}_simulation_export.csv"

    if module in ("cpu_scheduling", "cpu"):
        csv_data = generate_cpu_scheduling_csv(result)
    elif module in ("memory_allocation", "memory"):
        csv_data = generate_memory_csv(result)
    elif module in ("page_replacement", "paging"):
        csv_data = generate_paging_csv(result)
    elif module in ("disk_scheduling", "disk"):
        csv_data = generate_disk_csv(result)
    else:
        return jsonify({"error": f"CSV export for module '{module}' is not supported."}), 400

    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )
