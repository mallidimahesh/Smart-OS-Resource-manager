"""
Export and Report Service
Generates structured CSV files and printable report documents from actual simulation results.
"""

import io
import csv
from typing import Dict, Any, List


def generate_cpu_scheduling_csv(result: Dict[str, Any]) -> str:
    """Generate CSV string for CPU scheduling results."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== CPU SCHEDULING SIMULATION REPORT ==="])
    writer.writerow(["Algorithm", result.get("algorithm")])
    writer.writerow(["Total Time", result.get("total_time")])
    writer.writerow(["Busy Time", result.get("busy_time")])
    writer.writerow(["CPU Utilization (%)", result.get("cpu_utilization")])
    writer.writerow(["Throughput", result.get("throughput")])
    writer.writerow(["Average Waiting Time", result.get("avg_waiting_time")])
    writer.writerow(["Average Turnaround Time", result.get("avg_turnaround_time")])
    writer.writerow(["Average Response Time", result.get("avg_response_time")])
    writer.writerow(["Context Switches", result.get("context_switches")])
    writer.writerow([])

    writer.writerow(["PID", "Name", "Arrival Time", "Burst Time", "Priority", "Start Time", "Completion Time", "Turnaround Time", "Waiting Time", "Response Time"])
    for p in result.get("processes", []):
        writer.writerow([
            p.get("pid"), p.get("name"), p.get("arrival_time"), p.get("burst_time"),
            p.get("priority"), p.get("start_time"), p.get("completion_time"),
            p.get("turnaround_time"), p.get("waiting_time"), p.get("response_time")
        ])

    writer.writerow([])
    writer.writerow(["Gantt Chart Intervals"])
    writer.writerow(["PID", "Name", "Start Time", "End Time", "Type"])
    for g in result.get("gantt_chart", []):
        gtype = "Context Switch" if g.get("is_cs") else ("Idle" if g.get("is_idle") else "Process")
        writer.writerow([g.get("pid"), g.get("name"), g.get("start_time"), g.get("end_time"), gtype])

    return output.getvalue()


def generate_memory_csv(result: Dict[str, Any]) -> str:
    """Generate CSV string for Memory Allocation results."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== MEMORY ALLOCATION SIMULATION REPORT ==="])
    writer.writerow(["Algorithm", result.get("algorithm")])
    writer.writerow(["Successful Allocations", result.get("successful_allocations")])
    writer.writerow(["Failed Allocations", result.get("failed_allocations")])
    stats = result.get("final_stats", {})
    writer.writerow(["Total Memory (KB)", stats.get("total_memory")])
    writer.writerow(["Allocated Memory (KB)", stats.get("allocated_memory")])
    writer.writerow(["Free Memory (KB)", stats.get("free_memory")])
    writer.writerow(["Utilization (%)", stats.get("utilization")])
    writer.writerow(["Internal Fragmentation (KB)", stats.get("internal_fragmentation")])
    writer.writerow(["External Fragmentation (KB)", stats.get("external_fragmentation")])
    writer.writerow([])

    writer.writerow(["Step-by-step Log"])
    writer.writerow(["Step", "PID", "Event Type", "Details"])
    for log in result.get("logs", []):
        writer.writerow([log.get("step"), log.get("pid"), log.get("type"), log.get("text")])

    writer.writerow([])
    writer.writerow(["Final Memory Blocks Layout"])
    writer.writerow(["Block ID", "Start Address", "Size (KB)", "Status", "Allocated PID", "Internal Frag (KB)"])
    for b in result.get("final_blocks", []):
        writer.writerow([
            b.get("block_id"), b.get("start"), b.get("size"),
            "FREE" if b.get("is_free") else "ALLOCATED",
            b.get("pid") or "N/A", b.get("internal_fragmentation", 0)
        ])

    return output.getvalue()


def generate_paging_csv(result: Dict[str, Any]) -> str:
    """Generate CSV string for Page Replacement results."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== VIRTUAL MEMORY PAGE REPLACEMENT REPORT ==="])
    writer.writerow(["Algorithm", result.get("algorithm")])
    writer.writerow(["Number of Frames", result.get("num_frames")])
    writer.writerow(["Total References", result.get("total_references")])
    writer.writerow(["Page Faults", result.get("page_faults")])
    writer.writerow(["Page Hits", result.get("page_hits")])
    writer.writerow(["Hit Ratio (%)", result.get("hit_ratio")])
    writer.writerow(["Fault Rate (%)", result.get("fault_rate")])
    writer.writerow([])

    writer.writerow(["Step", "Referenced Page", "Hit/Fault", "Replaced Page", "Target Frame", "Cumulative Faults", "Hit Ratio (%)", "Decision Reason"])
    for s in result.get("steps", []):
        writer.writerow([
            s.get("step"), s.get("page"), "HIT" if s.get("is_hit") else "FAULT",
            s.get("replaced_page") if s.get("replaced_page") is not None else "None",
            s.get("target_frame"), s.get("fault_count"), s.get("hit_ratio"), s.get("reason")
        ])

    return output.getvalue()


def generate_disk_csv(result: Dict[str, Any]) -> str:
    """Generate CSV string for Disk Scheduling results."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["=== DISK SCHEDULING SIMULATION REPORT ==="])
    writer.writerow(["Algorithm", result.get("algorithm")])
    writer.writerow(["Initial Head Position", result.get("initial_head")])
    writer.writerow(["Disk Size (Cylinders)", result.get("disk_size")])
    writer.writerow(["Direction", result.get("direction")])
    writer.writerow(["Total Head Movement", result.get("total_head_movement")])
    writer.writerow(["Average Head Movement", result.get("average_head_movement")])
    writer.writerow([])

    writer.writerow(["Step", "From Cylinder", "To Cylinder", "Seek Distance", "Cumulative Distance", "Serviced Request", "Explanation"])
    for s in result.get("steps", []):
        writer.writerow([
            s.get("step"), s.get("from_track"), s.get("to_track"),
            s.get("distance"), s.get("total_distance"),
            "YES" if s.get("serviced") else "NO (Boundary)", s.get("explanation")
        ])

    return output.getvalue()
