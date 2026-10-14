"""
CPU Scheduling Simulation Engine
Supports:
1. FCFS (First Come First Served)
2. SJF (Shortest Job First - Non-preemptive)
3. SRTF (Shortest Remaining Time First - Preemptive)
4. PRIORITY_NP (Priority - Non-preemptive)
5. PRIORITY_P (Priority - Preemptive)
6. ROUND_ROBIN (Round Robin)
7. PRIORITY_AGING (Priority with Aging - Preemptive/Dynamic)

Accurate metric accounting:
- CT: Completion Time
- TAT: Turnaround Time = CT - AT
- WT: Waiting Time = TAT - BT
- RT: Response Time = First CPU Start Time - AT
- CPU Utilization: (busy_time / total_time) * 100
- Throughput: completed_count / total_time
- Detailed event trace and timeline snapshots for step-by-step playback
"""

from typing import List, Dict, Any, Optional
import copy


def compare_priority(p1_val: int, p2_val: int, lower_is_higher: bool = True) -> int:
    """Return negative if p1 has higher priority than p2, positive if p2 is higher, 0 if equal."""
    if lower_is_higher:
        return p1_val - p2_val
    return p2_val - p1_val


def run_cpu_scheduling(
    processes: List[Dict[str, Any]],
    algorithm: str,
    time_quantum: int = 2,
    aging_interval: int = 5,
    lower_is_higher: bool = True,
    cs_overhead: int = 0
) -> Dict[str, Any]:
    """
    Execute CPU scheduling simulation.
    processes: List of dicts with:
      - pid: str or int
      - name: str (optional)
      - arrival_time: int >= 0
      - burst_time: int > 0
      - priority: int (optional, default 0)
    """
    if not processes:
        raise ValueError("Process list cannot be empty.")

    # Validate inputs
    procs = []
    for p in processes:
        pid = str(p.get("pid", ""))
        if not pid:
            raise ValueError("Every process must have a unique Process ID (pid).")
        at = int(p.get("arrival_time", 0))
        bt = int(p.get("burst_time", 0))
        prio = int(p.get("priority", 1))
        name = str(p.get("name", f"P{pid}"))
        if at < 0:
            raise ValueError(f"Arrival time for {pid} must be >= 0.")
        if bt <= 0:
            raise ValueError(f"Burst time for {pid} must be > 0.")
        procs.append({
            "pid": pid,
            "name": name,
            "arrival_time": at,
            "burst_time": bt,
            "priority": prio,
            "current_priority": prio,
            "remaining_time": bt,
            "start_time": -1,
            "completion_time": 0,
            "waiting_time": 0,
            "turnaround_time": 0,
            "response_time": 0,
            "ready_wait_time": 0,  # for aging
        })

    # Sort initially by arrival time, then pid
    procs.sort(key=lambda x: (x["arrival_time"], x["pid"]))

    algo = algorithm.upper().replace("-", "_").replace(" ", "_")

    if algo == "FCFS":
        return _simulate_fcfs(procs, cs_overhead)
    elif algo in ("SJF", "SJF_NP"):
        return _simulate_sjf(procs, cs_overhead)
    elif algo in ("SRTF", "SJF_P"):
        return _simulate_srtf(procs, cs_overhead)
    elif algo in ("PRIORITY", "PRIORITY_NP"):
        return _simulate_priority_np(procs, lower_is_higher, cs_overhead)
    elif algo in ("PRIORITY_P", "PREEMPTIVE_PRIORITY"):
        return _simulate_priority_p(procs, lower_is_higher, cs_overhead)
    elif algo in ("RR", "ROUND_ROBIN"):
        if time_quantum <= 0:
            raise ValueError("Time quantum for Round Robin must be > 0.")
        return _simulate_round_robin(procs, time_quantum, cs_overhead)
    elif algo in ("PRIORITY_AGING", "AGING"):
        if aging_interval <= 0:
            raise ValueError("Aging interval must be > 0.")
        return _simulate_priority_aging(procs, aging_interval, lower_is_higher, cs_overhead)
    else:
        raise ValueError(f"Unsupported scheduling algorithm: {algorithm}")


