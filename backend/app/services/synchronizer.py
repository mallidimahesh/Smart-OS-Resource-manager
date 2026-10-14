"""
Process Synchronization Simulation Engine
Interactive educational demonstrations for:
1. Producer-Consumer (Bounded Buffer with counting semaphores & mutex, safe vs unsafe race mode)
2. Readers-Writers (Reader-preference vs Writer-preference, mutual exclusion, starvation analysis)
3. Dining Philosophers (5 philosophers, circular wait deadlock demonstration vs asymmetric deadlock-free strategy)

Full event snapshots and deterministic execution traces.
"""

from typing import List, Dict, Any, Optional
import copy


def simulate_producer_consumer(
    buffer_capacity: int = 5,
    operations: Optional[List[Dict[str, Any]]] = None,
    mode: str = "SAFE"
) -> Dict[str, Any]:
    """
    Simulate Bounded Buffer Producer-Consumer.
    mode: 'SAFE' (proper semaphores: mutex=1, empty=C, full=0) or 'UNSAFE' (race condition demo)
    operations: list of {'type': 'PRODUCE', 'item': 'X'} or {'type': 'CONSUME'}
    """
    if buffer_capacity <= 0:
        raise ValueError("Buffer capacity must be > 0.")

    ops = operations or [
        {"type": "PRODUCE", "item": "Data-1"},
        {"type": "PRODUCE", "item": "Data-2"},
        {"type": "CONSUME"},
        {"type": "PRODUCE", "item": "Data-3"},
        {"type": "PRODUCE", "item": "Data-4"},
        {"type": "PRODUCE", "item": "Data-5"},
        {"type": "PRODUCE", "item": "Data-6"},  # tests full buffer
        {"type": "CONSUME"},
        {"type": "CONSUME"}
    ]

    buffer_items: List[str] = []
    # Semaphores
    mutex = 1
    empty = buffer_capacity
    full = 0

    snapshots: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []
    race_conditions_detected = 0

    # Initial snapshot
    snapshots.append({
        "step": 0,
        "action": "INIT",
        "buffer": list(buffer_items),
        "capacity": buffer_capacity,
        "semaphores": {"mutex": mutex, "empty": empty, "full": full},
        "explanation": f"Bounded buffer initialized with capacity {buffer_capacity}. Semaphores: mutex=1, empty={empty}, full={full}."
    })

    for idx, op in enumerate(ops):
        step_num = idx + 1
        op_type = op.get("type", "").upper()
        item = op.get("item", f"Item_{step_num}")

        if op_type == "PRODUCE":
            if mode == "SAFE":
                if empty <= 0:
                    # Buffer full - producer must wait!
                    events.append({
                        "step": step_num,
                        "type": "PRODUCE_BLOCKED",
                        "description": f"Producer attempted to add '{item}' but buffer is FULL (empty=0). Producer blocked on wait(empty)."
                    })
                    snapshots.append({
                        "step": step_num,
                        "action": "PRODUCE_BLOCKED",
                        "buffer": list(buffer_items),
                        "capacity": buffer_capacity,
                        "semaphores": {"mutex": mutex, "empty": empty, "full": full},
                        "success": False,
                        "explanation": f"Buffer full! Producer blocked by semaphore empty=0. Buffer under safe condition."
                    })
                    continue

                # Safe execution: wait(empty); wait(mutex); put(); signal(mutex); signal(full);
                empty -= 1
                mutex = 0  # acquired
                buffer_items.append(item)
                mutex = 1  # released
                full += 1

                events.append({
                    "step": step_num,
                    "type": "PRODUCE_SUCCESS",
                    "description": f"Producer safely placed '{item}' into buffer. Semaphores: empty={empty}, full={full}."
                })
                snapshots.append({
                    "step": step_num,
                    "action": "PRODUCE_SUCCESS",
                    "buffer": list(buffer_items),
                    "capacity": buffer_capacity,
                    "semaphores": {"mutex": mutex, "empty": empty, "full": full},
                    "success": True,
                    "explanation": f"Produced '{item}'. Buffer holds {len(buffer_items)}/{buffer_capacity} items."
                })

            else:
                # UNSAFE mode: no semaphore checking (demonstrating buffer overflow & race conditions)
                if len(buffer_items) >= buffer_capacity:
                    race_conditions_detected += 1
                    events.append({
                        "step": step_num,
                        "type": "BUFFER_OVERFLOW",
                        "description": f"RACE CONDITION / OVERFLOW! Producer added '{item}' without checking empty semaphore. Buffer exceeded capacity!"
                    })
                buffer_items.append(item)
                snapshots.append({
                    "step": step_num,
                    "action": "UNSAFE_PRODUCE",
                    "buffer": list(buffer_items),
                    "capacity": buffer_capacity,
                    "semaphores": {"mutex": 0, "empty": -1, "full": len(buffer_items)},
                    "success": True,
                    "race_occurred": len(buffer_items) > buffer_capacity,
                    "explanation": f"Unsafe produce without mutex/semaphore. Buffer count={len(buffer_items)}. Overflow risk!"
                })

        elif op_type == "CONSUME":
            if mode == "SAFE":
                if full <= 0:
                    events.append({
                        "step": step_num,
                        "type": "CONSUME_BLOCKED",
                        "description": "Consumer attempted to remove an item but buffer is EMPTY (full=0). Consumer blocked on wait(full)."
                    })
                    snapshots.append({
                        "step": step_num,
                        "action": "CONSUME_BLOCKED",
                        "buffer": list(buffer_items),
                        "capacity": buffer_capacity,
                        "semaphores": {"mutex": mutex, "empty": empty, "full": full},
                        "success": False,
                        "explanation": "Buffer is empty! Consumer safely blocked by semaphore full=0."
                    })
                    continue

                # Safe execution: wait(full); wait(mutex); take(); signal(mutex); signal(empty);
                full -= 1
                mutex = 0
                removed = buffer_items.pop(0)
                mutex = 1
                empty += 1

                events.append({
                    "step": step_num,
                    "type": "CONSUME_SUCCESS",
                    "description": f"Consumer safely removed '{removed}'. Semaphores: empty={empty}, full={full}."
                })
                snapshots.append({
                    "step": step_num,
                    "action": "CONSUME_SUCCESS",
                    "buffer": list(buffer_items),
                    "capacity": buffer_capacity,
                    "semaphores": {"mutex": mutex, "empty": empty, "full": full},
                    "success": True,
                    "explanation": f"Consumed '{removed}'. Buffer now holds {len(buffer_items)}/{buffer_capacity} items."
                })

            else:
                # UNSAFE mode:
                if not buffer_items:
                    race_conditions_detected += 1
                    events.append({
                        "step": step_num,
                        "type": "BUFFER_UNDERFLOW",
                        "description": "RACE CONDITION / UNDERFLOW! Consumer attempted to consume from an empty buffer without synchronization!"
                    })
                    snapshots.append({
                        "step": step_num,
                        "action": "UNSAFE_UNDERFLOW",
                        "buffer": [],
                        "capacity": buffer_capacity,
                        "semaphores": {"mutex": 0, "empty": buffer_capacity, "full": -1},
                        "success": False,
                        "race_occurred": True,
                        "explanation": "Unsafe underflow: consumer read garbage from empty buffer."
                    })
                else:
                    removed = buffer_items.pop(0)
                    snapshots.append({
                        "step": step_num,
                        "action": "UNSAFE_CONSUME",
                        "buffer": list(buffer_items),
                        "capacity": buffer_capacity,
                        "semaphores": {"mutex": 0, "empty": 0, "full": len(buffer_items)},
                        "success": True,
                        "explanation": f"Unsafe consume removed '{removed}'."
                    })

    return {
        "lab": "PRODUCER_CONSUMER",
        "mode": mode,
        "buffer_capacity": buffer_capacity,
        "final_buffer": buffer_items,
        "race_conditions_detected": race_conditions_detected,
        "snapshots": snapshots,
        "events": events
    }


