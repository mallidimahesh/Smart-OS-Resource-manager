import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ExperimentRecord } from '../types/os';
import {
  History,
  Search,
  Filter,
  Trash2,
  Copy,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ExperimentHistory: React.FC = () => {
  const navigate = useNavigate();
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [selectedExp, setSelectedExp] = useState<ExperimentRecord | null>(null);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState('');

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const data = await api.experiments.list({
        module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
        search: search.trim() || undefined,
      });
      setExperiments(data.experiments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, [moduleFilter, search]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this experiment?')) return;
    try {
      await api.experiments.delete(id);
      setExperiments(experiments.filter((e) => e.id !== id));
      if (selectedExp?.id === id) setSelectedExp(null);
      setNotification('Experiment removed.');
      setTimeout(() => setNotification(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete experiment.');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const res = await api.experiments.duplicate(id);
      setExperiments([res.experiment, ...experiments]);
      setNotification('Experiment duplicated successfully.');
      setTimeout(() => setNotification(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate.');
    }
  };

  const handleRerun = (exp: ExperimentRecord) => {
    // Save workload into localStorage if CPU and navigate
    if (exp.module === 'cpu_scheduling') {
      const input = exp.input_data;
      if (input?.processes) {
        localStorage.setItem('os_active_processes', JSON.stringify(input.processes));
      }
      navigate('/cpu-scheduling');
    } else if (exp.module === 'memory_allocation') {
      navigate('/memory-allocation');
    } else if (exp.module === 'page_replacement') {
      navigate('/virtual-memory');
    } else if (exp.module === 'disk_scheduling') {
      navigate('/disk-scheduling');
    } else if (exp.module === 'deadlock') {
      navigate('/deadlock');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="h-6 w-6 text-cyan-400" />
            Experiment History &amp; Laboratory Archive
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Persisted simulation logs, inputs, and verified telemetry stored in SQLite with per-user data isolation.
          </p>
        </div>

        <button
          onClick={fetchExperiments}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
        >
          Refresh Archive
        </button>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search experiments by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Modules</option>
            <option value="cpu_scheduling">CPU Scheduling</option>
            <option value="memory_allocation">Memory Allocation</option>
            <option value="page_replacement">Page Replacement</option>
            <option value="deadlock">Deadlock &amp; Banker's</option>
            <option value="disk_scheduling">Disk Scheduling</option>
          </select>
        </div>
      </div>

      {/* Main Grid: List + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Experiment List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading archived experiments...</div>
          ) : experiments.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-xs">
              No experiments found. Run a simulation in any laboratory and click "Save Run" to persist here.
            </div>
          ) : (
            experiments.map((exp) => (
              <div
                key={exp.id}
                onClick={() => setSelectedExp(exp)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedExp?.id === exp.id
                    ? 'bg-slate-800/80 border-cyan-500 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                      {exp.module.replace('_', ' ')} • {exp.algorithm}
                    </span>
                    <h3 className="text-sm font-bold text-slate-100 mt-0.5">{exp.title}</h3>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleRerun(exp)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="Reopen in Laboratory"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800/80 pt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    {new Date(exp.created_at).toLocaleString()}
                  </span>
                  <span>ID: #{exp.id}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Experiment Inspector */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Experiment Inspector
          </h3>

          {selectedExp ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Experiment Title</span>
                <span className="font-bold text-slate-200 text-sm">{selectedExp.title}</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Module &amp; Policy</span>
                <span className="font-mono text-cyan-400">{selectedExp.module} ({selectedExp.algorithm})</span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Persisted Metrics</span>
                <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedExp.metrics, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase block mb-1">Stored Input Payload</span>
                <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                  {JSON.stringify(selectedExp.input_data, null, 2)}
                </pre>
              </div>

              <button
                onClick={() => handleRerun(selectedExp)}
                className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center justify-center gap-2 shadow"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Rerun in Simulation Lab</span>
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              Select an experiment from the archive to inspect its inputs, metrics, and state.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
