"""
OS Tutor, Viva Practice, and Educational Content Service
Contains:
1. Comprehensive knowledge base for OS topics, algorithms, trade-offs, and viva questions.
2. Interactive Viva Quiz question bank with MCQs, tracing problems, scenario analysis, and explanations.
3. Contextual explanation generator explaining actual simulation runs in depth.
"""

from typing import List, Dict, Any, Optional


TOPICS_KNOWLEDGE_BASE = {
    "cpu_scheduling": {
        "title": "CPU Scheduling Algorithms",
        "description": "The process by which the operating system decides which ready process is allocated the CPU core for execution.",
        "concepts": [
            {
                "id": "fcfs",
                "name": "First-Come, First-Served (FCFS)",
                "category": "Non-preemptive",
                "problem_solved": "Provides the simplest fairness ordering based on arrival timestamp.",
                "procedure": "Allocate CPU to the process at the head of the ready queue until it terminates or yields.",
                "time_complexity": "O(N log N) for sorting arrival, O(N) execution",
                "space_complexity": "O(N)",
                "advantages": ["Simple to implement using a FIFO queue", "No starvation for finite jobs", "Zero scheduling overhead"],
                "limitations": ["Convoy Effect: short processes get stuck waiting behind long CPU-bound processes", "High average waiting time"],
                "edge_cases": ["Idle periods between arrivals", "Processes arriving simultaneously"],
                "viva_questions": [
                    {
                        "q": "What is the Convoy Effect in FCFS?",
                        "a": "It occurs when a long CPU-intensive process executes first, causing all subsequent short I/O-bound processes to wait in the ready queue, leading to low CPU and device utilization."
                    },
                    {
                        "q": "Is FCFS ever preemptive?",
                        "a": "No, standard FCFS is strictly non-preemptive. Once the CPU is allocated to a process, it holds it until termination or voluntary I/O block."
                    }
                ]
            },
            {
                "id": "sjf_srtf",
                "name": "SJF & SRTF (Shortest Job First / Shortest Remaining Time First)",
                "category": "Non-preemptive & Preemptive",
                "problem_solved": "Minimizes average waiting time across all possible scheduling algorithms (provably optimal for non-preemptive when all jobs arrive at time 0).",
                "procedure": "Select the ready process with the smallest CPU burst (SJF) or remaining time (SRTF). SRTF preempts if a newly arriving process has shorter remaining time than currently running process.",
                "time_complexity": "O(N log N) using a min-heap priority queue",
                "space_complexity": "O(N)",
                "advantages": ["Provably optimal average waiting time", "High throughput for short processes"],
                "limitations": ["Requires knowing future CPU burst times in advance (estimated via exponential smoothing in practice)", "Can cause starvation for long processes"],
                "edge_cases": ["Arrival of identical remaining time jobs", "Preemption exactly at quantum boundary"],
                "viva_questions": [
                    {
                        "q": "Why is SJF difficult to implement in real general-purpose operating systems?",
                        "a": "Because the OS cannot know the exact next CPU burst length of a user process in advance. It can only predict it using exponential moving averages (tau_{n+1} = alpha * t_n + (1 - alpha) * tau_n)."
                    },
                    {
                        "q": "How does SRTF differ from SJF?",
                        "a": "SJF is non-preemptive, meaning once a process starts its burst, it cannot be interrupted. SRTF is the preemptive variant where arrival of a shorter job preempts the current job."
                    }
                ]
            },
            {
                "id": "round_robin",
                "name": "Round Robin (RR)",
                "category": "Preemptive / Time-Shared",
                "problem_solved": "Provides fair responsiveness and interactive sharing without starvation.",
                "procedure": "Assign each process a fixed time slice (quantum q). When the timer interrupt fires, preempt the process, place it at the tail of the ready queue, and dispatch the next process.",
                "time_complexity": "O(1) dispatch using circular FIFO queue",
                "space_complexity": "O(N)",
                "advantages": ["Guaranteed responsiveness (bounded response time)", "No starvation", "Fair CPU distribution"],
                "limitations": ["Performance heavily depends on time quantum size: too large approaches FCFS; too small causes excessive context-switch overhead"],
                "edge_cases": ["Job finishing before time quantum expires", "Time quantum smaller than context-switch overhead"],
                "viva_questions": [
                    {
                        "q": "What happens if the time quantum is extremely large or extremely small in Round Robin?",
                        "a": "If quantum is infinitely large, RR degenerates into FCFS. If quantum is extremely small (approaching context-switch latency), CPU spends most of its time switching contexts rather than executing instructions (processor sharing overhead)."
                    }
                ]
            },
            {
                "id": "priority_aging",
                "name": "Priority Scheduling & Aging",
                "category": "Preemptive / Non-preemptive with Dynamic Priority",
                "problem_solved": "Ensures critical high-priority tasks run first while preventing indefinite starvation of low-priority tasks.",
                "procedure": "Select process with highest priority. In aging, incrementally boost the priority of processes that have spent prolonged time waiting in the ready queue.",
                "time_complexity": "O(N) or O(log N) heap",
                "space_complexity": "O(N)",
                "advantages": ["Supports quality of service and critical real-time tasks", "Aging eliminates starvation"],
                "limitations": ["Without aging, low-priority processes can starve forever in heavily loaded systems"],
                "edge_cases": ["Priority inversion where a low-priority process holding a lock blocks a high-priority process"],
                "viva_questions": [
                    {
                        "q": "What is starvation and how does aging mitigate it?",
                        "a": "Starvation (indefinite blocking) occurs when low-priority ready processes never get CPU time because higher-priority jobs keep arriving. Aging gradually increases the priority of waiting processes as time passes, guaranteeing they will eventually attain the highest priority and execute."
                    }
                ]
            }
        ]
    },
    "memory_management": {
        "title": "Memory Allocation & Fragmentation",
        "description": "Techniques for managing contiguous physical memory partitions and mitigating internal and external fragmentation.",
        "concepts": [
            {
                "id": "first_best_worst_fit",
                "name": "First Fit, Best Fit, and Worst Fit",
                "category": "Contiguous Allocation Strategies",
                "procedure": "First Fit searches from start and allocates first hole >= request. Best Fit scans all holes and allocates smallest hole >= request. Worst Fit scans all holes and allocates largest hole.",
                "advantages": ["First Fit is fastest and has good storage utilization", "Best Fit minimizes immediate leftover space"],
                "limitations": ["Best Fit creates tiny unusable leftover slivers", "Worst Fit breaks up the largest available blocks quickly"],
                "viva_questions": [
                    {
                        "q": "Distinguish between internal and external fragmentation.",
                        "a": "Internal fragmentation occurs in fixed partitioning when allocated memory is larger than requested memory; the unused space inside the partition cannot be used by any other process. External fragmentation occurs when total free memory exists to satisfy a request, but it is broken into non-contiguous blocks."
                    },
                    {
                        "q": "How does memory compaction resolve external fragmentation?",
                        "a": "Compaction shuffles all allocated memory blocks together to place all free memory in one large contiguous block. It requires dynamic relocatable code with base and limit registers."
                    }
                ]
            }
        ]
    },
    "page_replacement": {
        "title": "Virtual Memory & Page Replacement",
        "description": "Algorithms invoked by the OS page fault handler to decide which memory frame to evict when all physical frames are occupied.",
        "concepts": [
            {
                "id": "fifo_lru_lfu",
                "name": "FIFO, LRU, and LFU",
                "procedure": "FIFO evicts the oldest resident frame. LRU evicts the frame that has not been accessed for the longest time. LFU evicts the frame with the lowest total access frequency count.",
                "advantages": ["LRU closely approximates the optimal Belady algorithm using the principle of locality of reference"],
                "limitations": ["LRU requires hardware assistance (stack or timestamp registers) to avoid high overhead", "FIFO suffers from Belady's Anomaly"],
                "viva_questions": [
                    {
                        "q": "What is Belady's Anomaly?",
                        "a": "Belady's Anomaly is the counter-intuitive phenomenon where increasing the number of page frames leads to MORE page faults under FIFO page replacement. It occurs because FIFO is not a stack algorithm."
                    },
                    {
                        "q": "Why is the Optimal Page Replacement Algorithm (OPT/MIN) impossible in general practice?",
                        "a": "OPT evicts the page that will not be used for the longest period in future time. Because general-purpose operating systems cannot predict the future reference string, OPT serves as an unreachable theoretical benchmark."
                    }
                ]
            }
        ]
    },
    "deadlock": {
        "title": "Deadlock & Banker's Algorithm",
        "description": "Techniques for preventing, avoiding, detecting, and recovering from resource deadlocks.",
        "concepts": [
            {
                "id": "coffman_conditions",
                "name": "Four Coffman Conditions for Deadlock",
                "procedure": "Deadlock can occur if and only if all four conditions hold simultaneously: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait.",
                "viva_questions": [
                    {
                        "q": "What is the difference between Deadlock Avoidance and Deadlock Detection?",
                        "a": "Avoidance (like Banker's algorithm) dynamically examines every resource request and ensures the system remains in a SAFE state before granting it. Detection allows allocation without check, and periodically runs an algorithm to inspect if deadlock has already occurred."
                    },
                    {
                        "q": "Is an UNSAFE state synonymous with a DEADLOCKED state?",
                        "a": "No! All deadlocked states are unsafe, but not all unsafe states are deadlocked. An unsafe state merely means the system cannot guarantee that all processes will finish without deadlock if all claim their maximum demands."
                    }
                ]
            }
        ]
    },
    "disk_scheduling": {
        "title": "Disk Scheduling Algorithms",
        "description": "Algorithms designed to optimize seek time and head travel across magnetic disk tracks.",
        "concepts": [
            {
                "id": "scan_cscan_look",
                "name": "SCAN, C-SCAN, LOOK, and C-LOOK",
                "procedure": "SCAN moves head in one direction servicing requests until disk boundary, then reverses. C-SCAN goes to boundary, immediately returns to opposite boundary without servicing, providing uniform wait time. LOOK and C-LOOK reverse at the furthest request rather than touching disk boundaries.",
                "viva_questions": [
                    {
                        "q": "How does LOOK differ from SCAN?",
                        "a": "SCAN travels all the way to the end boundary of the disk regardless of whether any requests exist there. LOOK checks ahead and reverses direction as soon as the furthest request in the current direction is serviced."
                    },
                    {
                        "q": "Why does C-SCAN provide more uniform waiting times than SCAN?",
                        "a": "In SCAN, cylinders near the center get serviced twice per cycle (once going up, once going down), whereas cylinders near edges get serviced once. C-SCAN always sweeps in one direction, treating cylinders as a circular list, ensuring all tracks wait approximately the same duration."
                    }
                ]
            }
        ]
    }
}