def simulate_readers_writers(
    operations: Optional[List[Dict[str, Any]]] = None,
    priority_policy: str = "READER_PREFERENCE"
) -> Dict[str, Any]:
    """
    Simulate Readers-Writers synchronization problem.
    priority_policy: 'READER_PREFERENCE' or 'WRITER_PREFERENCE'
    operations: list of:
      - {'actor': 'R1', 'action': 'START_READ'}
      - {'actor': 'R1', 'action': 'FINISH_READ'}
      - {'actor': 'W1', 'action': 'START_WRITE'}
      - {'actor': 'W1', 'action': 'FINISH_WRITE'}
    """
    ops = operations or [
        {"actor": "R1", "action": "START_READ"},
        {"actor": "R2", "action": "START_READ"},
        {"actor": "W1", "action": "START_WRITE"},
        {"actor": "R3", "action": "START_READ"},
        {"actor": "R1", "action": "FINISH_READ"},
        {"actor": "R2", "action": "FINISH_READ"},
        {"actor": "R3", "action": "FINISH_READ"},
        {"actor": "W1", "action": "FINISH_WRITE"}
    ]

    active_readers: List[str] = []
    active_writer: Optional[str] = None
    waiting_readers: List[str] = []
    waiting_writers: List[str] = []

    resource_data = "Initial Resource Data V1.0"
    snapshots: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    snapshots.append({
        "step": 0,
        "action": "INIT",
        "active_readers": [],
        "active_writer": None,
        "waiting_readers": [],
        "waiting_writers": [],
        "resource_data": resource_data,
        "explanation": f"Readers-Writers lab initialized with policy: {priority_policy}."
    })

    for idx, op in enumerate(ops):
        step_num = idx + 1
        actor = op.get("actor", f"A{step_num}")
        act = op.get("action", "")

        if act == "START_READ":
            # Can read if no active writer AND (policy is ReaderPref OR no waiting writers)
            can_read = False
            if active_writer is None:
                if priority_policy == "READER_PREFERENCE":
                    can_read = True
                else:  # WRITER_PREFERENCE
                    can_read = (len(waiting_writers) == 0)

            if can_read:
                active_readers.append(actor)
                explanation = f"Reader {actor} granted read access (concurrent readers = {len(active_readers)})."
            else:
                waiting_readers.append(actor)
                reason = "Active writer holds lock" if active_writer else "Waiting writers have priority"
                explanation = f"Reader {actor} BLOCKED and queued ({reason})."

        elif act == "FINISH_READ":
            if actor in active_readers:
                active_readers.remove(actor)
                explanation = f"Reader {actor} completed reading. Active readers remaining: {len(active_readers)}."
                # If no readers remain and writers waiting, grant next writer
                if len(active_readers) == 0 and waiting_writers and active_writer is None:
                    next_writer = waiting_writers.pop(0)
                    active_writer = next_writer
                    explanation += f" Lock acquired by waiting writer {next_writer}."
            else:
                explanation = f"Reader {actor} was not actively reading."

        elif act == "START_WRITE":
            # Writer requires exclusive access (no readers, no active writer)
            if len(active_readers) == 0 and active_writer is None:
                active_writer = actor
                resource_data = f"Data updated by {actor} at step {step_num}"
                explanation = f"Writer {actor} acquired exclusive write lock. Resource updated."
            else:
                waiting_writers.append(actor)
                explanation = f"Writer {actor} BLOCKED and queued. Waiting for readers/active writer to finish."

        elif act == "FINISH_WRITE":
            if active_writer == actor:
                active_writer = None
                explanation = f"Writer {actor} released write lock."
                # Next scheduling depending on policy
                if priority_policy == "WRITER_PREFERENCE" and waiting_writers:
                    next_w = waiting_writers.pop(0)
                    active_writer = next_w
                    resource_data = f"Data updated by {next_w} at step {step_num}"
                    explanation += f" Next writer {next_w} granted write lock."
                elif waiting_readers:
                    # Release waiting readers
                    released = list(waiting_readers)
                    active_readers.extend(released)
                    waiting_readers.clear()
                    explanation += f" All waiting readers ({', '.join(released)}) granted read access."
                elif waiting_writers:
                    next_w = waiting_writers.pop(0)
                    active_writer = next_w
                    resource_data = f"Data updated by {next_w} at step {step_num}"
                    explanation += f" Next writer {next_w} granted write lock."
            else:
                explanation = f"Writer {actor} does not hold the active lock."

        snapshots.append({
            "step": step_num,
            "operation": op,
            "active_readers": list(active_readers),
            "active_writer": active_writer,
            "waiting_readers": list(waiting_readers),
            "waiting_writers": list(waiting_writers),
            "resource_data": resource_data,
            "explanation": explanation
        })
        events.append({"step": step_num, "actor": actor, "action": act, "description": explanation})

    return {
        "lab": "READERS_WRITERS",
        "policy": priority_policy,
        "snapshots": snapshots,
        "events": events,
        "starvation_analysis": (
            "Under READER_PREFERENCE, a stream of arriving readers can indefinitely starve waiting writers. "
            "Under WRITER_PREFERENCE, arriving writers block subsequent readers, preventing writer starvation, "
            "but potentially starving readers if writers arrive continuously."
        )
    }