def _finalize_results(
    procs_map: Dict[str, Dict[str, Any]],
    gantt_chart: List[Dict[str, Any]],
    snapshots: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    algorithm_name: str,
    total_time: int,
    context_switches: int,
    cs_overhead: int
) -> Dict[str, Any]:
    procs_list = list(procs_map.values())
    n = len(procs_list)

    total_tat = 0
    total_wt = 0
    total_rt = 0
    busy_time = 0

    for g in gantt_chart:
        duration = g["end_time"] - g["start_time"]
        if not g.get("is_idle", False) and not g.get("is_cs", False):
            busy_time += duration

    for p in procs_list:
        p["turnaround_time"] = p["completion_time"] - p["arrival_time"]
        p["waiting_time"] = p["turnaround_time"] - p["burst_time"]
        p["response_time"] = p["start_time"] - p["arrival_time"]
        total_tat += p["turnaround_time"]
        total_wt += p["waiting_time"]
        total_rt += p["response_time"]

    avg_tat = round(total_tat / n, 2) if n > 0 else 0
    avg_wt = round(total_wt / n, 2) if n > 0 else 0
    avg_rt = round(total_rt / n, 2) if n > 0 else 0
    cpu_util = round((busy_time / total_time) * 100, 2) if total_time > 0 else 0
    throughput = round(n / total_time, 4) if total_time > 0 else 0

    return {
        "algorithm": algorithm_name,
        "total_time": total_time,
        "busy_time": busy_time,
        "context_switches": context_switches,
        "cpu_utilization": cpu_util,
        "throughput": throughput,
        "avg_turnaround_time": avg_tat,
        "avg_waiting_time": avg_wt,
        "avg_response_time": avg_rt,
        "processes": procs_list,
        "gantt_chart": gantt_chart,
        "snapshots": snapshots,
        "events": events
    }


def _simulate_fcfs(procs: List[Dict[str, Any]], cs_overhead: int) -> Dict[str, Any]:
    procs_map = {p["pid"]: p for p in procs}
    gantt: List[Dict[str, Any]] = []
    snapshots: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    current_time = 0
    context_switches = 0
    prev_pid = None

    # Arrival queue sorted by arrival_time, then pid
    unstarted = sorted(procs, key=lambda x: (x["arrival_time"], x["pid"]))

    for p in unstarted:
        pid = p["pid"]
        at = p["arrival_time"]
        bt = p["burst_time"]

        # If CPU is idle before arrival
        if current_time < at:
            gantt.append({
                "pid": "IDLE",
                "name": "Idle",
                "start_time": current_time,
                "end_time": at,
                "is_idle": True,
                "is_cs": False
            })
            events.append({
                "time": current_time,
                "type": "IDLE",
                "description": f"CPU idle from {current_time} to {at} waiting for process arrivals."
            })
            current_time = at

        # Context switch overhead
        if cs_overhead > 0 and prev_pid is not None and prev_pid != pid:
            context_switches += 1
            gantt.append({
                "pid": "CS",
                "name": "Context Switch",
                "start_time": current_time,
                "end_time": current_time + cs_overhead,
                "is_idle": False,
                "is_cs": True
            })
            current_time += cs_overhead

        start_t = current_time
        p["start_time"] = start_t
        end_t = start_t + bt
        current_time = end_t
        p["completion_time"] = end_t
        p["remaining_time"] = 0
        prev_pid = pid

        gantt.append({
            "pid": pid,
            "name": p["name"],
            "start_time": start_t,
            "end_time": end_t,
            "is_idle": False,
            "is_cs": False
        })
        events.append({
            "time": start_t,
            "type": "EXECUTE",
            "description": f"{p['name']} started execution at {start_t} and completed at {end_t} (FCFS policy)."
        })

    # Build step snapshots
    snapshots = _build_gantt_snapshots(gantt, procs_map, events)

    return _finalize_results(
        procs_map, gantt, snapshots, events, "First Come First Served (FCFS)",
        current_time, context_switches, cs_overhead
    )


