"""
Virtual Memory & Page Replacement Simulation Engine
Supports:
1. FIFO (First-In First-Out)
2. LRU (Least Recently Used)
3. LFU (Least Frequently Used with FIFO tie-breaker)

Also includes Belady's Anomaly analysis and comparison runner.
Full step-by-step frame snapshots for playback controls.
"""

from typing import List, Dict, Any, Optional
import copy


def run_page_replacement(
    reference_string: List[int],
    num_frames: int,
    algorithm: str = "FIFO"
) -> Dict[str, Any]:
    """
    Simulate page replacement.
    reference_string: list of integers representing page requests
    num_frames: int >= 1
    algorithm: 'FIFO' | 'LRU' | 'LFU'
    """
    if not reference_string:
        raise ValueError("Page reference string cannot be empty.")
    if num_frames <= 0:
        raise ValueError("Number of frames must be >= 1.")

    algo = algorithm.upper().replace("-", "_").replace(" ", "_")
    if algo not in ("FIFO", "LRU", "LFU"):
        raise ValueError(f"Unknown page replacement algorithm: {algorithm}")

    # State representation
    # frames: list of dicts: {frame_index: 0..num_frames-1, page: int or None, load_step: int, last_used: int, freq: int}
    frames: List[Dict[str, Any]] = [
        {"frame_id": i, "page": None, "load_step": -1, "last_used": -1, "freq": 0}
        for i in range(num_frames)
    ]

    # FIFO tracking: order of entry into frames
    fifo_queue: List[int] = []  # list of frame indices in order of allocation

    steps: List[Dict[str, Any]] = []
    fault_count = 0
    hit_count = 0

    for step_idx, ref_page in enumerate(reference_string):
        # Check if page is currently in any frame (HIT)
        hit_frame_idx = None
        for idx, f in enumerate(frames):
            if f["page"] == ref_page:
                hit_frame_idx = idx
                break

        if hit_frame_idx is not None:
            # HIT
            hit_count += 1
            frames[hit_frame_idx]["last_used"] = step_idx
            frames[hit_frame_idx]["freq"] += 1
            reason = f"HIT: Page {ref_page} already present in Frame {hit_frame_idx}."
            steps.append({
                "step": step_idx + 1,
                "page": ref_page,
                "is_hit": True,
                "replaced_page": None,
                "target_frame": hit_frame_idx,
                "frames": copy.deepcopy(frames),
                "fault_count": fault_count,
                "hit_count": hit_count,
                "hit_ratio": round((hit_count / (step_idx + 1)) * 100, 2),
                "fault_rate": round((fault_count / (step_idx + 1)) * 100, 2),
                "reason": reason
            })
            continue

        # FAULT
        fault_count += 1
        replaced_page = None
        target_frame_idx = None

        # Look for empty frame first
        empty_indices = [i for i, f in enumerate(frames) if f["page"] is None]
        if empty_indices:
            target_frame_idx = empty_indices[0]
            frames[target_frame_idx]["page"] = ref_page
            frames[target_frame_idx]["load_step"] = step_idx
            frames[target_frame_idx]["last_used"] = step_idx
            frames[target_frame_idx]["freq"] = 1
            fifo_queue.append(target_frame_idx)
            reason = f"FAULT: Page {ref_page} loaded into empty Frame {target_frame_idx}."
        else:
            # Eviction required
            if algo == "FIFO":
                # Oldest in fifo_queue
                target_frame_idx = fifo_queue.pop(0)
                replaced_page = frames[target_frame_idx]["page"]
                reason = f"FAULT: Frame {target_frame_idx} evicted (Page {replaced_page} was resident longest since step {frames[target_frame_idx]['load_step']})."
                fifo_queue.append(target_frame_idx)

            elif algo == "LRU":
                # Frame with minimum last_used step
                target_frame_idx = min(range(num_frames), key=lambda i: (frames[i]["last_used"], frames[i]["load_step"]))
                replaced_page = frames[target_frame_idx]["page"]
                reason = f"FAULT: Frame {target_frame_idx} evicted (Page {replaced_page} was least recently used at step {frames[target_frame_idx]['last_used']})."

            elif algo == "LFU":
                # Frame with minimum access frequency; tie-breaker: FIFO (oldest load_step)
                target_frame_idx = min(range(num_frames), key=lambda i: (frames[i]["freq"], frames[i]["load_step"]))
                replaced_page = frames[target_frame_idx]["page"]
                reason = f"FAULT: Frame {target_frame_idx} evicted (Page {replaced_page} had lowest frequency = {frames[target_frame_idx]['freq']}, tie-broken by FIFO)."

            # Update target frame with new page
            frames[target_frame_idx]["page"] = ref_page
            frames[target_frame_idx]["load_step"] = step_idx
            frames[target_frame_idx]["last_used"] = step_idx
            frames[target_frame_idx]["freq"] = 1

        steps.append({
            "step": step_idx + 1,
            "page": ref_page,
            "is_hit": False,
            "replaced_page": replaced_page,
            "target_frame": target_frame_idx,
            "frames": copy.deepcopy(frames),
            "fault_count": fault_count,
            "hit_count": hit_count,
            "hit_ratio": round((hit_count / (step_idx + 1)) * 100, 2),
            "fault_rate": round((fault_count / (step_idx + 1)) * 100, 2),
            "reason": reason
        })

    total_refs = len(reference_string)
    final_hit_ratio = round((hit_count / total_refs) * 100, 2)
    final_fault_rate = round((fault_count / total_refs) * 100, 2)

    return {
        "algorithm": algo,
        "num_frames": num_frames,
        "reference_string": reference_string,
        "total_references": total_refs,
        "page_faults": fault_count,
        "page_hits": hit_count,
        "hit_ratio": final_hit_ratio,
        "fault_rate": final_fault_rate,
        "steps": steps
    }


