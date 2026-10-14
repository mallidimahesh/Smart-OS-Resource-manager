"""
Deadlock Detection & Banker's Algorithm Simulation Engine
Features:
1. Matrix validation and Need matrix calculation
2. Banker's Safety Algorithm with step-by-step Work updates and safe sequence
3. Resource-Request Simulation with safety check and automatic rollback
4. Deadlock Detection Algorithm (distinct from avoidance) using Request matrix
5. Resource Allocation Graph (RAG) structure generation for visualization
"""

from typing import List, Dict, Any, Optional, Tuple
import copy


def validate_and_compute_matrices(
    processes: List[str],
    resources: List[str],
    total_resources: List[int],
    allocation: List[List[int]],
    max_demand: List[List[int]]
) -> Dict[str, Any]:
    """Validate matrices and calculate Available vector and Need matrix."""
    n = len(processes)
    m = len(resources)

    if n == 0 or m == 0:
        raise ValueError("Must define at least one process and one resource type.")

    if len(total_resources) != m:
        raise ValueError(f"Total resources vector must have length {m}, got {len(total_resources)}.")

    for idx, r_val in enumerate(total_resources):
        if r_val < 0:
            raise ValueError(f"Total resource instance for {resources[idx]} cannot be negative.")

    if len(allocation) != n or any(len(row) != m for row in allocation):
        raise ValueError(f"Allocation matrix must be {n}x{m}.")

    if len(max_demand) != n or any(len(row) != m for row in max_demand):
        raise ValueError(f"Max matrix must be {n}x{m}.")

    # Calculate Need matrix = Max - Allocation
    need: List[List[int]] = []
    allocated_sum = [0] * m

    for i in range(n):
        need_row = []
        for j in range(m):
            alloc_val = int(allocation[i][j])
            max_val = int(max_demand[i][j])
            if alloc_val < 0 or max_val < 0:
                raise ValueError(f"Matrix values must be non-negative at P{i}, R{j}.")
            if alloc_val > max_val:
                raise ValueError(
                    f"Allocation exceeds Max demand for Process {processes[i]} on Resource {resources[j]} ({alloc_val} > {max_val})."
                )
            need_row.append(max_val - alloc_val)
            allocated_sum[j] += alloc_val
        need.append(need_row)

    # Calculate Available vector = Total - Sum(Allocated)
    available = []
    for j in range(m):
        avail_val = total_resources[j] - allocated_sum[j]
        if avail_val < 0:
            raise ValueError(
                f"Total allocated instances of {resources[j]} ({allocated_sum[j]}) exceeds total capacity ({total_resources[j]})."
            )
        available.append(avail_val)

    return {
        "processes": processes,
        "resources": resources,
        "total_resources": total_resources,
        "allocation": allocation,
        "max_demand": max_demand,
        "need": need,
        "available": available
    }


def run_bankers_safety(
    processes: List[str],
    resources: List[str],
    available: List[int],
    allocation: List[List[int]],
    need: List[List[int]]
) -> Dict[str, Any]:
    """Execute Banker's Safety Algorithm step-by-step."""
    n = len(processes)
    m = len(resources)

    work = list(available)
    finish = [False] * n
    safe_sequence: List[str] = []
    steps: List[Dict[str, Any]] = []

    # Initial state snapshot
    steps.append({
        "step": 0,
        "action": "INIT",
        "work": list(work),
        "finish": list(finish),
        "selected_process": None,
        "safe_sequence": [],
        "explanation": f"Initial state: Work initialized to Available {work}."
    })

    while len(safe_sequence) < n:
        found = False
        candidates = []

        for i in range(n):
            if not finish[i]:
                # Check if Need[i] <= Work
                can_satisfy = all(need[i][j] <= work[j] for j in range(m))
                candidates.append({
                    "process": processes[i],
                    "need": need[i],
                    "can_satisfy": can_satisfy
                })
                if can_satisfy and not found:
                    found = True
                    chosen_idx = i

        if not found:
            # System is in an UNSAFE state
            blocked_procs = [processes[i] for i in range(n) if not finish[i]]
            explanation = (
                f"UNSAFE STATE DETECTED! No remaining process can satisfy its need with available Work {work}. "
                f"Processes that cannot proceed: {', '.join(blocked_procs)}."
            )
            return {
                "is_safe": False,
                "safe_sequence": safe_sequence,
                "steps": steps,
                "final_work": work,
                "blocked_processes": blocked_procs,
                "explanation": explanation
            }

        # Process chosen_idx can finish
        proc_name = processes[chosen_idx]
        finish[chosen_idx] = True
        safe_sequence.append(proc_name)

        old_work = list(work)
        for j in range(m):
            work[j] += allocation[chosen_idx][j]

        step_num = len(safe_sequence)
        explanation = (
            f"Step {step_num}: Process {proc_name} selected because Need {need[chosen_idx]} <= Work {old_work}. "
            f"Simulating completion: {proc_name} finishes and releases Allocation {allocation[chosen_idx]}. "
            f"New Work vector = {work}."
        )

        steps.append({
            "step": step_num,
            "action": "PROCESS_FINISH",
            "work": list(work),
            "finish": list(finish),
            "selected_process": proc_name,
            "process_need": need[chosen_idx],
            "process_alloc": allocation[chosen_idx],
            "safe_sequence": list(safe_sequence),
            "candidates_evaluated": candidates,
            "explanation": explanation
        })

    return {
        "is_safe": True,
        "safe_sequence": safe_sequence,
        "steps": steps,
        "final_work": work,
        "blocked_processes": [],
        "explanation": f"SAFE STATE: System is in a safe state. A valid safe sequence is: {' -> '.join(safe_sequence)}."
    }


