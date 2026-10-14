import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { MemorySimulationResult, MemoryOperation } from '../types/os';
import { SAMPLE_MEMORY_BLOCKS, SAMPLE_MEMORY_OPERATIONS } from '../utils/SampleDataPresets';
import { MemoryVisualizer } from '../components/MemoryVisualizer';
import { PlaybackControls } from '../components/PlaybackControls';
import { MetricCard } from '../components/MetricCard';
import { EventLog } from '../components/EventLog';
import {
  Layers,
  Play,
  RotateCcw,
  Save,
  Download,
  Plus,
  Trash2,
  Sparkles,
  BarChart3,
  Split,
} from 'lucide-react';

export const MemoryAllocationLab: React.FC = () => {
  const [blocks, setBlocks] = useState<Array<{ size: number }>>(SAMPLE_MEMORY_BLOCKS);
  const [operations, setOperations] = useState<MemoryOperation[]>(SAMPLE_MEMORY_OPERATIONS);
  const [algorithm, setAlgorithm] = useState<string>('FIRST_FIT');
  const [isFixed, setIsFixed] = useState<boolean>(false);

  // New operation form
  const [opType, setOpType] = useState<'ALLOCATE' | 'DEALLOCATE'>('ALLOCATE');
  const [opPid, setOpPid] = useState('P_New');
  const [opSize, setOpSize] = useState(150);

  const [result, setResult] = useState<MemorySimulationResult | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Step-by-step playback
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      const res = await api.memory.simulate({
        initial_blocks: blocks,
        operations,
        algorithm,
        is_fixed_partition: isFixed,
      });
      setResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Simulation error.');
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async () => {
    setLoading(true);
    try {
      const comp = await api.memory.compare({
        initial_blocks: blocks,
        operations,
        is_fixed_partition: isFixed,
      });
      setComparison(comp);
    } catch (err: any) {
      setError(err.message || 'Comparison error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [algorithm, isFixed]);

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && result) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= result.snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, result, speed]);

  const handleAddOperation = (e: React.FormEvent) => {
    e.preventDefault();
    const newOp: MemoryOperation = {
      type: opType,
      pid: opPid.trim() || 'Proc',
      size: opType === 'ALLOCATE' ? Number(opSize) : undefined,
    };
    setOperations([...operations, newOp]);
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await api.experiments.create({
        title: `${algorithm} Memory Allocation Run (${operations.length} ops)`,
        module: 'memory_allocation',
        algorithm,
        input_data: { blocks, operations, algorithm, isFixed },
        result_data: result,
        metrics: result.final_stats,
      });
      setSaveSuccess('Experiment persisted to SQLite!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Save error.');
    }
  };

  const handleExportCsv = async () => {
    if (!result) return;
    try {
      await api.exports.downloadCsv('memory_allocation', result, `${algorithm}_memory_report.csv`);
    } catch (err: any) {
      setError(err.message || 'Export error.');
    }
  };

  const currentSnapshot = result?.snapshots[currentStep] || null;
  const currentBlocks = currentSnapshot ? currentSnapshot.blocks : result?.final_blocks || [];
  const currentStats = currentSnapshot ? currentSnapshot.stats : result?.final_stats;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-purple-400" />
            Memory Allocation Laboratory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evaluate First Fit, Best Fit, and Worst Fit with dynamic block splitting, coalescing, and fragmentation metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runComparison}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5 text-purple-400" />
            <span>Compare 3 Fits</span>
          </button>
          {result && (
            <>
              <button
                onClick={handleSave}
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
                <span>CSV</span>
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

      {/* Control Panel */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Fit Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-cyan-400"
            >
              <option value="FIRST_FIT">First Fit (Earliest hole &gt;= req)</option>
              <option value="BEST_FIT">Best Fit (Smallest hole &gt;= req)</option>
              <option value="WORST_FIT">Worst Fit (Largest hole &gt;= req)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Partitioning Scheme</label>
            <select
              value={isFixed ? 'FIXED' : 'VARIABLE'}
              onChange={(e) => setIsFixed(e.target.value === 'FIXED')}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              <option value="VARIABLE">Variable Partitions (Dynamic Split &amp; Coalesce)</option>
              <option value="FIXED">Fixed Partitions (Measure Internal Frag)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setBlocks(SAMPLE_MEMORY_BLOCKS);
                setOperations(SAMPLE_MEMORY_OPERATIONS);
              }}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
            >
              Reset to Benchmark
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="h-4 w-4" />
              <span>{loading ? 'Simulating...' : 'Simulate Allocations'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Proportional Memory Map */}
      <MemoryVisualizer
        blocks={currentBlocks}
        totalMemory={currentStats?.total_memory || 0}
        highlightBlockId={currentSnapshot?.chosen_block}
      />

      {/* Step Playback Controls */}
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
          statusText={currentSnapshot?.explanation || 'Ready'}
        />
      )}

      {/* Statistics Cards */}
      {currentStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            title="Total Memory"
            value={currentStats.total_memory}
            unit="KB"
            icon={Layers}
            badgeColor="cyan"
          />
          <MetricCard
            title="Allocated Space"
            value={currentStats.allocated_memory}
            unit="KB"
            icon={Layers}
            badgeColor="purple"
          />
          <MetricCard
            title="Free Space"
            value={currentStats.free_memory}
            unit="KB"
            icon={Layers}
            badgeColor="emerald"
          />
          <MetricCard
            title="Utilization"
            value={`${currentStats.utilization}%`}
            icon={Layers}
            badgeColor="cyan"
          />
          <MetricCard
            title="External Frag"
            value={currentStats.external_fragmentation}
            unit="KB"
            subtitle="Free but non-contiguous"
            icon={Split}
            badgeColor="rose"
          />
          <MetricCard
            title="Internal Frag"
            value={currentStats.internal_fragmentation}
            unit="KB"
            subtitle="Unused inside block"
            icon={Layers}
            badgeColor="amber"
          />
        </div>
      )}

      {/* Side-by-side 3-fit comparison results if triggered */}
      {comparison && (
        <div className="rounded-xl bg-slate-900/80 border border-purple-500/40 p-5 shadow-xl animate-fadeIn">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 mb-3">
            First Fit vs. Best Fit vs. Worst Fit Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase font-sans border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Successful</th>
                  <th className="py-2.5 px-3">Failed</th>
                  <th className="py-2.5 px-3">Memory Utilization</th>
                  <th className="py-2.5 px-3">Free Memory</th>
                  <th className="py-2.5 px-3">External Fragmentation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {comparison.summary.map((s: any) => (
                  <tr key={s.algorithm} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-cyan-400 font-sans">{s.algorithm}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">{s.successful_allocations}</td>
                    <td className="py-2.5 px-3 text-rose-400 font-bold">{s.failed_allocations}</td>
                    <td className="py-2.5 px-3 text-slate-200">{s.utilization}%</td>
                    <td className="py-2.5 px-3 text-slate-300">{s.free_memory} KB</td>
                    <td className="py-2.5 px-3 text-amber-400">{s.external_fragmentation} KB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operation Queue Manager */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-purple-400" />
          Add Allocation / Deallocation Request
        </h3>

        <form onSubmit={handleAddOperation} className="flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Operation Type</label>
            <select
              value={opType}
              onChange={(e) => setOpType(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
            >
              <option value="ALLOCATE">ALLOCATE</option>
              <option value="DEALLOCATE">DEALLOCATE</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Process PID</label>
            <input
              type="text"
              value={opPid}
              onChange={(e) => setOpPid(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono"
              placeholder="e.g. Proc1"
              required
            />
          </div>

          {opType === 'ALLOCATE' && (
            <div>
              <label className="block text-slate-400 mb-1">Size (KB)</label>
              <input
                type="number"
                min="1"
                value={opSize}
                onChange={(e) => setOpSize(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="py-1.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
          >
            Append Operation
          </button>
        </form>
      </div>

      {/* Step Event Trace */}
      {result && result.logs && (
        <EventLog
          events={result.logs.map((l) => ({
            step: l.step,
            type: l.type,
            description: l.text,
          }))}
          title="Memory Step Trace Log"
        />
      )}
    </div>
  );
};
