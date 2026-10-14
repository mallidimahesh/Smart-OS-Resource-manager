# Smart Operating System Resource Manager
## Advanced Full-Stack OS Simulation Laboratory (40-Mark Undergraduate Project)

A professional, fully functional, full-stack Operating Systems Simulation and Resource Management Laboratory. Designed to bridge theoretical operating systems curricula with interactive, mathematically verified simulations, real-time telemetry visualizations, persistent experimentation, and automated Viva Voce exam preparation.

---

## 🚀 Key Feature Highlights

### 1. Interactive Dashboard & Simulated System Monitor
- **Telemetry Monitor**: Tracks total simulated processes, completed workloads, CPU utilization, throughput, average waiting/turnaround/response times, memory utilization, page fault rates, and disk seek distances.
- **Analytics Visualizations**: Interactive Recharts graphs displaying laboratory activity by module and algorithm popularity distribution.
- **Persistent Activity Stream**: Recent experiment history loaded directly from SQLite database records.

### 2. Process Manager
- **Process Creation & PCB Attributes**: Configure Process ID (PID), arrival time, burst time, priority, and memory requirements.
- **Full Lifecycle Support**: Models transitions through `NEW` ➔ `READY` ➔ `RUNNING` ➔ `WAITING` ➔ `TERMINATED`.
- **Search, Sorting & Presets**: Filter workloads by state or keyword; load benchmark datasets or starvation edge cases with one click.

### 3. CPU Scheduling Lab
- **7 Authoritative Algorithms**:
  1. First Come, First Served (FCFS)
  2. Shortest Job First, non-preemptive (SJF)
  3. Shortest Remaining Time First, preemptive (SRTF)
  4. Priority Scheduling, non-preemptive
  5. Priority Scheduling, preemptive
  6. Round Robin (RR) with configurable time slice ($q$)
  7. Priority Scheduling with Aging (prevents starvation by boosting priority over time)
- **Interactive Execution Gantt Chart**: Highlights execution slices, process colors, idle intervals, and context-switch latency.
- **Step-by-Step Playback Engine**: True state restoration supporting Play, Pause, Next Step, Previous Step, Reset, and speed adjustment (0.5x, 1x, 2x, 4x).
- **Exact Metric Accounting**:
  - $\text{Turnaround Time (TAT)} = \text{Completion Time (CT)} - \text{Arrival Time (AT)}$
  - $\text{Waiting Time (WT)} = \text{Turnaround Time (TAT)} - \text{Burst Time (BT)}$
  - $\text{Response Time (RT)} = \text{First CPU Start Time} - \text{Arrival Time (AT)}$
  - $\text{CPU Utilization} = (\text{Busy Time} / \text{Total Simulation Time}) \times 100$
  - $\text{Throughput} = \text{Completed Processes} / \text{Total Simulation Time}$

### 4. Memory Allocation Lab
- **3 Dynamic Allocation Policies**: First Fit, Best Fit, and Worst Fit.
- **Partitioning Schemes**: Variable partitioning (with block splitting and coalescing of adjacent free holes) and Fixed partitioning.
- **Proportional Physical Address Space Map**: Visual address blocks distinguishing allocated space, free space, and internal fragmentation.
- **Fragmentation Analysis**: Accurate calculation of external and internal fragmentation.
- **Side-by-Side Comparison**: Evaluate all 3 fits simultaneously on the exact same allocation/deallocation sequence.

### 5. Virtual Memory & Page Replacement Lab
- **3 Replacement Algorithms**: FIFO (First-In, First-Out), LRU (Least Recently Used), and LFU (Least Frequently Used with FIFO tie-breaker).
- **Physical Frame Grid**: Visual representation of memory frames, resident pages, load timestamps, last-used timestamps, and frequency counts.
- **Hit / Fault Telemetry**: Per-step Hit/Fault indicators, cumulative fault count, hit ratio %, and fault rate %.
- **Belady's Anomaly Demonstration**: Demonstrates the anomaly under FIFO with sequence `[1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]`, proving that increasing frames from 3 to 4 increases page faults from 9 to 10.

### 6. Deadlock & Banker's Algorithm Lab
- **Matrix Validation**: Non-negative checks, consistency between Allocation, Max Demand, Need ($N = M - A$), and Available capacity.
- **Banker's Safety Algorithm**: Step-by-step Work vector updates, eligible process selection, and safe sequence determination.
- **Dynamic Resource Request Simulator**: Validates $Req \le Need$ and $Req \le Available$, tentatively allocates resources, runs safety analysis, and automatically rolls back if unsafe.
- **Deadlock Detection Engine**: Independent detection procedure identifying deadlocked processes when allocation exists without safe completion.
- **Resource Allocation Graph (RAG)**: Visual graph showing process nodes, resource instances, allocation edges, and request edges.

### 7. Process Synchronization Lab
- **Producer–Consumer (Bounded Buffer)**: Configurable buffer capacity with counting semaphores (`mutex`, `empty`, `full`); demonstrates safe bounded synchronization vs. intentional unsafe race conditions.
- **Readers–Writers**: Models concurrent reading with exclusive writing under Reader-Preference and Writer-Preference policies.
- **Dining Philosophers**: 5 philosophers and 5 forks; demonstrates deadlock-free asymmetric resource ordering vs. naive circular wait deadlock.

### 8. Disk Scheduling Lab
- **6 Mandatory Algorithms**: FCFS, SSTF, SCAN (Elevator), C-SCAN, LOOK, and C-LOOK.
- **Magnetic Track Visualizer**: Dynamic cylinder track ruler showing head position, cylinder requests, seek paths, and direction of travel.
- **Seek Distance Telemetry**: Total head movement and average seek distance per request.

