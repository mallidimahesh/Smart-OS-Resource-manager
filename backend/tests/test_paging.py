import pytest
from app.services.page_replacer import (
    run_page_replacement,
    compare_page_replacements,
    run_belady_anomaly_demo
)

def test_fifo_paging():
    ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3]
    res = run_page_replacement(ref, num_frames=3, algorithm="FIFO")
    assert res["total_references"] == 10
    assert res["page_faults"] + res["page_hits"] == 10
    assert res["hit_ratio"] + res["fault_rate"] == 100.0

def test_lru_paging():
    ref = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3]
    res = run_page_replacement(ref, num_frames=3, algorithm="LRU")
    assert res["total_references"] == 10
    assert len(res["steps"]) == 10

def test_belady_anomaly():
    # Classic sequence: 3 frames has 9 faults, 4 frames has 10 faults under FIFO
    ref = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
    f3 = run_page_replacement(ref, num_frames=3, algorithm="FIFO")
    f4 = run_page_replacement(ref, num_frames=4, algorithm="FIFO")
    assert f3["page_faults"] == 9
    assert f4["page_faults"] == 10
    demo = run_belady_anomaly_demo(ref, [3, 4])
    assert demo["has_anomaly"] is True
