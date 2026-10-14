import pytest
from app.services.synchronizer import (
    simulate_producer_consumer,
    simulate_readers_writers,
    simulate_dining_philosophers
)

def test_producer_consumer_safe():
    ops = [
        {"type": "PRODUCE", "item": "A"},
        {"type": "PRODUCE", "item": "B"},
        {"type": "CONSUME"},
    ]
    res = simulate_producer_consumer(buffer_capacity=2, operations=ops, mode="SAFE")
    assert res["final_buffer"] == ["B"]
    assert res["race_conditions_detected"] == 0

def test_producer_consumer_overflow_underflow_safe():
    # Capacity 1: producing twice should block second produce safely
    ops = [
        {"type": "PRODUCE", "item": "A"},
        {"type": "PRODUCE", "item": "B"}, # blocked
    ]
    res = simulate_producer_consumer(buffer_capacity=1, operations=ops, mode="SAFE")
    assert res["final_buffer"] == ["A"]

def test_readers_writers():
    res = simulate_readers_writers()
    assert res["lab"] == "READERS_WRITERS"
    assert len(res["snapshots"]) > 0

def test_dining_philosophers():
    res_safe = simulate_dining_philosophers(strategy="ASYMMETRIC")
    assert res_safe["num_philosophers"] == 5

    res_deadlock = simulate_dining_philosophers(strategy="NAIVE_DEADLOCK")
    assert res_deadlock["snapshots"][-1]["deadlocked"] is True