def simulate_dining_philosophers(strategy: str = "ASYMMETRIC") -> Dict[str, Any]:
    """
    Simulate Dining Philosophers problem (5 philosophers, 5 forks).
    strategy:
      - 'ASYMMETRIC': Deadlock-free solution where Philosopher 4 picks Right fork first,
                      while Philosophers 0-3 pick Left fork first (breaking circular wait condition).
      - 'NAIVE_DEADLOCK': All philosophers pick their left fork simultaneously, causing deadlock.
    """
    n = 5
    # States: 'THINKING', 'HUNGRY', 'EATING'
    phil_states = ["THINKING"] * n
    # Fork availability: True if on table, False if held
    forks = [True] * n
    fork_holders = [None] * n  # fork_holders[i] is phil index holding fork i

    snapshots: List[Dict[str, Any]] = []
    events: List[Dict[str, Any]] = []

    def left_fork(i): return i
    def right_fork(i): return (i + 1) % n

    snapshots.append({
        "step": 0,
        "philosophers": list(phil_states),
        "forks": list(forks),
        "fork_holders": list(fork_holders),
        "deadlocked": False,
        "explanation": f"5 Philosophers thinking. 5 forks placed on round table. Strategy: {strategy}."
    })

    if strategy == "NAIVE_DEADLOCK":
        # Step 1: All become hungry
        for i in range(n):
            phil_states[i] = "HUNGRY"
        snapshots.append({
            "step": 1,
            "philosophers": list(phil_states),
            "forks": list(forks),
            "fork_holders": list(fork_holders),
            "deadlocked": False,
            "explanation": "All 5 philosophers become HUNGRY simultaneously."
        })

        # Step 2: Every philosopher picks up their left fork
        for i in range(n):
            lf = left_fork(i)
            forks[lf] = False
            fork_holders[lf] = i

        snapshots.append({
            "step": 2,
            "philosophers": list(phil_states),
            "forks": list(forks),
            "fork_holders": list(fork_holders),
            "deadlocked": False,
            "explanation": "Every philosopher i picks up Left Fork i. All forks are now acquired!"
        })

        # Step 3: Every philosopher tries to pick right fork -> all blocked -> DEADLOCK!
        snapshots.append({
            "step": 3,
            "philosophers": list(phil_states),
            "forks": list(forks),
            "fork_holders": list(fork_holders),
            "deadlocked": True,
            "explanation": (
                "DEADLOCK CONFIRMED! Every philosopher holds their Left fork and waits indefinitely for their Right fork. "
                "The Circular Wait condition is established: P0 waits for P1, P1 waits for P2, P2 waits for P3, "
                "P3 waits for P4, and P4 waits for P0."
            )
        })

    else:
        # ASYMMETRIC (Deadlock-Free) Strategy
        # Step 1: Philosophers 0 and 2 become hungry and eat
        phil_states[0] = "EATING"
        phil_states[2] = "EATING"
        forks[0] = False
        fork_holders[0] = 0
        forks[1] = False
        fork_holders[1] = 0
        forks[2] = False
        fork_holders[2] = 2
        forks[3] = False
        fork_holders[3] = 2

        snapshots.append({
            "step": 1,
            "philosophers": list(phil_states),
            "forks": list(forks),
            "fork_holders": list(fork_holders),
            "deadlocked": False,
            "explanation": "Philosophers 0 and 2 acquire both adjacent forks and begin EATING concurrently."
        })

        # Step 2: Phil 1 and Phil 4 become hungry and wait safely
        phil_states[1] = "HUNGRY"
        phil_states[4] = "HUNGRY"
        snapshots.append({
            "step": 2,
            "philosophers": list(phil_states),
            "forks": list(forks),
            "fork_holders": list(fork_holders),
            "deadlocked": False,
            "explanation": "Philosophers 1 and 4 become HUNGRY but wait because forks are in use. No circular wait."
        })

        # Step 3: Phil 0 and 2 finish eating and release forks
        phil_states[0] = "THINKING"
        phil_states[2] = "THINKING"
        forks[0] = True
        fork_holders[0] = None
        forks[1] = True
        fork_holders[1] = None
        forks[2] = True
        fork_holders[2] = None
        forks[3] = True
        fork_holders[3] = None

        snapshots.append({
            "step": 3,
            "philosophers": list(phil_states),
            "forks": list(forks),
            "fork_holders": list(fork_holders),
            "deadlocked": False,
            "explanation": "Philosophers 0 and 2 finish eating, returning all 4 forks to the table."
        })

        # Step 4: Phil 1 and 4 acquire forks and eat
        phil_states[1] = "EATING"
        phil_states[4] = "EATING"
        forks[1] = False
        fork_holders[1] = 1
        forks[2] = False
        fork_holders[2] = 1
        forks[4] = False
        fork_holders[4] = 4
        forks[0] = False
        fork_holders[0] = 4

        snapshots.append({
            "step": 4,
            "philosophers": list(phil_states),
            "forks": list(forks),
            "fork_holders": list(fork_holders),
            "deadlocked": False,
            "explanation": "Philosophers 1 and 4 acquire forks and transition to EATING. Asymmetric resource ordering guarantees forward progress!"
        })

    return {
        "lab": "DINING_PHILOSOPHERS",
        "strategy": strategy,
        "num_philosophers": n,
        "snapshots": snapshots
    }