def _simulate_sjf(procs: List[Dict[str, Any]], cs_overhead: int) -> Dict[str, Any]:
    procs_map = {p["pid"]: p for p in procs}
    gantt: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    current_time = 0
    context_switches = 0
    prev_pid = None
    completed = 0
    n = len(procs)

    while completed < n:
        # Eligible processes that have arrived and not completed
        eligible = [p for p in procs if p["arrival_time"] <= current_time and p["remaining_time"] > 0]

        if not eligible:
            # Advance to next arrival
            next_arrival = min(p["arrival_time"] for p in procs if p["remaining_time"] > 0)
            gantt.append({
                "pid": "IDLE",
                "name": "Idle",
                "start_time": current_time,
                "end_time": next_arrival,
                "is_idle": True,
                "is_cs": False
            })
            events.append({
                "time": current_time,
                "type": "IDLE",
                "description": f"CPU idle until next process arrival at {next_arrival}."
            })
            current_time = next_arrival
            continue

        # Shortest burst time, tie-break by arrival time then pid
        selected = min(eligible, key=lambda x: (x["burst_time"], x["arrival_time"], x["pid"]))
        pid = selected["pid"]

        if cs_overhead > 0 and prev_pid is not None and prev_pid != pid:
            context_switches += 1
            gantt.append({
                "pid": "CS",
                "name": "Context Switch",
                "start_time": current_time,
                "end_time": current_time + cs_overhead,
                "is_idle": False,
                "is_cs": True
            })
            current_time += cs_overhead

        start_t = current_time
        if selected["start_time"] == -1:
            selected["start_time"] = start_t
        end_t = start_t + selected["burst_time"]
        current_time = end_t
        selected["completion_time"] = end_t
        selected["remaining_time"] = 0
        completed += 1
        prev_pid = pid

        gantt.append({
            "pid": pid,
            "name": selected["name"],
            "start_time": start_t,
            "end_time": end_t,
            "is_idle": False,
            "is_cs": False
        })
        events.append({
            "time": start_t,
            "type": "EXECUTE",
            "description": f"{selected['name']} chosen (shortest burst = {selected['burst_time']}), ran from {start_t} to {end_t}."
        })

    snapshots = _build_gantt_snapshots(gantt, procs_map, events)
    return _finalize_results(
        procs_map, gantt, snapshots, events, "Shortest Job First (SJF - Non-Preemptive)",
        current_time, context_switches, cs_overhead
    )


def _simulate_srtf(procs: List[Dict[str, Any]], cs_overhead: int) -> Dict[str, Any]:
    procs_map = {p["pid"]: p for p in procs}
    gantt: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    current_time = 0
    context_switches = 0
    prev_pid = None
    completed = 0
    n = len(procs)

    current_run_pid = None
    run_start = 0

    while completed < n:
        eligible = [p for p in procs if p["arrival_time"] <= current_time and p["remaining_time"] > 0]

        if not eligible:
            # If a process was running, flush it
            if current_run_pid is not None:
                p = procs_map[current_run_pid]
                gantt.append({
                    "pid": current_run_pid,
                    "name": p["name"],
                    "start_time": run_start,
                    "end_time": current_time,
                    "is_idle": False,
                    "is_cs": False
                })
                current_run_pid = None

            next_arrival = min(p["arrival_time"] for p in procs if p["remaining_time"] > 0)
            gantt.append({
                "pid": "IDLE",
                "name": "Idle",
                "start_time": current_time,
                "end_time": next_arrival,
                "is_idle": True,
                "is_cs": False
            })
            events.append({
                "time": current_time,
                "type": "IDLE",
                "description": f"CPU idle until next process arrival at {next_arrival}."
            })
            current_time = next_arrival
            continue

        # Choose process with shortest remaining time
        selected = min(eligible, key=lambda x: (x["remaining_time"], x["arrival_time"], x["pid"]))
        pid = selected["pid"]

        # If switching process
        if pid != current_run_pid:
            if current_run_pid is not None:
                p_prev = procs_map[current_run_pid]
                gantt.append({
                    "pid": current_run_pid,
                    "name": p_prev["name"],
                    "start_time": run_start,
                    "end_time": current_time,
                    "is_idle": False,
                    "is_cs": False
                })
                events.append({
                    "time": current_time,
                    "type": "PREEMPTION",
                    "description": f"{p_prev['name']} preempted by {selected['name']} (shorter remaining time: {selected['remaining_time']} vs {p_prev['remaining_time']})."
                })

            if cs_overhead > 0 and prev_pid is not None and prev_pid != pid:
                context_switches += 1
                gantt.append({
                    "pid": "CS",
                    "name": "Context Switch",
                    "start_time": current_time,
                    "end_time": current_time + cs_overhead,
                    "is_idle": False,
                    "is_cs": True
                })
                current_time += cs_overhead

            current_run_pid = pid
            run_start = current_time
            prev_pid = pid

        if selected["start_time"] == -1:
            selected["start_time"] = current_time

        # Run 1 time unit
        selected["remaining_time"] -= 1
        current_time += 1

        if selected["remaining_time"] == 0:
            selected["completion_time"] = current_time
            completed += 1
            gantt.append({
                "pid": selected["pid"],
                "name": selected["name"],
                "start_time": run_start,
                "end_time": current_time,
                "is_idle": False,
                "is_cs": False
            })
            events.append({
                "time": current_time,
                "type": "COMPLETION",
                "description": f"{selected['name']} completed execution at time {current_time}."
            })
            current_run_pid = None

    snapshots = _build_gantt_snapshots(gantt, procs_map, events)
    return _finalize_results(
        procs_map, gantt, snapshots, events, "Shortest Remaining Time First (SRTF - Preemptive)",
        current_time, context_switches, cs_overhead
    )


