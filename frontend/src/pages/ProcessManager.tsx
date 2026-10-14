import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessItem } from '../types/os';
import { SAMPLE_CPU_PROCESSES, SAMPLE_AGING_PROCESSES } from '../utils/SampleDataPresets';
import {
  Plus,
  Trash2,
  RefreshCw,
  Play,
  Search,
  Filter,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ProcessManager: React.FC = () => {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<ProcessItem[]>(() => {
    const saved = localStorage.getItem('os_active_processes');
    return saved ? JSON.parse(saved) : SAMPLE_CPU_PROCESSES;
  });

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');

  // New process form
  const [pid, setPid] = useState(`${processes.length + 1}`);
  const [name, setName] = useState(`Process ${processes.length + 1}`);
  const [arrivalTime, setArrivalTime] = useState(0);
  const [burstTime, setBurstTime] = useState(4);
  const [priority, setPriority] = useState(1);
  const [memReq, setMemReq] = useState(128);
  const [formError, setFormError] = useState('');

  const syncProcesses = (updated: ProcessItem[]) => {
    setProcesses(updated);
    localStorage.setItem('os_active_processes', JSON.stringify(updated));
  };

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!pid.trim()) {
      setFormError('Process ID is required.');
      return;
    }
    if (processes.some((p) => p.pid === pid.trim())) {
      setFormError(`Process ID "${pid}" already exists.`);
      return;
    }
    if (arrivalTime < 0) {
      setFormError('Arrival time must be >= 0.');
      return;
    }
    if (burstTime <= 0) {
      setFormError('Burst time must be > 0.');
      return;
    }

    const newProc: ProcessItem = {
      pid: pid.trim(),
      name: name.trim() || `P${pid.trim()}`,
      arrival_time: Number(arrivalTime),
      burst_time: Number(burstTime),
      priority: Number(priority),
      memory_requirement: Number(memReq),
      state: 'NEW',
    };

    const updated = [...processes, newProc];
    syncProcesses(updated);

    // Reset inputs
    setPid(`${updated.length + 1}`);
    setName(`Process ${updated.length + 1}`);
    setArrivalTime(0);
    setBurstTime(4);
    setPriority(1);
  };

  const handleDelete = (delPid: string) => {
    syncProcesses(processes.filter((p) => p.pid !== delPid));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all processes?')) {
      syncProcesses([]);
    }
  };

  const handleLoadSample = (sample: ProcessItem[]) => {
    syncProcesses(sample);
  };

  const handleSendToScheduler = () => {
    localStorage.setItem('os_active_processes', JSON.stringify(processes));
    navigate('/cpu-scheduling');
  };

  const filteredProcesses = processes.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.pid.toLowerCase().includes(search.toLowerCase());
    const matchState = stateFilter === 'ALL' || p.state === stateFilter;
    return matchSearch && matchState;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-cyan-400" />
            Process Management Module
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, inspect, and configure simulated processes, lifecycle states, and PCB attributes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLoadSample(SAMPLE_CPU_PROCESSES)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            Load Standard Benchmark
          </button>
          <button
            onClick={() => handleLoadSample(SAMPLE_AGING_PROCESSES)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            Load Starvation Dataset
          </button>
          <button
            onClick={handleSendToScheduler}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
          >
            <span>Run in CPU Lab</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Process Lifecycle Flow Diagram */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
          Process Control Block (PCB) Lifecycle Transitions
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-slate-400"></span>
            <strong>NEW</strong>: Process admitted
          </div>
          <span className="text-slate-500">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-800 text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-400"></span>
            <strong>READY</strong>: In CPU ready queue
          </div>
          <span className="text-slate-500">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <strong>RUNNING</strong>: CPU allocated
          </div>
          <span className="text-slate-500">⇄</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800 text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400"></span>
            <strong>WAITING</strong>: Blocked on I/O / resource
          </div>
          <span className="text-slate-500">→</span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-400"></span>
            <strong>TERMINATED</strong>: Execution complete
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creation Form */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl h-fit">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-cyan-400" />
            Create Process
          </h2>

          {formError && (
            <div className="mb-4 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddProcess} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Process ID (PID)</label>
              <input
                type="text"
                value={pid}
                onChange={(e) => setPid(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                placeholder="e.g. 1, P1"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Process Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400"
                placeholder="e.g. Web Worker"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Arrival Time</label>
                <input
                  type="number"
                  min="0"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Burst Time</label>
                <input
                  type="number"
                  min="1"
                  value={burstTime}
                  onChange={(e) => setBurstTime(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Priority</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Memory Req (KB)</label>
                <input
                  type="number"
                  min="1"
                  value={memReq}
                  onChange={(e) => setMemReq(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add to Workload</span>
            </button>
          </form>
        </div>

        {/* Process Table */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                  Process Workload Queue ({processes.length})
                </h2>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search processes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={handleClearAll}
                  disabled={processes.length === 0}
                  className="p-1.5 text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg disabled:opacity-30 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">PID</th>
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Arrival</th>
                    <th className="py-2.5 px-3">Burst</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Memory</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredProcesses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 font-sans">
                        No processes in workload. Add a process or load a benchmark dataset.
                      </td>
                    </tr>
                  ) : (
                    filteredProcesses.map((p) => (
                      <tr key={p.pid} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 px-3 font-bold text-cyan-400">{p.pid}</td>
                        <td className="py-2 px-3 font-sans font-medium text-slate-200">{p.name}</td>
                        <td className="py-2 px-3 text-slate-300">{p.arrival_time}</td>
                        <td className="py-2 px-3 text-slate-300">{p.burst_time}</td>
                        <td className="py-2 px-3 text-slate-300">{p.priority ?? 1}</td>
                        <td className="py-2 px-3 text-slate-400">{p.memory_requirement ?? 128} KB</td>
                        <td className="py-2 px-3 text-right font-sans">
                          <button
                            onClick={() => handleDelete(p.pid)}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                            title="Delete process"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Total Burst Workload: {processes.reduce((acc, p) => acc + p.burst_time, 0)} units</span>
            <span>Total Memory Required: {processes.reduce((acc, p) => acc + (p.memory_requirement || 0), 0)} KB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
