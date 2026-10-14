import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PagingSimulationResult } from '../types/os';
import { SAMPLE_PAGE_REFERENCES, BELADY_ANOMALY_REFERENCES } from '../utils/SampleDataPresets';
import { FrameVisualizer } from '../components/FrameVisualizer';
import { PlaybackControls } from '../components/PlaybackControls';
import { MetricCard } from '../components/MetricCard';
import { EventLog } from '../components/EventLog';
import {
  Database,
  Play,
  RotateCcw,
  Save,
  Download,
  AlertTriangle,
  BarChart3,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const VirtualMemoryLab: React.FC = () => {
  const [refStringInput, setRefStringInput] = useState<string>(SAMPLE_PAGE_REFERENCES.join(', '));
  const [numFrames, setNumFrames] = useState<number>(3);
  const [algorithm, setAlgorithm] = useState<string>('FIFO');

  const [result, setResult] = useState<PagingSimulationResult | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [beladyDemo, setBeladyDemo] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Step playback
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const parseReferences = (): number[] => {
    return refStringInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        const n = Number(s);
        if (isNaN(n) || n < 0) throw new Error(`Invalid page reference '${s}'. Must be non-negative integer.`);
        return n;
      });
  };

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      const refs = parseReferences();
      const res = await api.paging.simulate({
        reference_string: refs,
        num_frames: numFrames,
        algorithm,
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
      const refs = parseReferences();
      const comp = await api.paging.compare({
        reference_string: refs,
        num_frames: numFrames,
      });
      setComparison(comp);
    } catch (err: any) {
      setError(err.message || 'Comparison error.');
    } finally {
      setLoading(false);
    }
  };

  const runBelady = async () => {
    setLoading(true);
    try {
      const demo = await api.paging.belady({
        reference_string: BELADY_ANOMALY_REFERENCES,
        frames_range: [2, 3, 4, 5, 6],
      });
      setBeladyDemo(demo);
    } catch (err: any) {
      setError(err.message || 'Belady demo error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [algorithm, numFrames]);

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && result) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= result.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, result, speed]);

  const handleSave = async () => {
    if (!result) return;
    try {
      await api.experiments.create({
        title: `${algorithm} Page Replacement (${numFrames} frames)`,
        module: 'page_replacement',
        algorithm,
        input_data: { reference_string: result.reference_string, num_frames: numFrames, algorithm },
        result_data: result,
        metrics: {
          hit_ratio: result.hit_ratio,
          fault_rate: result.fault_rate,
          page_faults: result.page_faults,
          page_hits: result.page_hits,
        },
      });
      setSaveSuccess('Paging experiment persisted to SQLite!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Save error.');
    }
  };

  const handleExportCsv = async () => {
    if (!result) return;
    try {
      await api.exports.downloadCsv('page_replacement', result, `${algorithm}_paging_report.csv`);
    } catch (err: any) {
      setError(err.message || 'Export error.');
    }
  };

  const stepData = result?.steps[currentStep];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Database className="h-6 w-6 text-emerald-400" />
            Virtual Memory &amp; Page Replacement Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate FIFO, LRU, and LFU page replacement algorithms, investigate Belady's Anomaly, and step through frame states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runBelady}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Belady's Anomaly Demo</span>
          </button>
          <button
            onClick={runComparison}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Compare 3 Algos</span>
          </button>
          {result && (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save</span>
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

      {/* Configuration Panel */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-300 mb-1.5">
              Page Reference String (Comma Separated)
            </label>
            <input
              type="text"
              value={refStringInput}
              onChange={(e) => setRefStringInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
              placeholder="e.g. 7, 0, 1, 2, 0, 3, 0, 4"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Number of Page Frames</label>
            <input
              type="number"
              min="1"
              max="10"
              value={numFrames}
              onChange={(e) => setNumFrames(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Algorithm</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-cyan-400"
            >
              <option value="FIFO">First-In, First-Out (FIFO)</option>
              <option value="LRU">Least Recently Used (LRU)</option>
              <option value="LFU">Least Frequently Used (LFU)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setRefStringInput(SAMPLE_PAGE_REFERENCES.join(', '))}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Load 20-Page Benchmark
            </button>
            <button
              onClick={() => {
                setRefStringInput(BELADY_ANOMALY_REFERENCES.join(', '));
                setAlgorithm('FIFO');
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Load Belady Anomaly String
            </button>
          </div>

          <button
            onClick={runSimulation}
            disabled={loading}
            className="py-1.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <Play className="h-4 w-4" />
            <span>{loading ? 'Simulating...' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Physical Frame Visualizer */}
      {result && stepData && (
        <FrameVisualizer
          frames={stepData.frames}
          currentPage={stepData.page}
          isHit={stepData.is_hit}
          replacedPage={stepData.replaced_page}
          targetFrame={stepData.target_frame}
        />
      )}

      {/* Step Playback Controls */}
      {result && result.steps.length > 0 && (
        <PlaybackControls
          currentStep={currentStep}
          totalSteps={result.steps.length - 1}
          isPlaying={isPlaying}
          speed={speed}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onNext={() => setCurrentStep((prev) => Math.min(prev + 1, result.steps.length - 1))}
          onPrev={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
          onReset={() => {
            setIsPlaying(false);
            setCurrentStep(0);
          }}
          onSpeedChange={(newSpeed) => setSpeed(newSpeed)}
          onSeek={(step) => setCurrentStep(step)}
          statusText={stepData?.reason || 'Ready'}
        />
      )}

      {/* Cumulative Metrics Grid */}
      {result && stepData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            title="Page Faults"
            value={stepData.fault_count}
            unit={`/ ${currentStep + 1}`}
            icon={AlertTriangle}
            badge="Fault Total"
            badgeColor="rose"
          />
          <MetricCard
            title="Page Hits"
            value={stepData.hit_count}
            unit={`/ ${currentStep + 1}`}
            icon={Database}
            badge="Hit Total"
            badgeColor="emerald"
          />
          <MetricCard
            title="Page Hit Ratio"
            value={`${stepData.hit_ratio}%`}
            icon={Database}
            badge="Efficiency"
            badgeColor="cyan"
          />
          <MetricCard
            title="Page Fault Rate"
            value={`${stepData.fault_rate}%`}
            icon={AlertTriangle}
            badge="Overhead"
            badgeColor="amber"
          />
        </div>
      )}

      {/* Belady's Anomaly Demonstration Box if active */}
      {beladyDemo && (
        <div className="rounded-xl bg-slate-900/80 border border-amber-500/50 p-5 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider">
              Belady's Anomaly Demonstration Confirmed
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {beladyDemo.explanation}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase font-sans border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Frame Count</th>
                  <th className="py-2 px-3">Page Faults</th>
                  <th className="py-2 px-3">Page Hits</th>
                  <th className="py-2 px-3">Hit Ratio</th>
                  <th className="py-2 px-3 font-sans">Anomaly Indicator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {beladyDemo.results.map((r: any) => (
                  <tr key={r.frames} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold text-cyan-400">{r.frames} Frames</td>
                    <td className="py-2 px-3 text-rose-400 font-bold">{r.faults} Faults</td>
                    <td className="py-2 px-3 text-emerald-400">{r.hits} Hits</td>
                    <td className="py-2 px-3 text-slate-200">{r.hit_ratio}%</td>
                    <td className="py-2 px-3 font-sans">
                      {r.frames === 4 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          Anomaly: 4 frames yields 10 faults vs 9 faults in 3 frames!
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparison table if active */}
      {comparison && (
        <div className="rounded-xl bg-slate-900/80 border border-emerald-500/50 p-5 shadow-xl animate-fadeIn">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 mb-3">
            FIFO vs. LRU vs. LFU Comparative Analysis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase font-sans border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Algorithm</th>
                  <th className="py-2 px-3 text-rose-400">Total Faults</th>
                  <th className="py-2 px-3 text-emerald-400">Total Hits</th>
                  <th className="py-2 px-3 text-cyan-400">Hit Ratio (%)</th>
                  <th className="py-2 px-3 text-amber-400">Fault Rate (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {comparison.summary.map((s: any) => (
                  <tr key={s.algorithm} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 font-bold font-sans text-white">{s.algorithm}</td>
                    <td className="py-2 px-3 text-rose-400 font-bold">{s.faults}</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold">{s.hits}</td>
                    <td className="py-2 px-3 text-cyan-400 font-bold">{s.hit_ratio}%</td>
                    <td className="py-2 px-3 text-amber-400 font-bold">{s.fault_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Full Frame Tracing Log */}
      {result && result.steps && (
        <EventLog
          events={result.steps.map((s) => ({
            step: s.step,
            type: s.is_hit ? 'HIT' : 'FAULT',
            description: s.reason,
          }))}
          title={`${algorithm} Page Replacement Reference Trace`}
        />
      )}
    </div>
  );
};