def _simulate_priority_np(procs: List[Dict[str, Any]], lower_is_higher: bool, cs_overhead: int) -> Dict[str, Any]:
    procs_map = {p["pid"]: p for p in procs}
    gantt: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    current_time = 0
    context_switches = 0
    prev_pid = None
    completed = 0
    n = len(procs)

    while completed < n:
        eligible = [p for p in procs if p["arrival_time"] <= current_time and p["remaining_time"] > 0]

        if not eligible:
            next_arrival = min(p["arrival_time"] for p in procs if p["remaining_time"] > 0)
            gantt.append({
                "pid": "IDLE",
                "name": "Idle",
                "start_time": current_time,
                "end_time": next_arrival,
                "is_idle": True,
                "is_cs": False
            })
            events.append({
                "time": current_time,
                "type": "IDLE",
                "description": f"CPU idle until next arrival at {next_arrival}."
            })
            current_time = next_arrival
            continue

        # Priority selection
        if lower_is_higher:
            selected = min(eligible, key=lambda x: (x["priority"], x["arrival_time"], x["pid"]))
        else:
            selected = min(eligible, key=lambda x: (-x["priority"], x["arrival_time"], x["pid"]))

        pid = selected["pid"]

        if cs_overhead > 0 and prev_pid is not None and prev_pid != pid:
            context_switches += 1
            gantt.append({
                "pid": "CS",
                "name": "Context Switch",
                "start_time": current_time,
                "end_time": current_time + cs_overhead,
                "is_idle": False,
                "is_cs": True
            })
            current_time += cs_overhead

        start_t = current_time
        if selected["start_time"] == -1:
            selected["start_time"] = start_t
        end_t = start_t + selected["burst_time"]
        current_time = end_t
        selected["completion_time"] = end_t
        selected["remaining_time"] = 0
        completed += 1
        prev_pid = pid

        gantt.append({
            "pid": pid,
            "name": selected["name"],
            "start_time": start_t,
            "end_time": end_t,
            "is_idle": False,
            "is_cs": False
        })
        events.append({
            "time": start_t,
            "type": "EXECUTE",
            "description": f"{selected['name']} chosen with priority {selected['priority']}, ran from {start_t} to {end_t}."
        })

    snapshots = _build_gantt_snapshots(gantt, procs_map, events)
    return _finalize_results(
        procs_map, gantt, snapshots, events, "Priority Scheduling (Non-Preemptive)",
        current_time, context_switches, cs_overhead
    )


