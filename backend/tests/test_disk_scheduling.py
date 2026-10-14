import pytest
from app.services.disk_scheduler import run_disk_scheduling, compare_disk_scheduling

def test_disk_algorithms_all_six():
    reqs = [98, 183, 37, 122, 14, 124, 65, 67]
    head = 53
    # Standard textbook problem
    fcfs = run_disk_scheduling(reqs, head, algorithm="FCFS")
    assert fcfs["total_head_movement"] == 640

    sstf = run_disk_scheduling(reqs, head, algorithm="SSTF")
    assert sstf["total_head_movement"] == 236

    scan = run_disk_scheduling(reqs, head, algorithm="SCAN", direction="UP")
    assert scan["total_head_movement"] > 0

    cscan = run_disk_scheduling(reqs, head, algorithm="C_SCAN", direction="UP")
    assert cscan["total_head_movement"] > 0

    look = run_disk_scheduling(reqs, head, algorithm="LOOK", direction="UP")
    assert look["total_head_movement"] > 0

    clook = run_disk_scheduling(reqs, head, algorithm="C_LOOK", direction="UP")
    assert clook["total_head_movement"] > 0

def test_disk_comparison():
    reqs = [98, 183, 37, 122, 14, 124, 65, 67]
    comp = compare_disk_scheduling(reqs, initial_head=53)
    assert len(comp["summary"]) == 6
    assert comp["best_algorithm"] in ["SSTF", "LOOK", "SCAN", "C_LOOK"]
