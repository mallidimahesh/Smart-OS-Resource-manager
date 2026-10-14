import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  SAMPLE_CPU_PROCESSES,
  SAMPLE_MEMORY_BLOCKS,
  SAMPLE_MEMORY_OPERATIONS,
  SAMPLE_PAGE_REFERENCES,
  SAMPLE_DISK_REQUESTS,
} from '../utils/SampleDataPresets';
import {
  BarChart3,
  Cpu,
  Layers,
  Database,
  HardDrive,
  Play,
  Save,
  Download,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const ComparisonCenter: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<'CPU' | 'MEMORY' | 'PAGING' | 'DISK'>('CPU');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const runComparison = async () => {
    setLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      if (selectedModule === 'CPU') {
        const res = await api.scheduling.compare({
          processes: SAMPLE_CPU_PROCESSES,
          algorithms: ['FCFS', 'SJF', 'SRTF', 'ROUND_ROBIN', 'PRIORITY_NP', 'PRIORITY_P'],
          time_quantum: 2,
        });
        setComparisonData(res);
      } else if (selectedModule === 'MEMORY') {
        const res = await api.memory.compare({
          initial_blocks: SAMPLE_MEMORY_BLOCKS,
          operations: SAMPLE_MEMORY_OPERATIONS,
        });
        setComparisonData(res);
      } else if (selectedModule === 'PAGING') {
        const res = await api.paging.compare({
          reference_string: SAMPLE_PAGE_REFERENCES,
          num_frames: 3,
        });
        setComparisonData(res);
      } else if (selectedModule === 'DISK') {
        const res = await api.disk.compare({
          requests: SAMPLE_DISK_REQUESTS,
          initial_head: 53,
          disk_size: 200,
        });
        setComparisonData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Comparison failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, [selectedModule]);

  const handleSaveComparison = async () => {
    if (!comparisonData) return;
    try {
      await api.comparisons.create({
        title: `${selectedModule} Comprehensive Multi-Algorithm Benchmark`,
        module: selectedModule.toLowerCase(),
        comparison_data: comparisonData,
      });
      setSaveSuccess('Comparison saved to SQLite database!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save comparison.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            Algorithm Comparison Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Independently execute and compare algorithms on identical standardized workloads to analyze trade-offs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {comparisonData && (
            <button
              onClick={handleSaveComparison}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Comparison</span>
            </button>
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

      {/* Module Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setSelectedModule('CPU')}
          className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
            selectedModule === 'CPU'
              ? 'bg-blue-950/40 border-blue-500 text-white shadow-lg shadow-blue-500/10'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="h-5 w-5 text-blue-400" />
          <div className="text-left">
            <div className="text-xs font-bold">CPU Scheduling</div>
            <div className="text-[10px] text-slate-500">FCFS, SJF, SRTF, RR, Priority</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedModule('MEMORY')}
          className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
            selectedModule === 'MEMORY'
              ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-500/10'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-5 w-5 text-purple-400" />
          <div className="text-left">
            <div className="text-xs font-bold">Memory Allocation</div>
            <div className="text-[10px] text-slate-500">First Fit, Best Fit, Worst Fit</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedModule('PAGING')}
          className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
            selectedModule === 'PAGING'
              ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="h-5 w-5 text-emerald-400" />
          <div className="text-left">
            <div className="text-xs font-bold">Virtual Memory</div>
            <div className="text-[10px] text-slate-500">FIFO, LRU, LFU Replacement</div>
          </div>
        </button>

        <button
          onClick={() => setSelectedModule('DISK')}
          className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
            selectedModule === 'DISK'
              ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="h-5 w-5 text-cyan-400" />
          <div className="text-left">
            <div className="text-xs font-bold">Disk Scheduling</div>
            <div className="text-[10px] text-slate-500">FCFS, SSTF, SCAN, C-SCAN, LOOK</div>
          </div>
        </button>
      </div>

      {/* Comparison Details & Recharts */}
      {comparisonData && (
        <div className="space-y-6">
          {/* CPU Scheduling Comparison View */}
          {selectedModule === 'CPU' && comparisonData.summary && (
            <div className="space-y-6">
              {/* Chart */}
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                  Turnaround Time vs. Waiting Time by Algorithm
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.summary}>
                      <XAxis dataKey="algorithm" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend />
                      <Bar dataKey="avg_waiting_time" name="Avg Waiting Time" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avg_turnaround_time" name="Avg Turnaround Time" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-sans border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Algorithm</th>
                        <th className="py-2.5 px-3 text-cyan-400">Avg Waiting</th>
                        <th className="py-2.5 px-3 text-purple-400">Avg Turnaround</th>
                        <th className="py-2.5 px-3">CPU Util (%)</th>
                        <th className="py-2.5 px-3">Throughput</th>
                        <th className="py-2.5 px-3">Context Switches</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {comparisonData.summary.map((row: any) => (
                        <tr key={row.algorithm} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-bold text-white font-sans">{row.algorithm}</td>
                          <td className="py-2.5 px-3 text-cyan-400 font-bold">{row.avg_waiting_time}</td>
                          <td className="py-2.5 px-3 text-purple-400 font-bold">{row.avg_turnaround_time}</td>
                          <td className="py-2.5 px-3 text-slate-200">{row.cpu_utilization}%</td>
                          <td className="py-2.5 px-3 text-slate-300">{row.throughput}</td>
                          <td className="py-2.5 px-3 text-amber-400">{row.context_switches}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Disk Scheduling Comparison View */}
          {selectedModule === 'DISK' && comparisonData.summary && (
            <div className="space-y-6">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                  Total Cylinder Seek Distance (Lower is Better)
                </h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData.summary}>
                      <XAxis dataKey="algorithm" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                      <Bar dataKey="total_movement" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-sans border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Algorithm</th>
                        <th className="py-2.5 px-3 text-cyan-400">Total Head Seek</th>
                        <th className="py-2.5 px-3 text-emerald-400">Avg Distance / Request</th>
                        <th className="py-2.5 px-3 font-sans">Trajectory Track</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {comparisonData.summary.map((row: any) => (
                        <tr key={row.algorithm} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-bold text-white font-sans">{row.algorithm}</td>
                          <td className="py-2.5 px-3 text-cyan-400 font-bold">{row.total_movement} cyl</td>
                          <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.avg_movement}</td>
                          <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{row.sequence.join(' → ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Paging Comparison View */}
          {selectedModule === 'PAGING' && comparisonData.summary && (
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-sans border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Algorithm</th>
                      <th className="py-2.5 px-3 text-rose-400">Page Faults</th>
                      <th className="py-2.5 px-3 text-emerald-400">Page Hits</th>
                      <th className="py-2.5 px-3 text-cyan-400">Hit Ratio (%)</th>
                      <th className="py-2.5 px-3 text-amber-400">Fault Rate (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {comparisonData.summary.map((row: any) => (
                      <tr key={row.algorithm} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white font-sans">{row.algorithm}</td>
                        <td className="py-2.5 px-3 text-rose-400 font-bold">{row.faults}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.hits}</td>
                        <td className="py-2.5 px-3 text-cyan-400 font-bold">{row.hit_ratio}%</td>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">{row.fault_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Memory Comparison View */}
          {selectedModule === 'MEMORY' && comparisonData.summary && (
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-sans border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Fit Policy</th>
                      <th className="py-2.5 px-3 text-emerald-400">Successful Allocations</th>
                      <th className="py-2.5 px-3 text-rose-400">Failed Allocations</th>
                      <th className="py-2.5 px-3 text-cyan-400">Memory Utilization</th>
                      <th className="py-2.5 px-3 text-amber-400">External Fragmentation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {comparisonData.summary.map((row: any) => (
                      <tr key={row.algorithm} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white font-sans">{row.algorithm}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{row.successful_allocations}</td>
                        <td className="py-2.5 px-3 text-rose-400 font-bold">{row.failed_allocations}</td>
                        <td className="py-2.5 px-3 text-cyan-400 font-bold">{row.utilization}%</td>
                        <td className="py-2.5 px-3 text-amber-400 font-bold">{row.external_fragmentation} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