def simulate_resource_request(
    processes: List[str],
    resources: List[str],
    available: List[int],
    allocation: List[List[int]],
    need: List[List[int]],
    requesting_process_idx: int,
    request: List[int]
) -> Dict[str, Any]:
    """
    Simulate resource request from requesting_process_idx.
    Step 1: check request <= need
    Step 2: check request <= available
    Step 3: tentative allocation and safety check
    Step 4: grant or reject (with state rollback)
    """
    n = len(processes)
    m = len(resources)

    if requesting_process_idx < 0 or requesting_process_idx >= n:
        raise ValueError(f"Invalid requesting process index: {requesting_process_idx}")

    proc_name = processes[requesting_process_idx]

    if len(request) != m:
        raise ValueError(f"Request vector size ({len(request)}) does not match resource count ({m}).")

    # Step 1: Request <= Need
    for j in range(m):
        if request[j] > need[requesting_process_idx][j]:
            return {
                "granted": False,
                "reason": "ERROR_EXCEEDED_MAX_CLAIM",
                "message": (
                    f"Request REJECTED: Process {proc_name} requested {request[j]} instances of {resources[j]}, "
                    f"which exceeds its declared remaining need of {need[requesting_process_idx][j]}."
                ),
                "is_safe": False,
                "tentative_safety": None
            }

    # Step 2: Request <= Available
    for j in range(m):
        if request[j] > available[j]:
            return {
                "granted": False,
                "reason": "WAIT_INSUFFICIENT_RESOURCES",
                "message": (
                    f"Request BLOCKED: Process {proc_name} must wait. Requested {request[j]} instances of {resources[j]}, "
                    f"but only {available[j]} instances are currently available."
                ),
                "is_safe": False,
                "tentative_safety": None
            }

    # Step 3: Tentatively allocate
    tentative_avail = list(available)
    tentative_alloc = copy.deepcopy(allocation)
    tentative_need = copy.deepcopy(need)

    for j in range(m):
        tentative_avail[j] -= request[j]
        tentative_alloc[requesting_process_idx][j] += request[j]
        tentative_need[requesting_process_idx][j] -= request[j]

    safety_result = run_bankers_safety(
        processes, resources, tentative_avail, tentative_alloc, tentative_need
    )

    if safety_result["is_safe"]:
        return {
            "granted": True,
            "reason": "SAFE_STATE_MAINTAINED",
            "message": (
                f"Request GRANTED: Granting request from {proc_name} results in a SAFE state. "
                f"Safe execution sequence: {' -> '.join(safety_result['safe_sequence'])}."
            ),
            "is_safe": True,
            "new_available": tentative_avail,
            "new_allocation": tentative_alloc,
            "new_need": tentative_need,
            "safety_analysis": safety_result
        }
    else:
        return {
            "granted": False,
            "reason": "UNSAFE_STATE_PREVENTED",
            "message": (
                f"Request REJECTED (Deadlock Avoidance): Granting request to {proc_name} would leave the system "
                f"in an UNSAFE state where deadlock could occur. State rolled back to preserve system safety."
            ),
            "is_safe": False,
            "original_available": available,
            "original_allocation": allocation,
            "original_need": need,
            "safety_analysis": safety_result
        }


