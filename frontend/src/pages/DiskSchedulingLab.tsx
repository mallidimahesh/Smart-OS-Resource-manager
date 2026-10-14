import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DiskSimulationResult } from '../types/os';
import { SAMPLE_DISK_REQUESTS, SAMPLE_INITIAL_HEAD } from '../utils/SampleDataPresets';
import { DiskTrackVisualizer } from '../components/DiskTrackVisualizer';
import { PlaybackControls } from '../components/PlaybackControls';
import { MetricCard } from '../components/MetricCard';
import { EventLog } from '../components/EventLog';
import {
  HardDrive,
  Play,
  RotateCcw,
  Save,
  Download,
  BarChart3,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export const DiskSchedulingLab: React.FC = () => {
  const [requestsInput, setRequestsInput] = useState<string>(SAMPLE_DISK_REQUESTS.join(', '));
  const [initialHead, setInitialHead] = useState<number>(SAMPLE_INITIAL_HEAD);
  const [diskSize, setDiskSize] = useState<number>(200);
  const [direction, setDirection] = useState<string>('UP');
  const [algorithm, setAlgorithm] = useState<string>('FCFS');
  const [includeJump, setIncludeJump] = useState<boolean>(true);

  const [result, setResult] = useState<DiskSimulationResult | null>(null);
  const [comparison, setComparison] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Step playback
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000);

  const parseRequests = (): number[] => {
    return requestsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        const n = Number(s);
        if (isNaN(n) || n < 0 || n >= diskSize) {
          throw new Error(`Cylinder request '${s}' is outside disk range [0, ${diskSize - 1}].`);
        }
        return n;
      });
  };

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setSaveSuccess('');
    try {
      const reqs = parseRequests();
      const res = await api.disk.simulate({
        requests: reqs,
        initial_head: initialHead,
        disk_size: diskSize,
        direction,
        algorithm,
        include_jump: includeJump,
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
      const reqs = parseRequests();
      const comp = await api.disk.compare({
        requests: reqs,
        initial_head: initialHead,
        disk_size: diskSize,
        direction,
        include_jump: includeJump,
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
  }, [algorithm, direction]);

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
        title: `${algorithm} Disk Seek Simulation (${result.requests.length} requests)`,
        module: 'disk_scheduling',
        algorithm,
        input_data: { requests: result.requests, initial_head: initialHead, disk_size: diskSize, direction, algorithm },
        result_data: result,
        metrics: {
          total_head_movement: result.total_head_movement,
          average_head_movement: result.average_head_movement,
        },
      });
      setSaveSuccess('Disk scheduling experiment persisted to SQLite!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Save error.');
    }
  };

  const handleExportCsv = async () => {
    if (!result) return;
    try {
      await api.exports.downloadCsv('disk_scheduling', result, `${algorithm}_disk_report.csv`);
    } catch (err: any) {
      setError(err.message || 'Export error.');
    }
  };

  const currentStepData = result?.steps[currentStep];
  const visitedUpToNow = result ? result.visited_sequence.slice(0, currentStep + 1) : [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <HardDrive className="h-6 w-6 text-cyan-400" />
            Disk Scheduling Laboratory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate and compare seek latency across all 6 algorithms: FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runComparison}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Compare 6 Algorithms</span>
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
              Request Queue (Cylinders)
            </label>
            <input
              type="text"
              value={requestsInput}
              onChange={(e) => setRequestsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
              placeholder="e.g. 98, 183, 37, 122, 14, 124, 65, 67"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Starting Head Position</label>
            <input
              type="number"
              min="0"
              max={diskSize - 1}
              value={initialHead}
              onChange={(e) => setInitialHead(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Total Cylinders (Disk Size)</label>
            <input
              type="number"
              min="10"
              value={diskSize}
              onChange={(e) => setDiskSize(Number(e.target.value))}
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
              <option value="FCFS">1. FCFS (First Come First Served)</option>
              <option value="SSTF">2. SSTF (Shortest Seek Time First)</option>
              <option value="SCAN">3. SCAN (Elevator to Boundary)</option>
              <option value="C_SCAN">4. C-SCAN (Circular SCAN)</option>
              <option value="LOOK">5. LOOK (Look to Furthest Request)</option>
              <option value="C_LOOK">6. C-LOOK (Circular LOOK)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Initial Head Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              <option value="UP">Up / Higher Cylinders (→ {diskSize - 1})</option>
              <option value="DOWN">Down / Lower Cylinders (→ 0)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setRequestsInput(SAMPLE_DISK_REQUESTS.join(', '));
                setInitialHead(SAMPLE_INITIAL_HEAD);
                setDiskSize(200);
              }}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium"
            >
              Reset Benchmark
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="h-4 w-4" />
              <span>{loading ? 'Simulating...' : 'Execute Seek Schedule'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Cylinder Track Seeker */}
      {result && currentStepData && (
        <DiskTrackVisualizer
          currentHead={currentStepData.to_track}
          diskSize={diskSize}
          requests={result.requests}
          visitedSequence={visitedUpToNow}
          direction={direction}
          lastDistance={currentStepData.distance}
        />
      )}

      {/* Playback Controls */}
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
          onSpeedChange={(s) => setSpeed(s)}
          onSeek={(s) => setCurrentStep(s)}
          statusText={currentStepData?.explanation || 'Ready'}
        />
      )}

      {/* Metrics Row */}
      {result && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Total Head Movement"
            value={result.total_head_movement}
            unit="cylinders"
            icon={HardDrive}
            badge="Seek Overhead"
            badgeColor="cyan"
          />
          <MetricCard
            title="Average Seek Distance"
            value={result.average_head_movement}
            unit="cylinders / req"
            icon={TrendingDown}
            badge="Mean Latency"
            badgeColor="emerald"
          />
          <MetricCard
            title="Requests Serviced"
            value={result.requests.length}
            unit="requests"
            icon={HardDrive}
            badge="100% Completed"
            badgeColor="purple"
          />
        </div>
      )}

      {/* 6-Algorithm Comparison Chart if active */}
      {comparison && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl animate-fadeIn space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
              6-Algorithm Head Movement Comparison
            </h3>
            <span className="text-xs text-emerald-400 font-semibold">
              Best Policy: <strong>{comparison.best_algorithm}</strong>
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison.summary}>
                <XAxis dataKey="algorithm" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="total_movement" fill="#38bdf8" radius={[6, 6, 0, 0]}>
                  {comparison.summary.map((entry: any) => (
                    <Cell
                      key={entry.algorithm}
                      fill={entry.algorithm === comparison.best_algorithm ? '#10b981' : '#38bdf8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Trajectory Event Log */}
      {result && (
        <EventLog
          events={result.steps.map((s) => ({
            step: s.step,
            type: s.serviced ? 'SERVICE' : 'BOUNDARY',
            description: s.explanation,
          }))}
          title={`${algorithm} Head Trajectory Trace`}
        />
      )}
    </div>
  );
};
