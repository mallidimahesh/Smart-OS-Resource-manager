import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ProcessItem, CPUSimulationResult } from '../types/os';
import { SAMPLE_CPU_PROCESSES, SAMPLE_AGING_PROCESSES } from '../utils/SampleDataPresets';
import { GanttChart } from '../components/GanttChart';
import { PlaybackControls } from '../components/PlaybackControls';
import { MetricCard } from '../components/MetricCard';
import { EventLog } from '../components/EventLog';
import {
  Cpu,
  Play,
  RotateCcw,
  Save,
  Download,
  HelpCircle,
  Clock,
  Activity,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

export const CPUSchedulingLab: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>(() => {
    const saved = localStorage.getItem('os_active_processes');
    return saved ? JSON.parse(saved) : SAMPLE_CPU_PROCESSES;
  });

  const [algorithm, setAlgorithm] = useState<string>('ROUND_ROBIN');
  const [timeQuantum, setTimeQuantum] = useState<number>(2);
  const [agingInterval, setAgingInterval] = useState<number>(3);
  const [lowerIsHigher, setLowerIsHigher] = useState<boolean>(true);
  const [csOverhead, setCsOverhead] = useState<number>(0);

  const [result, setResult] = useState<CPUSimulationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Inline Workload Editor State
  const [showProcessEditor, setShowProcessEditor] = useState<boolean>(false);
  const [newPid, setNewPid] = useState<string>(`P${processes.length + 1}`);
  const [newName, setNewName] = useState<string>(`Process ${processes.length + 1}`);
  const [newAt, setNewAt] = useState<number>(0);
  const [newBt, setNewBt] = useState<number>(4);
  const [newPriority, setNewPriority] = useState<number>(1);

  // Playback state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);
  const timerRef = useRef<any>(null);

  // Explanation
  const [explanation, setExplanation] = useState<any>(null);
  const [saveSuccess, setSaveSuccess] = useState<string>('');

  const runSimulation = async (procList?: ProcessItem[]) => {
    const listToRun = procList || processes;
    setLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      const res = await api.scheduling.simulate({
        processes: listToRun,
        algorithm,
        time_quantum: timeQuantum,
        aging_interval: agingInterval,
        lower_is_higher: lowerIsHigher,
        cs_overhead: csOverhead,
      });
      setResult(res);
      setCurrentStep(0);
      setIsPlaying(false);

      // Fetch contextual explanation
      const exp = await api.tutor.explain('cpu_scheduling', res);
      setExplanation(exp);
    } catch (err: any) {
      setError(err.message || 'Simulation error.');
    } finally {
      setLoading(false);
    }
  };

  const updateProcessList = (updated: ProcessItem[]) => {
    setProcesses(updated);
    localStorage.setItem('os_active_processes', JSON.stringify(updated));
    runSimulation(updated);
  };

  const handleProcessChange = (index: number, field: keyof ProcessItem, value: any) => {
    const updated = [...processes];
    updated[index] = { ...updated[index], [field]: value };
    updateProcessList(updated);
  };

  const handleDeleteProcess = (index: number) => {
    if (processes.length <= 1) {
      setError('At least one process is required for CPU scheduling.');
      return;
    }
    const updated = processes.filter((_, i) => i !== index);
    setNewPid(`P${updated.length + 1}`);
    setNewName(`Process ${updated.length + 1}`);
    updateProcessList(updated);
  };

  const handleAddNewProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPid.trim()) {
      setError('Process ID is required.');
      return;
    }
    if (processes.some((p) => p.pid === newPid.trim())) {
      setError(`Process ID "${newPid}" already exists.`);
      return;
    }
    if (newAt < 0) {
      setError('Arrival Time must be >= 0.');
      return;
    }
    if (newBt <= 0) {
      setError('Burst Time must be > 0.');
      return;
    }

    const newProc: ProcessItem = {
      pid: newPid.trim(),
      name: newName.trim() || `Process ${newPid.trim()}`,
      arrival_time: Number(newAt),
      burst_time: Number(newBt),
      priority: Number(newPriority),
      memory_requirement: 128,
      state: 'NEW',
    };

    const updated = [...processes, newProc];
    setNewPid(`P${updated.length + 1}`);
    setNewName(`Process ${updated.length + 1}`);
    setNewAt(0);
    setNewBt(4);
    setNewPriority(1);
    updateProcessList(updated);
  };

  const handleLoadPreset = (preset: ProcessItem[]) => {
    setNewPid(`P${preset.length + 1}`);
    setNewName(`Process ${preset.length + 1}`);
    updateProcessList(preset);
  };

  useEffect(() => {
    runSimulation();
  }, [algorithm]);

  // Playback timer
  useEffect(() => {
    if (isPlaying && result) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= result.snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, result, speed]);

  const handleSaveExperiment = async () => {
    if (!result) return;
    try {
      await api.experiments.create({
        title: `${algorithm} Scheduling Benchmark (${processes.length} procs)`,
        module: 'cpu_scheduling',
        algorithm,
        input_data: { processes, algorithm, timeQuantum, agingInterval, lowerIsHigher, csOverhead },
        result_data: result,
        metrics: {
          avg_waiting_time: result.avg_waiting_time,
          avg_turnaround_time: result.avg_turnaround_time,
          avg_response_time: result.avg_response_time,
          cpu_utilization: result.cpu_utilization,
          throughput: result.throughput,
        },
      });
      setSaveSuccess('Experiment successfully persisted to SQLite database!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save experiment.');
    }
  };

  const handleExportCsv = async () => {
    if (!result) return;
    try {
      await api.exports.downloadCsv('cpu_scheduling', result, `${algorithm}_simulation.csv`);
    } catch (err: any) {
      setError(err.message || 'Export error.');
    }
  };

  // Determine current snapshot Gantt slice
  const currentSnapshot = result?.snapshots[currentStep] || null;
  const currentGantt = currentSnapshot ? currentSnapshot.gantt_slice || result?.gantt_chart || [] : result?.gantt_chart || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-cyan-400" />
            CPU Scheduling Laboratory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate, compare, and step through preemptive & non-preemptive CPU scheduling policies with time quantum and aging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProcessEditor(!showProcessEditor)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-md transition-colors ${
              showProcessEditor
                ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Custom Workload ({processes.length})</span>
            {showProcessEditor ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {result && (
            <>
              <button
                onClick={handleSaveExperiment}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Run</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV Export</span>
              </button>
            </>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Inline Workload / Process Editor */}
      {showProcessEditor && (
        <div className="rounded-xl bg-slate-900/90 border border-cyan-500/30 p-5 shadow-2xl animate-fadeIn space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                Workload Configuration & Process PCB Editor
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Add, edit arrival/burst/priority values, or remove processes manually. Changes recalculate automatically.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Quick Presets:</span>
              <button
                onClick={() => handleLoadPreset(SAMPLE_CPU_PROCESSES)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Standard (4 Procs)
              </button>
              <button
                onClick={() => handleLoadPreset(SAMPLE_AGING_PROCESSES)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Starvation / Aging
              </button>
              <Link
                to="/process-manager"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-800 transition-colors"
              >
                <span>Full PCB Manager</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Table of active processes */}
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase font-sans font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">PID</th>
                  <th className="py-2 px-3">Process Name</th>
                  <th className="py-2 px-3">Arrival Time (AT)</th>
                  <th className="py-2 px-3">Burst Time (BT)</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {processes.map((p, idx) => (
                  <tr key={p.pid} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-cyan-400">{p.pid}</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleProcessChange(idx, 'name', e.target.value)}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-sans text-xs w-32 focus:outline-none focus:border-cyan-400"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        value={p.arrival_time}
                        onChange={(e) => handleProcessChange(idx, 'arrival_time', Number(e.target.value))}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs w-20 focus:outline-none focus:border-cyan-400"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="1"
                        value={p.burst_time}
                        onChange={(e) => handleProcessChange(idx, 'burst_time', Number(e.target.value))}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs w-20 focus:outline-none focus:border-cyan-400"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={p.priority}
                        onChange={(e) => handleProcessChange(idx, 'priority', Number(e.target.value))}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs w-20 focus:outline-none focus:border-cyan-400"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDeleteProcess(idx)}
                        title="Delete Process"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddNewProcess} className="flex flex-wrap items-end gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">PID</label>
              <input
                type="text"
                value={newPid}
                onChange={(e) => setNewPid(e.target.value)}
                placeholder="P5"
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs w-20 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Process 5"
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs w-36 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Arrival (AT)</label>
              <input
                type="number"
                min="0"
                value={newAt}
                onChange={(e) => setNewAt(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs w-20 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Burst (BT)</label>
              <input
                type="number"
                min="1"
                value={newBt}
                onChange={(e) => setNewBt(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs w-20 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Priority</label>
              <input
                type="number"
                value={newPriority}
                onChange={(e) => setNewPriority(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs w-20 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Process</span>
            </button>
          </form>
        </div>
      )}

      {/* Algorithm Config Panel */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Scheduling Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-cyan-400"
            >
              <option value="FCFS">1. First-Come, First-Served (FCFS)</option>
              <option value="SJF">2. Shortest Job First (SJF - Non-preemptive)</option>
              <option value="SRTF">3. Shortest Remaining Time First (SRTF - Preemptive)</option>
              <option value="PRIORITY_NP">4. Priority (Non-preemptive)</option>
              <option value="PRIORITY_P">5. Priority (Preemptive)</option>
              <option value="ROUND_ROBIN">6. Round Robin (RR)</option>
              <option value="PRIORITY_AGING">7. Priority with Aging (Dynamic)</option>
            </select>
          </div>

          {algorithm === 'ROUND_ROBIN' && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Time Quantum (q)</label>
              <input
                type="number"
                min="1"
                value={timeQuantum}
                onChange={(e) => setTimeQuantum(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {algorithm === 'PRIORITY_AGING' && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Aging Interval (Ticks)</label>
              <input
                type="number"
                min="1"
                value={agingInterval}
                onChange={(e) => setAgingInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {algorithm.includes('PRIORITY') && (
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">Priority Direction</label>
              <select
                value={lowerIsHigher ? 'LOWER' : 'HIGHER'}
                onChange={(e) => setLowerIsHigher(e.target.value === 'LOWER')}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400"
              >
                <option value="LOWER">Lower Number = Higher Priority (e.g. 1 &gt; 5)</option>
                <option value="HIGHER">Higher Number = Higher Priority (e.g. 10 &gt; 1)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Context Switch Latency (CS)</label>
            <input
              type="number"
              min="0"
              value={csOverhead}
              onChange={(e) => setCsOverhead(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="h-4 w-4" />
              <span>{loading ? 'Simulating...' : 'Recalculate Timeline'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Gantt Chart */}
      {result && (
        <GanttChart
          intervals={currentGantt}
          totalTime={result.total_time}
          activeIntervalIndex={currentGantt.length - 1}
        />
      )}

      {/* Step-by-Step Playback Controls */}
      {result && result.snapshots.length > 0 && (
        <PlaybackControls
          currentStep={currentStep}
          totalSteps={result.snapshots.length - 1}
          isPlaying={isPlaying}
          speed={speed}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onNext={() => setCurrentStep((prev) => Math.min(prev + 1, result.snapshots.length - 1))}
          onPrev={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
          onReset={() => {
            setIsPlaying(false);
            setCurrentStep(0);
          }}
          onSpeedChange={(newSpeed) => setSpeed(newSpeed)}
          onSeek={(step) => setCurrentStep(step)}
          statusText={
            currentSnapshot?.running_name
              ? `Executing: ${currentSnapshot.running_name}`
              : currentSnapshot?.is_idle
              ? 'CPU Idle'
              : 'Complete'
          }
        />
      )}

      {/* Simulation Metrics Grid */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Avg Waiting Time"
            value={result.avg_waiting_time}
            unit="units"
            icon={Clock}
            badgeColor="cyan"
          />
          <MetricCard
            title="Avg Turnaround"
            value={result.avg_turnaround_time}
            unit="units"
            icon={Activity}
            badgeColor="emerald"
          />
          <MetricCard
            title="Avg Response Time"
            value={result.avg_response_time}
            unit="units"
            icon={Clock}
            badgeColor="purple"
          />
          <MetricCard
            title="CPU Utilization"
            value={`${result.cpu_utilization}%`}
            icon={Cpu}
            badgeColor="amber"
          />
          <MetricCard
            title="Throughput"
            value={result.throughput}
            unit="p/u"
            icon={Layers}
            badgeColor="cyan"
          />
          <MetricCard
            title="Context Switches"
            value={result.context_switches}
            unit="switches"
            icon={Activity}
            badgeColor="rose"
          />
        </div>
      )}

      {/* Detailed Process Results Table */}
      {result && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Per-Process Scheduling Metrics
            </h3>
            <span className="text-xs text-slate-400">
              TAT = CT − AT | WT = TAT − BT | RT = Start − AT
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase font-sans font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3">Process Name</th>
                  <th className="py-2.5 px-3">Arrival (AT)</th>
                  <th className="py-2.5 px-3">Burst (BT)</th>
                  <th className="py-2.5 px-3">Start</th>
                  <th className="py-2.5 px-3">Completion (CT)</th>
                  <th className="py-2.5 px-3 text-cyan-400">Turnaround (TAT)</th>
                  <th className="py-2.5 px-3 text-emerald-400">Waiting (WT)</th>
                  <th className="py-2.5 px-3 text-purple-400">Response (RT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {result.processes.map((p) => (
                  <tr key={p.pid} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-3 font-bold text-cyan-400">{p.pid}</td>
                    <td className="py-2 px-3 font-sans font-medium text-slate-200">{p.name}</td>
                    <td className="py-2 px-3 text-slate-300">{p.arrival_time}</td>
                    <td className="py-2 px-3 text-slate-300">{p.burst_time}</td>
                    <td className="py-2 px-3 text-slate-400">{p.start_time}</td>
                    <td className="py-2 px-3 text-slate-200 font-bold">{p.completion_time}</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">{p.turnaround_time}</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">{p.waiting_time}</td>
                    <td className="py-2 px-3 text-purple-400 font-bold">{p.response_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contextual Educational Explanation */}
      {explanation && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <HelpCircle className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Educational Analysis & Scheduling Insights
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {explanation.summary}
          </p>
          <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
            {explanation.key_points?.map((pt: string, idx: number) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Event Trace Log */}
      {result && result.events && (
        <EventLog events={result.events} title={`${algorithm} Execution Trace`} />
      )}
    </div>
  );
};
