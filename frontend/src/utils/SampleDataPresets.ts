export const SAMPLE_CPU_PROCESSES = [
  { pid: '1', name: 'Web Server', arrival_time: 0, burst_time: 7, priority: 2, memory_requirement: 128 },
  { pid: '2', name: 'DB Service', arrival_time: 2, burst_time: 4, priority: 1, memory_requirement: 256 },
  { pid: '3', name: 'File Backup', arrival_time: 4, burst_time: 1, priority: 3, memory_requirement: 64 },
  { pid: '4', name: 'UI Renderer', arrival_time: 5, burst_time: 4, priority: 2, memory_requirement: 96 },
];

export const SAMPLE_AGING_PROCESSES = [
  { pid: '1', name: 'High Prio Kernel', arrival_time: 0, burst_time: 12, priority: 1, memory_requirement: 64 },
  { pid: '2', name: 'Starving Batch Job', arrival_time: 0, burst_time: 4, priority: 8, memory_requirement: 128 },
  { pid: '3', name: 'Arriving Prio Task', arrival_time: 4, burst_time: 6, priority: 2, memory_requirement: 64 },
];

export const SAMPLE_MEMORY_BLOCKS = [
  { size: 100 },
  { size: 500 },
  { size: 200 },
  { size: 300 },
  { size: 600 },
];

export const SAMPLE_MEMORY_OPERATIONS = [
  { type: 'ALLOCATE' as const, pid: 'Kernel Core', size: 212 },
  { type: 'ALLOCATE' as const, pid: 'DBMS Cache', size: 417 },
  { type: 'ALLOCATE' as const, pid: 'Audio Driver', size: 112 },
  { type: 'ALLOCATE' as const, pid: 'Graphic Buffer', size: 426 },
  { type: 'DEALLOCATE' as const, pid: 'Kernel Core' },
  { type: 'ALLOCATE' as const, pid: 'Network Stack', size: 150 },
];

export const SAMPLE_PAGE_REFERENCES = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2, 1, 2, 0, 1, 7, 0, 1];
export const BELADY_ANOMALY_REFERENCES = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];

export const SAMPLE_BANKER_DATA = {
  processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
  resources: ['A (CPU)', 'B (RAM)', 'C (Disk)'],
  total_resources: [10, 5, 7],
  allocation: [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2],
  ],
  max_demand: [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3],
  ],
};

export const SAMPLE_DISK_REQUESTS = [98, 183, 37, 122, 14, 124, 65, 67];
export const SAMPLE_INITIAL_HEAD = 53;
