export interface ProcessItem {
  pid: string;
  name: string;
  arrival_time: number;
  burst_time: number;
  priority?: number;
  memory_requirement?: number;
  state?: 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';
  start_time?: number;
  completion_time?: number;
  turnaround_time?: number;
  waiting_time?: number;
  response_time?: number;
  remaining_time?: number;
  current_priority?: number;
}

export interface GanttInterval {
  pid: string;
  name: string;
  start_time: number;
  end_time: number;
  is_idle: boolean;
  is_cs: boolean;
}

export interface SimulationSnapshot {
  step: number;
  time?: number;
  current_interval?: GanttInterval | null;
  running_pid?: string | null;
  running_name?: string;
  is_idle?: boolean;
  is_cs?: boolean;
  gantt_slice?: GanttInterval[];
  explanation?: string;
  [key: string]: any;
}

export interface CPUSimulationResult {
  algorithm: string;
  total_time: number;
  busy_time: number;
  context_switches: number;
  cpu_utilization: number;
  throughput: number;
  avg_turnaround_time: number;
  avg_waiting_time: number;
  avg_response_time: number;
  processes: ProcessItem[];
  gantt_chart: GanttInterval[];
  snapshots: SimulationSnapshot[];
  events: Array<{ time: number; type: string; description: string }>;
}

export interface MemoryBlock {
  block_id: number;
  start: number;
  size: number;
  is_free: boolean;
  pid: string | null;
  internal_fragmentation: number;
}

export interface MemoryOperation {
  type: 'ALLOCATE' | 'DEALLOCATE';
  pid: string;
  size?: number;
}

export interface MemorySimulationResult {
  algorithm: string;
  is_fixed_partition: boolean;
  initial_blocks: Array<{ size: number }>;
  final_blocks: MemoryBlock[];
  snapshots: Array<{
    step: number;
    operation: any;
    blocks: MemoryBlock[];
    stats: {
      total_memory: number;
      allocated_memory: number;
      free_memory: number;
      utilization: number;
      internal_fragmentation: number;
      external_fragmentation: number;
    };
    explanation: string;
    success: boolean;
    chosen_block?: number | null;
    [key: string]: any;
  }>;
  logs: Array<{ step: number; pid: string; type: string; text: string }>;
  successful_allocations: number;
  failed_allocations: number;
  final_stats: {
    total_memory: number;
    allocated_memory: number;
    free_memory: number;
    utilization: number;
    internal_fragmentation: number;
    external_fragmentation: number;
    block_count: number;
  };
}

export interface PageFrame {
  frame_id: number;
  page: number | null;
  load_step: number;
  last_used: number;
  freq: number;
}

export interface PageStep {
  step: number;
  page: number;
  is_hit: boolean;
  replaced_page: number | null;
  target_frame: number;
  frames: PageFrame[];
  fault_count: number;
  hit_count: number;
  hit_ratio: number;
  fault_rate: number;
  reason: string;
}

export interface PagingSimulationResult {
  algorithm: string;
  num_frames: number;
  reference_string: number[];
  total_references: number;
  page_faults: number;
  page_hits: number;
  hit_ratio: number;
  fault_rate: number;
  steps: PageStep[];
}

export interface DiskStep {
  step: number;
  from_track: number;
  to_track: number;
  distance: number;
  total_distance: number;
  serviced: boolean;
  is_jump?: boolean;
  explanation: string;
}

export interface DiskSimulationResult {
  algorithm: string;
  initial_head: number;
  disk_size: number;
  direction: string;
  requests: number[];
  total_head_movement: number;
  average_head_movement: number;
  visited_sequence: number[];
  serviced_requests: number[];
  steps: DiskStep[];
}

export interface BankerSafetyResult {
  is_safe: boolean;
  safe_sequence: string[];
  steps: Array<{
    step: number;
    action: string;
    work: number[];
    finish: boolean[];
    selected_process: string | null;
    explanation: string;
    [key: string]: any;
  }>;
  final_work: number[];
  blocked_processes: string[];
  explanation: string;
}

export interface ExperimentRecord {
  id: number;
  user_id: number | null;
  title: string;
  module: string;
  algorithm: string;
  input_data: any;
  result_data: any;
  metrics: any;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  theme: string;
  settings: Record<string, any>;
  created_at: string;
}