QUIZ_QUESTION_BANK = [
    {
        "id": "q1",
        "topic": "cpu_scheduling",
        "question": "Which of the following scheduling algorithms is provably optimal in minimizing average waiting time for independent processes arriving simultaneously?",
        "options": [
            "First Come, First Served (FCFS)",
            "Shortest Job First (SJF - Non-preemptive)",
            "Round Robin (RR)",
            "Priority Scheduling"
        ],
        "correct_index": 1,
        "explanation": "Shortest Job First (SJF) is provably optimal for minimizing average waiting time because moving a shorter job ahead of a longer job decreases the waiting time of the shorter job more than it increases the waiting time of the longer job."
    },
    {
        "id": "q2",
        "topic": "cpu_scheduling",
        "question": "In Round Robin scheduling, what happens if the time quantum is chosen to be extremely small (e.g. 1 microsecond)?",
        "options": [
            "Throughput reaches theoretical maximum",
            "System degenerates into FCFS scheduling",
            "Context-switch overhead dominates and CPU utilization plummets",
            "Turnaround time becomes zero"
        ],
        "correct_index": 2,
        "explanation": "If the quantum is too small, the CPU spends most of its time performing register context switches and scheduler operations rather than executing user process instructions."
    },
    {
        "id": "q3",
        "topic": "page_replacement",
        "question": "Under which page replacement algorithm can Belady's Anomaly occur?",
        "options": [
            "Least Recently Used (LRU)",
            "Optimal Page Replacement (OPT)",
            "First-In, First-Out (FIFO)",
            "Most Recently Used (MRU)"
        ],
        "correct_index": 2,
        "explanation": "Belady's Anomaly occurs in FIFO because FIFO is not a stack algorithm. Stack algorithms like LRU and OPT never suffer from Belady's anomaly."
    },
    {
        "id": "q4",
        "topic": "deadlock",
        "question": "In Banker's Algorithm, what does a system being in an 'UNSAFE' state signify?",
        "options": [
            "A deadlock is currently active and processes are frozen",
            "There is no guaranteed execution sequence where every process can complete under maximum resource demand",
            "Memory corruption has occurred in the kernel",
            "Available resources are strictly equal to zero"
        ],
        "correct_index": 1,
        "explanation": "An unsafe state is not necessarily deadlocked. It simply means the OS cannot guarantee that deadlock will not occur if every process demands its declared maximum claim."
    },
    {
        "id": "q5",
        "topic": "synchronization",
        "question": "In the Dining Philosophers problem, how does an asymmetric solution (e.g. odd philosophers pick left first, even pick right first) prevent deadlock?",
        "options": [
            "By eliminating the Mutual Exclusion condition",
            "By eliminating the Hold and Wait condition",
            "By breaking the Circular Wait condition",
            "By preempting philosophers' meals"
        ],
        "correct_index": 2,
        "explanation": "Asymmetric fork picking guarantees that at least one adjacent pair of philosophers will compete for the same fork first, breaking the symmetric dependency cycle and eliminating the Circular Wait condition."
    },
    {
        "id": "q6",
        "topic": "disk_scheduling",
        "question": "How does LOOK differ from SCAN disk scheduling?",
        "options": [
            "LOOK services requests in random order",
            "LOOK only travels as far as the last request in the current direction, instead of traveling all the way to the disk boundary",
            "LOOK only moves in one circular direction",
            "LOOK ignores cylinder numbers"
        ],
        "correct_index": 1,
        "explanation": "SCAN travels all the way to cylinder 0 or the maximum disk boundary (e.g. 199). LOOK checks ahead and reverses direction as soon as the last request in that direction has been serviced."
    },
    {
        "id": "q7",
        "topic": "memory_management",
        "question": "Which dynamic memory allocation strategy typically creates many tiny, unusable leftover slivers of free memory across the address space?",
        "options": [
            "First Fit",
            "Best Fit",
            "Worst Fit",
            "Next Fit"
        ],
        "correct_index": 1,
        "explanation": "Best Fit allocates the smallest hole that fits the request, leaving tiny leftover fragments that are often too small to satisfy any future requests, worsening external fragmentation."
    },
    {
        "id": "q8",
        "topic": "cpu_scheduling",
        "question": "How does Priority Scheduling with Aging prevent process starvation?",
        "options": [
            "By decreasing process burst times over time",
            "By periodically increasing the priority of processes waiting in the ready queue",
            "By switching to FCFS mode",
            "By aborting high priority processes"
        ],
        "correct_index": 1,
        "explanation": "Aging gradually increments the effective priority of waiting processes in the ready queue. Eventually, their priority becomes high enough that they are guaranteed CPU execution."
    }
]


