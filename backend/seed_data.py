"""
Seed script to populate initial sample experiments and demo user.
"""

import json
from app import create_app
from app.database import db
from app.models.user import User
from app.models.experiment import Experiment, SavedComparison
from app.services.cpu_scheduler import run_cpu_scheduling
from app.services.memory_allocator import run_memory_allocation
from app.services.page_replacer import run_page_replacement
from app.services.disk_scheduler import run_disk_scheduling

app = create_app()

with app.app_context():
    # Create demo student user if not exists
    student = User.query.filter_by(username="os_scholar").first()
    if not student:
        student = User(username="os_scholar", email="scholar@os-lab.edu", theme="dark")
        student.set_password("os_scholar_2026")
        db.session.add(student)
        db.session.commit()
        print("Created demo user: os_scholar")

    # Only seed if no experiments exist yet
    if Experiment.query.count() == 0:
        print("Seeding initial experiments...")

        # 1. CPU Scheduling Experiment (FCFS)
        procs_fcfs = [
            {"pid": "1", "name": "Web Server", "arrival_time": 0, "burst_time": 6, "priority": 2},
            {"pid": "2", "name": "DB Query", "arrival_time": 2, "burst_time": 4, "priority": 1},
            {"pid": "3", "name": "File Sync", "arrival_time": 4, "burst_time": 2, "priority": 3},
            {"pid": "4", "name": "UI Thread", "arrival_time": 6, "burst_time": 5, "priority": 1},
        ]
        res_fcfs = run_cpu_scheduling(procs_fcfs, "FCFS")
        exp1 = Experiment(
            user_id=student.id,
            title="Benchmark 1: FCFS Core Workload",
            module="cpu_scheduling",
            algorithm="FCFS",
            input_data=json.dumps({"processes": procs_fcfs, "algorithm": "FCFS"}),
            result_data=json.dumps(res_fcfs),
            metrics=json.dumps({
                "avg_waiting_time": res_fcfs["avg_waiting_time"],
                "avg_turnaround_time": res_fcfs["avg_turnaround_time"],
                "avg_response_time": res_fcfs["avg_response_time"],
                "cpu_utilization": res_fcfs["cpu_utilization"],
                "throughput": res_fcfs["throughput"]
            })
        )
        db.session.add(exp1)

        # 2. CPU Scheduling Experiment (Round Robin)
        res_rr = run_cpu_scheduling(procs_fcfs, "ROUND_ROBIN", time_quantum=2)
        exp2 = Experiment(
            user_id=student.id,
            title="Benchmark 2: Round Robin (Quantum=2)",
            module="cpu_scheduling",
            algorithm="ROUND_ROBIN",
            input_data=json.dumps({"processes": procs_fcfs, "algorithm": "ROUND_ROBIN", "time_quantum": 2}),
            result_data=json.dumps(res_rr),
            metrics=json.dumps({
                "avg_waiting_time": res_rr["avg_waiting_time"],
                "avg_turnaround_time": res_rr["avg_turnaround_time"],
                "avg_response_time": res_rr["avg_response_time"],
                "cpu_utilization": res_rr["cpu_utilization"],
                "throughput": res_rr["throughput"]
            })
        )
        db.session.add(exp2)

        # 3. Memory Allocation Experiment (Best Fit)
        mem_blocks = [{"size": 100}, {"size": 500}, {"size": 200}, {"size": 300}, {"size": 600}]
        mem_ops = [
            {"type": "ALLOCATE", "pid": "Kernel Task", "size": 212},
            {"type": "ALLOCATE", "pid": "Renderer", "size": 417},
            {"type": "ALLOCATE", "pid": "Audio Buff", "size": 112},
        ]
        res_mem = run_memory_allocation(mem_blocks, mem_ops, "BEST_FIT")
        exp3 = Experiment(
            user_id=student.id,
            title="Heap Allocation: Best Fit Test",
            module="memory_allocation",
            algorithm="BEST_FIT",
            input_data=json.dumps({"initial_blocks": mem_blocks, "operations": mem_ops, "algorithm": "BEST_FIT"}),
            result_data=json.dumps(res_mem),
            metrics=json.dumps({
                "utilization": res_mem["final_stats"]["utilization"],
                "free_memory": res_mem["final_stats"]["free_memory"],
                "successful_allocations": res_mem["successful_allocations"],
                "failed_allocations": res_mem["failed_allocations"]
            })
        )
        db.session.add(exp3)

        # 4. Page Replacement Experiment (LRU)
        pages = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1]
        res_paging = run_page_replacement(pages, num_frames=3, algorithm="LRU")
        exp4 = Experiment(
            user_id=student.id,
            title="Locality of Reference: LRU 3-Frame Simulation",
            module="page_replacement",
            algorithm="LRU",
            input_data=json.dumps({"reference_string": pages, "num_frames": 3, "algorithm": "LRU"}),
            result_data=json.dumps(res_paging),
            metrics=json.dumps({
                "hit_ratio": res_paging["hit_ratio"],
                "fault_rate": res_paging["fault_rate"],
                "page_faults": res_paging["page_faults"],
                "page_hits": res_paging["page_hits"]
            })
        )
        db.session.add(exp4)

        # 5. Disk Scheduling Experiment (SSTF)
        disk_reqs = [98, 183, 37, 122, 14, 124, 65, 67]
        res_disk = run_disk_scheduling(disk_reqs, initial_head=53, algorithm="SSTF")
        exp5 = Experiment(
            user_id=student.id,
            title="Cylinder Seek: SSTF Evaluation",
            module="disk_scheduling",
            algorithm="SSTF",
            input_data=json.dumps({"requests": disk_reqs, "initial_head": 53, "algorithm": "SSTF"}),
            result_data=json.dumps(res_disk),
            metrics=json.dumps({
                "total_head_movement": res_disk["total_head_movement"],
                "average_head_movement": res_disk["average_head_movement"]
            })
        )
        db.session.add(exp5)

        db.session.commit()
        print("Seeding completed successfully!")
    else:
        print("Database already contains experiments. Skipping seed.")