def run_deadlock_detection(
    processes: List[str],
    resources: List[str],
    available: List[int],
    allocation: List[List[int]],
    request_matrix: List[List[int]]
) -> Dict[str, Any]:
    """
    Deadlock Detection Algorithm (distinct from Banker's avoidance).
    Takes actual current allocation and actual outstanding requests.
    """
    n = len(processes)
    m = len(resources)

    work = list(available)
    finish = [False] * n

    # Step 1: Initialize Finish
    for i in range(n):
        # If allocation is 0, process can immediately finish
        if all(allocation[i][j] == 0 for j in range(m)):
            finish[i] = True

    steps: List[Dict[str, Any]] = []
    finish_sequence: List[str] = []

    steps.append({
        "step": 0,
        "work": list(work),
        "finish": list(finish),
        "explanation": f"Initial detection state: Work = Available {work}. Processes with 0 allocation marked Finished."
    })

    while True:
        found = False
        for i in range(n):
            if not finish[i]:
                # Check if Request[i] <= Work
                can_satisfy = all(request_matrix[i][j] <= work[j] for j in range(m))
                if can_satisfy:
                    found = True
                    chosen_idx = i
                    break

        if not found:
            break

        proc_name = processes[chosen_idx]
        finish[chosen_idx] = True
        finish_sequence.append(proc_name)

        old_work = list(work)
        for j in range(m):
            work[j] += allocation[chosen_idx][j]

        step_num = len(finish_sequence)
        steps.append({
            "step": step_num,
            "work": list(work),
            "finish": list(finish),
            "selected_process": proc_name,
            "released_allocation": allocation[chosen_idx],
            "explanation": f"Process {proc_name} can satisfy request <= Work {old_work}. Releasing resources. New Work = {work}."
        })

    deadlocked_procs = [processes[i] for i in range(n) if not finish[i]]
    is_deadlocked = len(deadlocked_procs) > 0

    if is_deadlocked:
        msg = f"DEADLOCK DETECTED! The following processes are deadlocked: {', '.join(deadlocked_procs)}."
    else:
        msg = "NO DEADLOCK DETECTED: All processes can successfully complete with available resources."

    return {
        "is_deadlocked": is_deadlocked,
        "deadlocked_processes": deadlocked_procs,
        "finish_sequence": finish_sequence,
        "steps": steps,
        "final_work": work,
        "message": msg
    }


def build_resource_allocation_graph(
    processes: List[str],
    resources: List[str],
    total_resources: List[int],
    allocation: List[List[int]],
    request_or_need: List[List[int]]
) -> Dict[str, Any]:
    """Build graph nodes and edges for Resource Allocation Graph (RAG) visualization."""
    nodes = []
    edges = []

    # Process nodes
    for idx, p in enumerate(processes):
        nodes.append({
            "id": f"P_{idx}",
            "label": p,
            "type": "process"
        })

    # Resource nodes
    for idx, r in enumerate(resources):
        nodes.append({
            "id": f"R_{idx}",
            "label": r,
            "type": "resource",
            "capacity": total_resources[idx]
        })

    # Assignment edges: Resource -> Process
    for p_idx, p in enumerate(processes):
        for r_idx, r in enumerate(resources):
            count = allocation[p_idx][r_idx]
            if count > 0:
                edges.append({
                    "from": f"R_{r_idx}",
                    "to": f"P_{p_idx}",
                    "type": "assignment",
                    "weight": count,
                    "label": f"{count} allocated"
                })

    # Request edges: Process -> Resource
    for p_idx, p in enumerate(processes):
        for r_idx, r in enumerate(resources):
            req_count = request_or_need[p_idx][r_idx]
            if req_count > 0:
                edges.append({
                    "from": f"P_{p_idx}",
                    "to": f"R_{r_idx}",
                    "type": "request",
                    "weight": req_count,
                    "label": f"{req_count} requested"
                })

    return {
        "nodes": nodes,
        "edges": edges
    }