def get_topics_and_concepts() -> Dict[str, Any]:
    """Retrieve full educational syllabus and knowledge base."""
    return TOPICS_KNOWLEDGE_BASE


def get_quiz_questions(topic: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve quiz questions, optionally filtered by topic."""
    if topic:
        return [q for q in QUIZ_QUESTION_BANK if q["topic"] == topic]
    return QUIZ_QUESTION_BANK


def evaluate_quiz_submission(answers: Dict[str, int]) -> Dict[str, Any]:
    """
    Evaluate user quiz answers.
    answers: dict mapping question_id -> chosen_index
    """
    total = len(QUIZ_QUESTION_BANK)
    correct_count = 0
    results = []
    topic_breakdown: Dict[str, Dict[str, int]] = {}

    for q in QUIZ_QUESTION_BANK:
        qid = q["id"]
        chosen = answers.get(qid)
        is_correct = (chosen == q["correct_index"])
        if is_correct:
            correct_count += 1

        topic = q["topic"]
        if topic not in topic_breakdown:
            topic_breakdown[topic] = {"correct": 0, "total": 0}
        topic_breakdown[topic]["total"] += 1
        if is_correct:
            topic_breakdown[topic]["correct"] += 1

        results.append({
            "id": qid,
            "topic": topic,
            "question": q["question"],
            "chosen_index": chosen,
            "correct_index": q["correct_index"],
            "is_correct": is_correct,
            "explanation": q["explanation"]
        })

    score_pct = round((correct_count / total) * 100, 2) if total > 0 else 0

    return {
        "total_questions": total,
        "correct_count": correct_count,
        "score_percentage": score_pct,
        "results": results,
        "topic_breakdown": topic_breakdown
    }


def generate_contextual_explanation(module: str, simulation_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate contextual analysis for an actual simulation result.
    """
    mod = module.lower()
    if mod == "cpu_scheduling":
        algo = simulation_result.get("algorithm", "Unknown")
        avg_wt = simulation_result.get("avg_waiting_time", 0)
        avg_tat = simulation_result.get("avg_turnaround_time", 0)
        cs = simulation_result.get("context_switches", 0)
        procs = simulation_result.get("processes", [])

        summary = (
            f"Under {algo}, the simulation completed {len(procs)} processes with an average waiting time of {avg_wt} units "
            f"and average turnaround time of {avg_tat} units. {cs} context switch(es) occurred."
        )
        points = [
            f"Processes scheduled: {', '.join([p['name'] for p in procs])}.",
            f"CPU Utilization achieved: {simulation_result.get('cpu_utilization', 0)}%.",
            f"Throughput: {simulation_result.get('throughput', 0)} processes per unit time."
        ]
        return {"summary": summary, "key_points": points}

    elif mod == "page_replacement":
        algo = simulation_result.get("algorithm", "Unknown")
        faults = simulation_result.get("page_faults", 0)
        hits = simulation_result.get("page_hits", 0)
        hit_ratio = simulation_result.get("hit_ratio", 0)

        summary = f"{algo} processed {simulation_result.get('total_references', 0)} references resulting in {faults} page faults and {hits} page hits (Hit Ratio: {hit_ratio}%)."
        points = [
            f"Page faults occurred on {simulation_result.get('fault_rate', 0)}% of references.",
            f"Total physical frames allocated: {simulation_result.get('num_frames', 0)}."
        ]
        return {"summary": summary, "key_points": points}

    elif mod == "deadlock":
        is_safe = simulation_result.get("is_safe", False)
        seq = simulation_result.get("safe_sequence", [])
        if is_safe:
            summary = f"System is verified in a SAFE state. Safe execution sequence found: {' -> '.join(seq)}."
            points = [
                "Every process can successfully acquire maximum demand and terminate.",
                "Banker's safety condition satisfied."
            ]
        else:
            summary = "UNSAFE STATE DETECTED: System cannot guarantee forward progress without deadlock."
            points = [
                f"Blocked processes: {', '.join(simulation_result.get('blocked_processes', []))}.",
                "Resource demand exceeds remaining available work vector."
            ]
        return {"summary": summary, "key_points": points}

    elif mod == "disk_scheduling":
        algo = simulation_result.get("algorithm", "Unknown")
        tot = simulation_result.get("total_head_movement", 0)
        avg = simulation_result.get("average_head_movement", 0)
        summary = f"{algo} serviced all requests with total head movement of {tot} cylinders (average {avg} cylinders per request)."
        points = [
            f"Starting cylinder: {simulation_result.get('initial_head', 0)}.",
            f"Trajectory: {' -> '.join(map(str, simulation_result.get('visited_sequence', [])))}."
        ]
        return {"summary": summary, "key_points": points}

    return {
        "summary": "Simulation completed successfully.",
        "key_points": ["Review intermediate steps in timeline."]
    }