def compare_page_replacements(reference_string: List[int], num_frames: int) -> Dict[str, Any]:
    """Compare FIFO, LRU, and LFU side-by-side on identical input."""
    fifo_res = run_page_replacement(reference_string, num_frames, "FIFO")
    lru_res = run_page_replacement(reference_string, num_frames, "LRU")
    lfu_res = run_page_replacement(reference_string, num_frames, "LFU")

    return {
        "reference_string": reference_string,
        "num_frames": num_frames,
        "algorithms": {
            "FIFO": fifo_res,
            "LRU": lru_res,
            "LFU": lfu_res
        },
        "summary": [
            {
                "algorithm": "FIFO",
                "faults": fifo_res["page_faults"],
                "hits": fifo_res["page_hits"],
                "hit_ratio": fifo_res["hit_ratio"],
                "fault_rate": fifo_res["fault_rate"]
            },
            {
                "algorithm": "LRU",
                "faults": lru_res["page_faults"],
                "hits": lru_res["page_hits"],
                "hit_ratio": lru_res["hit_ratio"],
                "fault_rate": lru_res["fault_rate"]
            },
            {
                "algorithm": "LFU",
                "faults": lfu_res["page_faults"],
                "hits": lfu_res["page_hits"],
                "hit_ratio": lfu_res["hit_ratio"],
                "fault_rate": lfu_res["fault_rate"]
            }
        ]
    }


def run_belady_anomaly_demo(
    custom_ref_string: Optional[List[int]] = None,
    frame_range: Optional[List[int]] = None
) -> Dict[str, Any]:
    """
    Demonstrate Belady's Anomaly where increasing the number of page frames
    results in an increase in the number of page faults under FIFO.
    Standard classic sequence: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
    3 frames: 9 faults. 4 frames: 10 faults!
    """
    ref = custom_ref_string or [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
    frames_to_test = frame_range or [2, 3, 4, 5, 6]

    results = []
    has_anomaly = False
    anomaly_details = []

    prev_faults = None
    for f in frames_to_test:
        sim = run_page_replacement(ref, f, "FIFO")
        faults = sim["page_faults"]
        results.append({
            "frames": f,
            "faults": faults,
            "hits": sim["page_hits"],
            "hit_ratio": sim["hit_ratio"]
        })
        if prev_faults is not None and faults > prev_faults:
            has_anomaly = True
            anomaly_details.append(f"Frames increased from {f-1} to {f}, yet faults increased from {prev_faults} to {faults}!")
        prev_faults = faults

    return {
        "reference_string": ref,
        "results": results,
        "has_anomaly": has_anomaly,
        "anomaly_details": anomaly_details,
        "explanation": (
            "Belady's Anomaly is the phenomenon in which increasing the number of page frames results in "
            "an increase in the number of page faults for certain memory access patterns under FIFO page replacement. "
            "This occurs because FIFO is not a stack algorithm (unlike LRU or Optimal), meaning the set of pages in "
            "a smaller frame allocation is not necessarily a subset of the pages in a larger frame allocation."
        )
    }