def _simulate_priority_p(procs: List[Dict[str, Any]], lower_is_higher: bool, cs_overhead: int) -> Dict[str, Any]:
    procs_map = {p["pid"]: p for p in procs}
    gantt: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    current_time = 0
    context_switches = 0
    prev_pid = None
    completed = 0
    n = len(procs)

    current_run_pid = None
    run_start = 0

    while completed < n:
        eligible = [p for p in procs if p["arrival_time"] <= current_time and p["remaining_time"] > 0]

        if not eligible:
            if current_run_pid is not None:
                p = procs_map[current_run_pid]
                gantt.append({
                    "pid": current_run_pid,
                    "name": p["name"],
                    "start_time": run_start,
                    "end_time": current_time,
                    "is_idle": False,
                    "is_cs": False
                })
                current_run_pid = None

            next_arrival = min(p["arrival_time"] for p in procs if p["remaining_time"] > 0)
            gantt.append({
                "pid": "IDLE",
                "name": "Idle",
                "start_time": current_time,
                "end_time": next_arrival,
                "is_idle": True,
                "is_cs": False
            })
            current_time = next_arrival
            continue

        if lower_is_higher:
            selected = min(eligible, key=lambda x: (x["priority"], x["arrival_time"], x["pid"]))
        else:
            selected = min(eligible, key=lambda x: (-x["priority"], x["arrival_time"], x["pid"]))

        pid = selected["pid"]

        if pid != current_run_pid:
            if current_run_pid is not None:
                p_prev = procs_map[current_run_pid]
                gantt.append({
                    "pid": current_run_pid,
                    "name": p_prev["name"],
                    "start_time": run_start,
                    "end_time": current_time,
                    "is_idle": False,
                    "is_cs": False
                })
                events.append({
                    "time": current_time,
                    "type": "PREEMPTION",
                    "description": f"{p_prev['name']} preempted by {selected['name']} with higher priority ({selected['priority']} vs {p_prev['priority']})."
                })

            if cs_overhead > 0 and prev_pid is not None and prev_pid != pid:
                context_switches += 1
                gantt.append({
                    "pid": "CS",
                    "name": "Context Switch",
                    "start_time": current_time,
                    "end_time": current_time + cs_overhead,
                    "is_idle": False,
                    "is_cs": True
                })
                current_time += cs_overhead

            current_run_pid = pid
            run_start = current_time
            prev_pid = pid

        if selected["start_time"] == -1:
            selected["start_time"] = current_time

        selected["remaining_time"] -= 1
        current_time += 1

        if selected["remaining_time"] == 0:
            selected["completion_time"] = current_time
            completed += 1
            gantt.append({
                "pid": selected["pid"],
                "name": selected["name"],
                "start_time": run_start,
                "end_time": current_time,
                "is_idle": False,
                "is_cs": False
            })
            events.append({
                "time": current_time,
                "type": "COMPLETION",
                "description": f"{selected['name']} completed execution at time {current_time}."
            })
            current_run_pid = None

    snapshots = _build_gantt_snapshots(gantt, procs_map, events)
    return _finalize_results(
        procs_map, gantt, snapshots, events, "Priority Scheduling (Preemptive)",
        current_time, context_switches, cs_overhead
    )


