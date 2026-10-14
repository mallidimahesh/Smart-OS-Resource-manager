"""
Memory Allocation Simulation Engine
Supports:
1. First Fit
2. Best Fit
3. Worst Fit

Both Variable Partitioning (Dynamic Partitioning with splitting & coalescing)
and Fixed Partitioning (measuring internal and external fragmentation).
Supports full playback snapshots (forward, backward, reset).
"""

from typing import List, Dict, Any, Optional
import copy


def run_memory_allocation(
    initial_blocks: List[Dict[str, Any]],
    operations: List[Dict[str, Any]],
    algorithm: str = "FIRST_FIT",
    is_fixed_partition: bool = False
) -> Dict[str, Any]:
    """
    Execute memory allocation simulation.
    initial_blocks: list of dicts with:
      - id: int or str
      - size: int > 0
    operations: list of dicts:
      - type: 'ALLOCATE' | 'DEALLOCATE'
      - pid: str
      - size: int (required for ALLOCATE)
    algorithm: 'FIRST_FIT' | 'BEST_FIT' | 'WORST_FIT'
    is_fixed_partition: bool (if True, partitions don't split; internal fragmentation occurs)
    """
    algo = algorithm.upper().replace("-", "_").replace(" ", "_")
    if algo not in ("FIRST_FIT", "BEST_FIT", "WORST_FIT"):
        raise ValueError(f"Unknown memory allocation algorithm: {algorithm}")

    if not initial_blocks:
        raise ValueError("Initial memory blocks list cannot be empty.")

    # Build block list
    # Each block: {id, start, size, is_free, pid, internal_fragmentation}
    blocks: List[Dict[str, Any]] = []
    current_addr = 0
    total_mem = 0

    for idx, b in enumerate(initial_blocks):
        size = int(b.get("size", 0))
        if size <= 0:
            raise ValueError(f"Block size must be > 0. Found {size}.")
        blocks.append({
            "block_id": idx + 1,
            "start": current_addr,
            "size": size,
            "is_free": True,
            "pid": None,
            "internal_fragmentation": 0
        })
        current_addr += size
        total_mem += size

    snapshots: List[Dict[str, Any]] = []
    logs: List[Dict[str, Any]] = []
    successful_allocations = 0
    failed_allocations = 0

    def compute_stats(current_blocks: List[Dict[str, Any]], failed_request_size: Optional[int] = None) -> Dict[str, Any]:
        allocated = sum(b["size"] for b in current_blocks if not b["is_free"])
        free_mem = sum(b["size"] for b in current_blocks if b["is_free"])
        utilization = round((allocated / total_mem) * 100, 2) if total_mem > 0 else 0
        internal_frag = sum(b.get("internal_fragmentation", 0) for b in current_blocks if not b["is_free"])

        # External fragmentation: if a request failed of size S, but total free >= S, all free is external frag
        external_frag = 0
        if failed_request_size is not None and free_mem >= failed_request_size:
            external_frag = free_mem

        return {
            "total_memory": total_mem,
            "allocated_memory": allocated,
            "free_memory": free_mem,
            "utilization": utilization,
            "internal_fragmentation": internal_frag,
            "external_fragmentation": external_frag,
            "block_count": len(current_blocks)
        }

    # Snapshot 0: Initial state
    snapshots.append({
        "step": 0,
        "operation": {"type": "INIT", "description": "Initial memory layout configured"},
        "blocks": copy.deepcopy(blocks),
        "stats": compute_stats(blocks),
        "explanation": f"Memory initialized with {len(blocks)} blocks totaling {total_mem} KB.",
        "success": True
    })

    last_failed_request_size = None

    for op_idx, op in enumerate(operations):
        op_type = op.get("type", "").upper()
        pid = str(op.get("pid", f"P{op_idx+1}"))
        step_num = op_idx + 1

        if op_type == "ALLOCATE":
            req_size = int(op.get("size", 0))
            if req_size <= 0:
                raise ValueError(f"Process {pid} allocation size must be > 0.")

            # Search according to algorithm
            chosen_idx = None
            inspected = []

            for i, b in enumerate(blocks):
                if b["is_free"]:
                    inspected.append({
                        "index": i,
                        "block_id": b["block_id"],
                        "size": b["size"],
                        "fits": b["size"] >= req_size
                    })

            candidate_indices = [item["index"] for item in inspected if item["fits"]]

            if not candidate_indices:
                # Allocation failed
                failed_allocations += 1
                last_failed_request_size = req_size
                stats = compute_stats(blocks, failed_request_size=req_size)
                explanation = (
                    f"ALLOCATION FAILED for {pid} ({req_size} KB): No free block has sufficient size. "
                    f"Total free memory is {stats['free_memory']} KB (External Fragmentation = {stats['external_fragmentation']} KB)."
                )
                logs.append({"step": step_num, "pid": pid, "type": "ALLOCATE_FAIL", "text": explanation})
                snapshots.append({
                    "step": step_num,
                    "operation": op,
                    "blocks": copy.deepcopy(blocks),
                    "stats": stats,
                    "inspected_blocks": inspected,
                    "chosen_block": None,
                    "explanation": explanation,
                    "success": False
                })
                continue

            # Pick block based on algorithm
            if algo == "FIRST_FIT":
                chosen_idx = candidate_indices[0]
                reason = f"First Fit picked first available block of size {blocks[chosen_idx]['size']} KB."
            elif algo == "BEST_FIT":
                # Smallest block that fits
                chosen_idx = min(candidate_indices, key=lambda idx: blocks[idx]["size"])
                reason = f"Best Fit picked smallest fitting block of size {blocks[chosen_idx]['size']} KB (leftover: {blocks[chosen_idx]['size'] - req_size} KB)."
            elif algo == "WORST_FIT":
                # Largest block that fits
                chosen_idx = max(candidate_indices, key=lambda idx: blocks[idx]["size"])
                reason = f"Worst Fit picked largest fitting block of size {blocks[chosen_idx]['size']} KB (leftover: {blocks[chosen_idx]['size'] - req_size} KB)."

            chosen_block = blocks[chosen_idx]
            original_size = chosen_block["size"]

            if is_fixed_partition:
                # Fixed partition: block is not split; leftover becomes internal fragmentation
                chosen_block["is_free"] = False
                chosen_block["pid"] = pid
                chosen_block["internal_fragmentation"] = original_size - req_size
                explanation = f"Allocated {pid} ({req_size} KB) into Block #{chosen_block['block_id']} ({original_size} KB). Internal Fragmentation = {chosen_block['internal_fragmentation']} KB. {reason}"
            else:
                # Variable partition: split block if larger than request
                if original_size > req_size:
                    rem_size = original_size - req_size
                    chosen_block["size"] = req_size
                    chosen_block["is_free"] = False
                    chosen_block["pid"] = pid
                    chosen_block["internal_fragmentation"] = 0

                    new_block = {
                        "block_id": max(b["block_id"] for b in blocks) + 1,
                        "start": chosen_block["start"] + req_size,
                        "size": rem_size,
                        "is_free": True,
                        "pid": None,
                        "internal_fragmentation": 0
                    }
                    blocks.insert(chosen_idx + 1, new_block)
                    explanation = f"Allocated {pid} ({req_size} KB) in Block #{chosen_block['block_id']}. Splitting remainder into new free block of {rem_size} KB. {reason}"
                else:
                    chosen_block["is_free"] = False
                    chosen_block["pid"] = pid
                    chosen_block["internal_fragmentation"] = 0
                    explanation = f"Allocated {pid} ({req_size} KB) in exact-fitting Block #{chosen_block['block_id']}. {reason}"

            successful_allocations += 1
            stats = compute_stats(blocks)
            logs.append({"step": step_num, "pid": pid, "type": "ALLOCATE_SUCCESS", "text": explanation})
            snapshots.append({
                "step": step_num,
                "operation": op,
                "blocks": copy.deepcopy(blocks),
                "stats": stats,
                "inspected_blocks": inspected,
                "chosen_block": chosen_block["block_id"],
                "explanation": explanation,
                "success": True
            })

        elif op_type == "DEALLOCATE":
            # Find all blocks allocated to pid
            matched_indices = [i for i, b in enumerate(blocks) if b["pid"] == pid and not b["is_free"]]
            if not matched_indices:
                explanation = f"Deallocation failed: No memory blocks currently allocated to Process '{pid}'."
                stats = compute_stats(blocks)
                logs.append({"step": step_num, "pid": pid, "type": "DEALLOCATE_FAIL", "text": explanation})
                snapshots.append({
                    "step": step_num,
                    "operation": op,
                    "blocks": copy.deepcopy(blocks),
                    "stats": stats,
                    "explanation": explanation,
                    "success": False
                })
                continue

            freed_size = 0
            for idx in matched_indices:
                freed_size += blocks[idx]["size"]
                blocks[idx]["is_free"] = True
                blocks[idx]["pid"] = None
                blocks[idx]["internal_fragmentation"] = 0

            # Coalesce adjacent free blocks if variable partitioning
            coalesced_msg = ""
            if not is_fixed_partition:
                new_blocks = []
                for b in blocks:
                    if new_blocks and new_blocks[-1]["is_free"] and b["is_free"]:
                        # Merge with previous
                        new_blocks[-1]["size"] += b["size"]
                        coalesced_msg = " Coalesced adjacent free memory blocks."
                    else:
                        new_blocks.append(b)
                blocks = new_blocks

            explanation = f"Deallocated Process '{pid}' freeing {freed_size} KB.{coalesced_msg}"
            stats = compute_stats(blocks)
            logs.append({"step": step_num, "pid": pid, "type": "DEALLOCATE_SUCCESS", "text": explanation})
            snapshots.append({
                "step": step_num,
                "operation": op,
                "blocks": copy.deepcopy(blocks),
                "stats": stats,
                "explanation": explanation,
                "success": True
            })

    final_stats = compute_stats(blocks, failed_request_size=last_failed_request_size)
    return {
        "algorithm": algo,
        "is_fixed_partition": is_fixed_partition,
        "initial_blocks": initial_blocks,
        "final_blocks": blocks,
        "snapshots": snapshots,
        "logs": logs,
        "successful_allocations": successful_allocations,
        "failed_allocations": failed_allocations,
        "final_stats": final_stats
    }
