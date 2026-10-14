import pytest
from app.services.banker_deadlock import (
    validate_and_compute_matrices,
    run_bankers_safety,
    simulate_resource_request,
    run_deadlock_detection
)

def test_bankers_safety_classic():
    procs = ["P0", "P1", "P2", "P3", "P4"]
    resources = ["A", "B", "C"]
    total = [10, 5, 7]
    alloc = [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2]
    ]
    max_d = [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3]
    ]
    mat = validate_and_compute_matrices(procs, resources, total, alloc, max_d)
    assert mat["available"] == [3, 3, 2]

    safety = run_bankers_safety(procs, resources, mat["available"], alloc, mat["need"])
    assert safety["is_safe"] is True
    assert len(safety["safe_sequence"]) == 5

def test_resource_request():
    procs = ["P0", "P1", "P2", "P3", "P4"]
    resources = ["A", "B", "C"]
    total = [10, 5, 7]
    alloc = [
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2]
    ]
    max_d = [
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3]
    ]
    mat = validate_and_compute_matrices(procs, resources, total, alloc, max_d)

    # P1 requests [1, 0, 2] -> Safe
    req_res = simulate_resource_request(
        procs, resources, mat["available"], alloc, mat["need"],
        requesting_process_idx=1, request=[1, 0, 2]
    )
    assert req_res["granted"] is True

    # P4 requests [3, 3, 0] -> exceeds available [3, 3, 2] or need
    req_fail = simulate_resource_request(
        procs, resources, mat["available"], alloc, mat["need"],
        requesting_process_idx=0, request=[10, 10, 10]
    )
    assert req_fail["granted"] is False

def test_deadlock_detection():
    procs = ["P0", "P1"]
    resources = ["R0", "R1"]
    avail = [0, 0]
    alloc = [[1, 0], [0, 1]]
    request_mat = [[0, 1], [1, 0]]
    # Both hold one resource and want the other -> circular deadlock!
    det = run_deadlock_detection(procs, resources, avail, alloc, request_mat)
    assert det["is_deadlocked"] is True
    assert set(det["deadlocked_processes"]) == {"P0", "P1"}