def _simulate_round_robin(procs: List[Dict[str, Any]], quantum: int, cs_overhead: int) -> Dict[str, Any]:
    procs_map = {p["pid"]: p for p in procs}
    gantt: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    current_time = 0
    context_switches = 0
    prev_pid = None
    completed = 0
    n = len(procs)

    # Queue of process references
    ready_queue: List[Dict[str, Any]] = []
    unstarted = sorted(procs, key=lambda x: (x["arrival_time"], x["pid"]))
    unstarted_idx = 0

    # Add any arriving at time 0
    while unstarted_idx < n and unstarted[unstarted_idx]["arrival_time"] <= current_time:
        ready_queue.append(unstarted[unstarted_idx])
        events.append({
            "time": current_time,
            "type": "ARRIVAL",
            "description": f"{unstarted[unstarted_idx]['name']} arrived and entered ready queue."
        })
        unstarted_idx += 1

    while completed < n:
        if not ready_queue:
            if unstarted_idx < n:
                next_arr = unstarted[unstarted_idx]["arrival_time"]
                gantt.append({
                    "pid": "IDLE",
                    "name": "Idle",
                    "start_time": current_time,
                    "end_time": next_arr,
                    "is_idle": True,
                    "is_cs": False
                })
                events.append({
                    "time": current_time,
                    "type": "IDLE",
                    "description": f"CPU idle until process arrives at {next_arr}."
                })
                current_time = next_arr
                while unstarted_idx < n and unstarted[unstarted_idx]["arrival_time"] <= current_time:
                    ready_queue.append(unstarted[unstarted_idx])
                    events.append({
                        "time": current_time,
                        "type": "ARRIVAL",
                        "description": f"{unstarted[unstarted_idx]['name']} arrived and entered ready queue."
                    })
                    unstarted_idx += 1
                continue
            else:
                break

        curr = ready_queue.pop(0)
        pid = curr["pid"]

        if cs_overhead > 0 and prev_pid is not None and prev_pid != pid:
            context_switches += 1
            gantt.append({
                "pid": "CS",
                "name": "Context Switch",
                "start_time": current_time,
                "end_time": current_time + cs_overhead,
                "is_idle": False,
                "is_cs": True
            })
            current_time += cs_overhead

        start_t = current_time
        if curr["start_time"] == -1:
            curr["start_time"] = start_t

        exec_time = min(curr["remaining_time"], quantum)
        end_t = start_t + exec_time
        curr["remaining_time"] -= exec_time
        current_time = end_t
        prev_pid = pid

        gantt.append({
            "pid": pid,
            "name": curr["name"],
            "start_time": start_t,
            "end_time": end_t,
            "is_idle": False,
            "is_cs": False
        })

        # Check for arrivals strictly DURING or AT end_t before requeuing curr
        while unstarted_idx < n and unstarted[unstarted_idx]["arrival_time"] <= current_time:
            ready_queue.append(unstarted[unstarted_idx])
            events.append({
                "time": unstarted[unstarted_idx]["arrival_time"],
                "type": "ARRIVAL",
                "description": f"{unstarted[unstarted_idx]['name']} arrived and entered ready queue."
            })
            unstarted_idx += 1

        if curr["remaining_time"] == 0:
            curr["completion_time"] = current_time
            completed += 1
            events.append({
                "time": current_time,
                "type": "COMPLETION",
                "description": f"{curr['name']} finished execution at time {current_time}."
            })
        else:
            ready_queue.append(curr)
            events.append({
                "time": current_time,
                "type": "TIME_QUANTUM_EXPIRED",
                "description": f"{curr['name']} slice expired ({exec_time}s used, {curr['remaining_time']}s remaining); requeued."
            })

    snapshots = _build_gantt_snapshots(gantt, procs_map, events)
    return _finalize_results(
        procs_map, gantt, snapshots, events, f"Round Robin (Quantum={quantum})",
        current_time, context_switches, cs_overhead
    )


