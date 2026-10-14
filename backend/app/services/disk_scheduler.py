"""
Disk Scheduling Simulation Engine
Supports all 6 algorithms:
1. FCFS (First Come First Served)
2. SSTF (Shortest Seek Time First)
3. SCAN (Elevator Algorithm)
4. C-SCAN (Circular SCAN)
5. LOOK (Look to furthest request in current direction)
6. C-LOOK (Circular LOOK)

Accurate head movement calculations, boundary handling, and full comparison runner.
"""

from typing import List, Dict, Any, Optional
import copy


def run_disk_scheduling(
    requests: List[int],
    initial_head: int,
    disk_size: int = 200,
    direction: str = "UP",
    algorithm: str = "FCFS",
    include_jump_in_movement: bool = True
) -> Dict[str, Any]:
    """
    Execute disk scheduling simulation.
    requests: list of cylinder request numbers (0 <= r < disk_size)
    initial_head: starting position of the disk head (0 <= initial_head < disk_size)
    disk_size: total cylinders (range is 0 to disk_size - 1)
    direction: 'UP' (towards disk_size-1) or 'DOWN' (towards 0)
    algorithm: 'FCFS' | 'SSTF' | 'SCAN' | 'C_SCAN' | 'LOOK' | 'C_LOOK'
    include_jump_in_movement: for C-SCAN / C-LOOK, whether return jump counts towards total movement
    """
    if not requests:
        raise ValueError("Disk request queue cannot be empty.")
    if initial_head < 0 or initial_head >= disk_size:
        raise ValueError(f"Initial head position {initial_head} is outside disk range [0, {disk_size - 1}].")

    for r in requests:
        if r < 0 or r >= disk_size:
            raise ValueError(f"Request {r} is outside disk bounds [0, {disk_size - 1}].")

    algo = algorithm.upper().replace("-", "_").replace(" ", "_")
    dir_up = direction.upper() in ("UP", "RIGHT", "HIGH")

    min_track = 0
    max_track = disk_size - 1

    # Route generation
    visited_sequence: List[int] = [initial_head]
    serviced_indices: List[int] = []

    reqs = list(requests)

    if algo == "FCFS":
        for r in reqs:
            visited_sequence.append(r)

    elif algo == "SSTF":
        curr = initial_head
        pending = list(reqs)
        while pending:
            # Pick request with minimum absolute distance
            closest = min(pending, key=lambda x: abs(x - curr))
            visited_sequence.append(closest)
            pending.remove(closest)
            curr = closest

    elif algo == "SCAN":
        # Elevator to boundary, then reverse
        lower = sorted([r for r in reqs if r < initial_head])
        higher = sorted([r for r in reqs if r >= initial_head])

        if dir_up:
            # Service higher, touch max_track, then lower descending
            for r in higher:
                visited_sequence.append(r)
            if lower:  # Only touch boundary if there are requests in other direction
                visited_sequence.append(max_track)
                for r in reversed(lower):
                    visited_sequence.append(r)
        else:
            # Service lower descending, touch min_track (0), then higher ascending
            for r in reversed(lower):
                visited_sequence.append(r)
            if higher:
                visited_sequence.append(min_track)
                for r in higher:
                    visited_sequence.append(r)

    elif algo in ("C_SCAN", "CSCAN"):
        lower = sorted([r for r in reqs if r < initial_head])
        higher = sorted([r for r in reqs if r >= initial_head])

        if dir_up:
            for r in higher:
                visited_sequence.append(r)
            if lower:
                visited_sequence.append(max_track)
                visited_sequence.append(min_track)
                for r in lower:
                    visited_sequence.append(r)
        else:
            for r in reversed(lower):
                visited_sequence.append(r)
            if higher:
                visited_sequence.append(min_track)
                visited_sequence.append(max_track)
                for r in reversed(higher):
                    visited_sequence.append(r)

    elif algo == "LOOK":
        lower = sorted([r for r in reqs if r < initial_head])
        higher = sorted([r for r in reqs if r >= initial_head])

        if dir_up:
            for r in higher:
                visited_sequence.append(r)
            for r in reversed(lower):
                visited_sequence.append(r)
        else:
            for r in reversed(lower):
                visited_sequence.append(r)
            for r in higher:
                visited_sequence.append(r)

    elif algo in ("C_LOOK", "CLOOK"):
        lower = sorted([r for r in reqs if r < initial_head])
        higher = sorted([r for r in reqs if r >= initial_head])

        if dir_up:
            for r in higher:
                visited_sequence.append(r)
            for r in lower:
                visited_sequence.append(r)
        else:
            for r in reversed(lower):
                visited_sequence.append(r)
            for r in reversed(higher):
                visited_sequence.append(r)

    else:
        raise ValueError(f"Unknown disk scheduling algorithm: {algorithm}")

    # Build step-by-step trace and calculate movement
    steps: List[Dict[str, Any]] = []
    total_movement = 0
    curr_pos = initial_head

    # Snapshot 0
    steps.append({
        "step": 0,
        "from_track": curr_pos,
        "to_track": curr_pos,
        "distance": 0,
        "total_distance": 0,
        "serviced": False,
        "explanation": f"Disk head positioned at starting cylinder {initial_head}."
    })

    serviced_requests = []
    for idx, next_pos in enumerate(visited_sequence[1:]):
        dist = abs(next_pos - curr_pos)
        is_jump = False

        if algo in ("C_SCAN", "CSCAN") and curr_pos == max_track and next_pos == min_track and not include_jump_in_movement:
            dist = 0
            is_jump = True
        elif algo in ("C_SCAN", "CSCAN") and curr_pos == min_track and next_pos == max_track and not include_jump_in_movement:
            dist = 0
            is_jump = True

        total_movement += dist
        is_request = (next_pos in reqs) and (next_pos not in (min_track, max_track) or next_pos in reqs)

        if is_request:
            serviced_requests.append(next_pos)

        explanation = (
            f"Head moved from track {curr_pos} to {next_pos} (seek distance = {dist} cylinders). "
            f"{'Servicing cylinder request ' + str(next_pos) if is_request else 'Reaching boundary ' + str(next_pos)}."
        )

        steps.append({
            "step": idx + 1,
            "from_track": curr_pos,
            "to_track": next_pos,
            "distance": dist,
            "total_distance": total_movement,
            "serviced": is_request,
            "is_jump": is_jump,
            "explanation": explanation
        })
        curr_pos = next_pos

    avg_movement = round(total_movement / len(reqs), 2) if reqs else 0

    return {
        "algorithm": algo,
        "initial_head": initial_head,
        "disk_size": disk_size,
        "direction": direction,
        "requests": requests,
        "total_head_movement": total_movement,
        "average_head_movement": avg_movement,
        "visited_sequence": visited_sequence,
        "serviced_requests": serviced_requests,
        "steps": steps
    }


def compare_disk_scheduling(
    requests: List[int],
    initial_head: int,
    disk_size: int = 200,
    direction: str = "UP",
    include_jump_in_movement: bool = True
) -> Dict[str, Any]:
    """Compare all 6 disk scheduling algorithms on identical inputs."""
    algos = ["FCFS", "SSTF", "SCAN", "C_SCAN", "LOOK", "C_LOOK"]
    results = {}
    summary = []

    for a in algos:
        res = run_disk_scheduling(
            requests, initial_head, disk_size, direction, a, include_jump_in_movement
        )
        results[a] = res
        summary.append({
            "algorithm": a,
            "total_movement": res["total_head_movement"],
            "avg_movement": res["average_head_movement"],
            "sequence": res["visited_sequence"]
        })

    # Find best (lowest movement)
    best_algo = min(summary, key=lambda x: x["total_movement"])

    return {
        "requests": requests,
        "initial_head": initial_head,
        "disk_size": disk_size,
        "direction": direction,
        "best_algorithm": best_algo["algorithm"],
        "algorithms": results,
        "summary": summary
    }
