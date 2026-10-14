import pytest
from app.services.cpu_scheduler import run_cpu_scheduling

def test_fcfs_basic():
    processes = [
        {"pid": "1", "name": "P1", "arrival_time": 0, "burst_time": 4},
        {"pid": "2", "name": "P2", "arrival_time": 1, "burst_time": 3},
        {"pid": "3", "name": "P3", "arrival_time": 2, "burst_time": 1},
    ]
    res = run_cpu_scheduling(processes, "FCFS")
    assert res["algorithm"] == "First Come First Served (FCFS)"
    assert res["total_time"] == 8
    assert res["busy_time"] == 8
    procs = {p["pid"]: p for p in res["processes"]}
    # P1: CT=4, TAT=4, WT=0, RT=0
    assert procs["1"]["completion_time"] == 4
    assert procs["1"]["turnaround_time"] == 4
    assert procs["1"]["waiting_time"] == 0
    # P2: CT=7, TAT=6, WT=3, RT=3
    assert procs["2"]["completion_time"] == 7
    assert procs["2"]["turnaround_time"] == 6
    assert procs["2"]["waiting_time"] == 3
    # P3: CT=8, TAT=6, WT=5, RT=5
    assert procs["3"]["completion_time"] == 8
    assert procs["3"]["turnaround_time"] == 6
    assert procs["3"]["waiting_time"] == 5

def test_idle_periods():
    processes = [
        {"pid": "1", "name": "P1", "arrival_time": 2, "burst_time": 3},
        {"pid": "2", "name": "P2", "arrival_time": 7, "burst_time": 2},
    ]
    res = run_cpu_scheduling(processes, "FCFS")
    assert res["total_time"] == 9
    assert res["busy_time"] == 5
    # Should have idle from 0 to 2, and 5 to 7
    idle_intervals = [g for g in res["gantt_chart"] if g["is_idle"]]
    assert len(idle_intervals) == 2
    assert idle_intervals[0]["start_time"] == 0 and idle_intervals[0]["end_time"] == 2
    assert idle_intervals[1]["start_time"] == 5 and idle_intervals[1]["end_time"] == 7

def test_sjf_non_preemptive():
    processes = [
        {"pid": "1", "name": "P1", "arrival_time": 0, "burst_time": 7},
        {"pid": "2", "name": "P2", "arrival_time": 2, "burst_time": 4},
        {"pid": "3", "name": "P3", "arrival_time": 4, "burst_time": 1},
        {"pid": "4", "name": "P4", "arrival_time": 5, "burst_time": 4},
    ]
    res = run_cpu_scheduling(processes, "SJF")
    # P1 runs 0-7. At t=7, P2(4), P3(1), P4(4) are ready. P3 is shortest!
    order = [g["pid"] for g in res["gantt_chart"] if not g["is_idle"]]
    assert order == ["1", "3", "2", "4"]

def test_srtf_preemptive():
    processes = [
        {"pid": "1", "name": "P1", "arrival_time": 0, "burst_time": 8},
        {"pid": "2", "name": "P2", "arrival_time": 1, "burst_time": 4},
        {"pid": "3", "name": "P3", "arrival_time": 2, "burst_time": 9},
        {"pid": "4", "name": "P4", "arrival_time": 3, "burst_time": 5},
    ]
    res = run_cpu_scheduling(processes, "SRTF")
    # At t=1, P2 arrives with burst 4 < P1 remaining 7 -> P1 preempted!
    procs = {p["pid"]: p for p in res["processes"]}
    assert procs["2"]["start_time"] == 1
    assert procs["2"]["completion_time"] == 5

def test_round_robin():
    processes = [
        {"pid": "1", "name": "P1", "arrival_time": 0, "burst_time": 5},
        {"pid": "2", "name": "P2", "arrival_time": 1, "burst_time": 3},
        {"pid": "3", "name": "P3", "arrival_time": 2, "burst_time": 1},
    ]
    res = run_cpu_scheduling(processes, "ROUND_ROBIN", time_quantum=2)
    procs = {p["pid"]: p for p in res["processes"]}
    # Total burst = 9
    assert res["total_time"] == 9
    for p in procs.values():
        assert p["turnaround_time"] == p["completion_time"] - p["arrival_time"]
        assert p["waiting_time"] == p["turnaround_time"] - p["burst_time"]

def test_priority_aging():
    processes = [
        {"pid": "1", "name": "P1", "arrival_time": 0, "burst_time": 10, "priority": 1},
        {"pid": "2", "name": "P2", "arrival_time": 0, "burst_time": 3, "priority": 5},
    ]
    # P1 has priority 1 (higher). P2 has priority 5.
    # With aging_interval=3, P2 will age every 3 ticks and eventually finish
    res = run_cpu_scheduling(processes, "PRIORITY_AGING", aging_interval=2, lower_is_higher=True)
    assert res["total_time"] == 13
    assert len(res["processes"]) == 2