### 9. Algorithm Comparison Center
- **Dedicated Benchmarking Module**: Run multi-algorithm comparisons across CPU Scheduling, Memory Allocation, Page Replacement, and Disk Scheduling on standardized workloads.
- **Comparative Charts & Best-Value Highlighting**: Side-by-side Recharts graphs highlighting optimal algorithms based on workload criteria.

### 10. OS Tutor & Viva Voce Practice Mode
- **Theory Knowledge Base**: Complete syllabus definitions, advantages, limitations, edge cases, and viva question bank.
- **Interactive Quiz Mode**: Graded MCQs with instant feedback, explanations, and topic-wise performance breakdowns.
- **Contextual Explanation Engine**: Generates educational insights from actual simulation runs.

### 11. Experiment Persistence, Reports & Exports
- **SQLite Database Persistence**: Save, inspect, rename, duplicate, and delete simulation runs.
- **Real CSV Exports**: Download genuine simulation data formatted for Excel or data analysis tools.
- **Printable Formal Laboratory Reports**: Print-ready layout styled with `@media print` for direct PDF export or paper printing.
- **Per-User Isolation**: Secure JWT authentication ensuring privacy for saved student experiments.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, React Router 7, Tailwind CSS v4, Recharts, Lucide React |
| **Backend** | Python 3.14+, Flask 3.1, SQLAlchemy 2.0, PyJWT, Werkzeug |
| **Database** | SQLite (persistent local storage in `backend/os_manager.db`) |
| **Testing** | Pytest (24 unit tests covering 100% of core algorithms, persistence, and auth) |

---

## 📦 Directory Structure

```
d:/OS Project/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask application factory & blueprint registration
│   │   ├── config.py             # Configuration (DB URI, secret keys, CORS)
│   │   ├── database.py           # SQLAlchemy database instance
│   │   ├── models/               # User, Experiment, SavedComparison, QuizAttempt
│   │   ├── services/             # Deterministic simulation engines:
│   │   │   ├── cpu_scheduler.py
│   │   │   ├── memory_allocator.py
│   │   │   ├── page_replacer.py
│   │   │   ├── banker_deadlock.py
│   │   │   ├── synchronizer.py
│   │   │   ├── disk_scheduler.py
│   │   │   ├── tutor_service.py
│   │   │   └── export_service.py
│   │   └── api/                  # REST API Blueprints:
│   │       ├── auth.py
│   │       ├── scheduling.py
│   │       ├── memory.py
│   │       ├── paging.py
│   │       ├── deadlock.py
│   │       ├── synchronization.py
│   │       ├── disk.py
│   │       ├── comparisons.py
│   │       ├── experiments.py
│   │       ├── analytics.py
│   │       ├── tutor.py
│   │       └── exports.py
│   ├── tests/                    # Pytest test suite (24 tests)
│   ├── seed_data.py              # Initial dataset seeding script
│   ├── requirements.txt          # Python dependencies
│   └── run.py                    # Backend server runner (port 5000)
├── frontend/
│   ├── src/
│   │   ├── api/client.ts         # Centralized API client
│   │   ├── contexts/             # AuthContext, ThemeContext
│   │   ├── types/os.ts           # TypeScript interfaces
│   │   ├── utils/                # Presets & benchmarks
│   │   ├── components/           # GanttChart, PlaybackControls, Visualizers
│   │   ├── pages/                # 13 dedicated lab pages
│   │   ├── App.tsx               # Root routes and layouts
│   │   └── index.css             # Tailwind v4 theme styling
│   ├── package.json
│   └── vite.config.ts            # Vite config with /api proxy
├── pytest.ini                    # Pytest configuration
├── .env.example                  # Environment variable template
└── README.md                     # Documentation
```

---

## 💻 Installation & Quick Start

### Prerequisites
- Python 3.10+ (Tested on Python 3.14.3)
- Node.js v18+ (Tested on Node v24.13.1)
- npm 9+

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# (Optional) Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the SQLite database with benchmark experiments
python seed_data.py

# Start the Flask backend server (runs on http://127.0.0.1:5000)
python run.py
```

### 2. Frontend Setup
In a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Running Automated Tests

Run the complete backend Pytest suite verifying all 24 core tests:
```bash
# From the project root:
python -m pytest
```

### Test Suite Coverage:
- `test_cpu_scheduling.py`: FCFS, SJF, SRTF, Round Robin time slice, priority aging, idle periods, mathematical consistency ($TAT = CT - AT$, $WT = TAT - BT$, $RT = \text{Start} - AT$).
- `test_memory_allocation.py`: First Fit, Best Fit, Worst Fit, dynamic splitting, coalescing, and external fragmentation reporting.
- `test_paging.py`: FIFO, LRU, LFU, and Belady's Anomaly verification (3 frames vs 4 frames).
- `test_deadlock.py`: Banker's safety check, resource requests with rollback, and circular deadlock detection.
- `test_synchronization.py`: Producer-Consumer bounded buffer, safe semaphores vs unsafe race conditions, and Dining Philosophers deadlock avoidance.
- `test_disk_scheduling.py`: FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK head seek distances.
- `test_api_and_auth.py`: User registration, JWT login, experiment persistence, data isolation, and CSV export streaming.

---

## 🔑 Default Credentials for Demonstration

A demo student user is pre-seeded in the database:
- **Username**: `os_scholar`
- **Password**: `os_scholar_2026`

*Note: Guest mode is fully supported. Anyone can use the laboratories and simulate workloads immediately without requiring authentication.*

---

## 📄 License
MIT License. Built for university Operating Systems laboratory coursework and academic demonstrations.
