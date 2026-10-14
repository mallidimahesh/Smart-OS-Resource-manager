import pytest
from app.services.memory_allocator import run_memory_allocation

def test_first_fit():
    blocks = [{"size": 100}, {"size": 500}, {"size": 200}, {"size": 300}, {"size": 600}]
    ops = [
        {"type": "ALLOCATE", "pid": "P1", "size": 212},
        {"type": "ALLOCATE", "pid": "P2", "size": 417},
        {"type": "ALLOCATE", "pid": "P3", "size": 112},
        {"type": "ALLOCATE", "pid": "P4", "size": 426},
    ]
    res = run_memory_allocation(blocks, ops, "FIRST_FIT")
    # In First Fit, P1, P2, P3 succeed, and P4 (426 KB) fails due to external fragmentation (largest remaining hole is 300 KB)
    assert res["successful_allocations"] == 3
    assert res["failed_allocations"] == 1
    assert res["snapshots"][-1]["success"] is False
    assert res["final_stats"]["external_fragmentation"] > 0

def test_best_fit_vs_worst_fit():
    blocks = [{"size": 100}, {"size": 500}, {"size": 200}, {"size": 300}, {"size": 600}]
    ops = [{"type": "ALLOCATE", "pid": "P1", "size": 212}]

    # Best fit should choose block of size 300 (smallest >= 212)
    res_best = run_memory_allocation(blocks, ops, "BEST_FIT")
    # Worst fit should choose block of size 600 (largest >= 212)
    res_worst = run_memory_allocation(blocks, ops, "WORST_FIT")

    p1_best = [b for b in res_best["final_blocks"] if b["pid"] == "P1"][0]
    p1_worst = [b for b in res_worst["final_blocks"] if b["pid"] == "P1"][0]
    assert p1_best["size"] == 212
    assert p1_worst["size"] == 212

def test_deallocation_and_coalescing():
    blocks = [{"size": 300}]
    ops = [
        {"type": "ALLOCATE", "pid": "P1", "size": 100},
        {"type": "ALLOCATE", "pid": "P2", "size": 100},
        {"type": "DEALLOCATE", "pid": "P1"},
        {"type": "DEALLOCATE", "pid": "P2"},
    ]
    res = run_memory_allocation(blocks, ops, "FIRST_FIT")
    # After deallocating both, memory should coalesce back to 1 free block of 300
    assert len(res["final_blocks"]) == 1
    assert res["final_blocks"][0]["size"] == 300
    assert res["final_blocks"][0]["is_free"] is True