def _simulate_priority_aging(
    procs: List[Dict[str, Any]],
    aging_interval: int,
    lower_is_higher: bool,
    cs_overhead: int
) -> Dict[str, Any]:
    """
    Priority Scheduling with Aging to demonstrate starvation prevention.
    Every `aging_interval` time units a process waits in the ready queue without running,
    its priority is boosted by 1.
    """
    procs_map = {p["pid"]: p for p in procs}
    gantt: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    current_time = 0
    context_switches = 0
    prev_pid = None
    completed = 0
    n = len(procs)

    current_run_pid = None
    run_start = 0

    while completed < n:
        eligible = [p for p in procs if p["arrival_time"] <= current_time and p["remaining_time"] > 0]

        if not eligible:
            if current_run_pid is not None:
                p = procs_map[current_run_pid]
                gantt.append({
                    "pid": current_run_pid,
                    "name": p["name"],
                    "start_time": run_start,
                    "end_time": current_time,
                    "is_idle": False,
                    "is_cs": False
                })
                current_run_pid = None

            next_arrival = min(p["arrival_time"] for p in procs if p["remaining_time"] > 0)
            gantt.append({
                "pid": "IDLE",
                "name": "Idle",
                "start_time": current_time,
                "end_time": next_arrival,
                "is_idle": True,
                "is_cs": False
            })
            current_time = next_arrival
            continue

        # Choose best effective priority
        if lower_is_higher:
            selected = min(eligible, key=lambda x: (x["current_priority"], x["arrival_time"], x["pid"]))
        else:
            selected = min(eligible, key=lambda x: (-x["current_priority"], x["arrival_time"], x["pid"]))

        pid = selected["pid"]

        if pid != current_run_pid:
            if current_run_pid is not None:
                p_prev = procs_map[current_run_pid]
                gantt.append({
                    "pid": current_run_pid,
                    "name": p_prev["name"],
                    "start_time": run_start,
                    "end_time": current_time,
                    "is_idle": False,
                    "is_cs": False
                })

            if cs_overhead > 0 and prev_pid is not None and prev_pid != pid:
                context_switches += 1
                gantt.append({
                    "pid": "CS",
                    "name": "Context Switch",
                    "start_time": current_time,
                    "end_time": current_time + cs_overhead,
                    "is_idle": False,
                    "is_cs": True
                })
                current_time += cs_overhead

            current_run_pid = pid
            run_start = current_time
            prev_pid = pid

        if selected["start_time"] == -1:
            selected["start_time"] = current_time

        selected["remaining_time"] -= 1
        current_time += 1

        # Age the other eligible processes that waited in ready queue this tick
        for p in eligible:
            if p["pid"] != pid:
                p["ready_wait_time"] += 1
                if p["ready_wait_time"] % aging_interval == 0:
                    old_prio = p["current_priority"]
                    if lower_is_higher:
                        p["current_priority"] = max(1, p["current_priority"] - 1)
                    else:
                        p["current_priority"] += 1
                    events.append({
                        "time": current_time,
                        "type": "AGING_BOOST",
                        "description": f"{p['name']} aged: waited {p['ready_wait_time']} ticks, priority boosted from {old_prio} to {p['current_priority']}."
                    })

        if selected["remaining_time"] == 0:
            selected["completion_time"] = current_time
            completed += 1
            gantt.append({
                "pid": selected["pid"],
                "name": selected["name"],
                "start_time": run_start,
                "end_time": current_time,
                "is_idle": False,
                "is_cs": False
            })
            events.append({
                "time": current_time,
                "type": "COMPLETION",
                "description": f"{selected['name']} completed execution at time {current_time}."
            })
            current_run_pid = None

    snapshots = _build_gantt_snapshots(gantt, procs_map, events)
    return _finalize_results(
        procs_map, gantt, snapshots, events, f"Priority Scheduling with Aging (Interval={aging_interval})",
        current_time, context_switches, cs_overhead
    )


def _build_gantt_snapshots(
    gantt: List[Dict[str, Any]],
    procs_map: Dict[str, Dict[str, Any]],
    events: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Build step-by-step playback snapshots from Gantt intervals."""
    snapshots = []
    if not gantt:
        return snapshots

    total_time = gantt[-1]["end_time"] if gantt else 0
    # Create key snapshots at each interval boundary and unit steps
    for idx, interval in enumerate(gantt):
        t = interval["start_time"]
        snapshots.append({
            "step": idx,
            "time": t,
            "current_interval": interval,
            "running_pid": interval["pid"] if not interval["is_idle"] and not interval["is_cs"] else None,
            "running_name": interval["name"],
            "is_idle": interval["is_idle"],
            "is_cs": interval["is_cs"],
            "gantt_slice": gantt[: idx + 1]
        })

    # Final completion snapshot
    snapshots.append({
        "step": len(gantt),
        "time": total_time,
        "current_interval": None,
        "running_pid": None,
        "running_name": "Completed",
        "is_idle": False,
        "is_cs": False,
        "gantt_slice": gantt
    })

    return snapshots
