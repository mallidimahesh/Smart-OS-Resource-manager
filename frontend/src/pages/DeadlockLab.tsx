import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SAMPLE_BANKER_DATA } from '../utils/SampleDataPresets';
import { BankerSafetyResult } from '../types/os';
import { RAGVisualizer } from '../components/RAGVisualizer';
import { PlaybackControls } from '../components/PlaybackControls';
import { MetricCard } from '../components/MetricCard';
import { EventLog } from '../components/EventLog';
import {
  Lock,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Save,
  Download,
  Plus,
  Send,
  Sparkles,
} from 'lucide-react';

export const DeadlockLab: React.FC = () => {
  const [processes, setProcesses] = useState<string[]>(SAMPLE_BANKER_DATA.processes);
  const [resources, setResources] = useState<string[]>(SAMPLE_BANKER_DATA.resources);
  const [totalResources, setTotalResources] = useState<number[]>(SAMPLE_BANKER_DATA.total_resources);
  const [allocation, setAllocation] = useState<number[][]>(SAMPLE_BANKER_DATA.allocation);
  const [maxDemand, setMaxDemand] = useState<number[][]>(SAMPLE_BANKER_DATA.max_demand);

  const [matrices, setMatrices] = useState<any>(null);
  const [safetyResult, setSafetyResult] = useState<BankerSafetyResult | null>(null);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  // Resource Request form
  const [reqProcIdx, setReqProcIdx] = useState<number>(1);
  const [reqVector, setReqVector] = useState<number[]>([1, 0, 2]);
  const [reqResponse, setReqResponse] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'SAFETY' | 'REQUEST' | 'DETECTION' | 'RAG'>('SAFETY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Step playback for safety check
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1200);

  const validateMatrices = async () => {
    try {
      const mat = await api.deadlock.validate({
        processes,
        resources,
        total_resources: totalResources,
        allocation,
        max_demand: maxDemand,
      });
      setMatrices(mat);
      return mat;
    } catch (err: any) {
      setError(err.message || 'Matrix validation failed.');
      return null;
    }
  };

  const runSafetyCheck = async () => {
    setLoading(true);
    setError('');
    setReqResponse(null);
    try {
      const mat = await validateMatrices();
      if (!mat) return;
      const res = await api.deadlock.safety({
        processes: mat.processes,
        resources: mat.resources,
        available: mat.available,
        allocation: mat.allocation,
        need: mat.need,
      });
      setSafetyResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err: any) {
      setError(err.message || 'Safety check error.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRequest = async () => {
    setLoading(true);
    setError('');
    try {
      const mat = await validateMatrices();
      if (!mat) return;
      const res = await api.deadlock.request({
        processes: mat.processes,
        resources: mat.resources,
        available: mat.available,
        allocation: mat.allocation,
        need: mat.need,
        requesting_process_idx: reqProcIdx,
        request: reqVector,
      });
      setReqResponse(res);
      if (res.granted && res.new_allocation) {
        setAllocation(res.new_allocation);
        await runSafetyCheck();
      }
    } catch (err: any) {
      setError(err.message || 'Request simulation error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeadlockDetection = async () => {
    setLoading(true);
    setError('');
    try {
      const mat = await validateMatrices();
      if (!mat) return;
      // Using need as outstanding requests for detection demo
      const res = await api.deadlock.detect({
        processes: mat.processes,
        resources: mat.resources,
        available: mat.available,
        allocation: mat.allocation,
        request_matrix: mat.need,
      });
      setDetectionResult(res);
      setActiveTab('DETECTION');
    } catch (err: any) {
      setError(err.message || 'Detection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSafetyCheck();
  }, []);

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && safetyResult) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= safetyResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, safetyResult, speed]);

  const handleSave = async () => {
    if (!safetyResult || !matrices) return;
    try {
      await api.experiments.create({
        title: `Banker's Algorithm Run (${safetyResult.is_safe ? 'Safe State' : 'Unsafe State'})`,
        module: 'deadlock',
        algorithm: "Banker's Safety",
        input_data: { processes, resources, totalResources, allocation, maxDemand },
        result_data: safetyResult,
        metrics: { is_safe: safetyResult.is_safe, safe_sequence: safetyResult.safe_sequence },
      });
      setSaveSuccess('Deadlock experiment persisted to SQLite!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Save error.');
    }
  };

  const stepItem = safetyResult?.steps[currentStep];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Lock className="h-6 w-6 text-rose-400" />
            Deadlock Avoidance &amp; Banker's Algorithm Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Simulate Banker's Safety Algorithm, test resource requests with rollback, detect deadlocks, and inspect RAG graphs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setProcesses(SAMPLE_BANKER_DATA.processes);
              setResources(SAMPLE_BANKER_DATA.resources);
              setTotalResources(SAMPLE_BANKER_DATA.total_resources);
              setAllocation(SAMPLE_BANKER_DATA.allocation);
              setMaxDemand(SAMPLE_BANKER_DATA.max_demand);
              runSafetyCheck();
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            Reset Benchmark
          </button>
          {safetyResult && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
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

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('SAFETY')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'SAFETY' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Banker's Safety Verification
        </button>
        <button
          onClick={() => setActiveTab('REQUEST')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'REQUEST' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Resource Request Simulation
        </button>
        <button
          onClick={() => {
            setActiveTab('DETECTION');
            handleDeadlockDetection();
          }}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'DETECTION' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Deadlock Detection Engine
        </button>
        <button
          onClick={() => setActiveTab('RAG')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'RAG' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Resource Allocation Graph (RAG)
        </button>
      </div>

      {/* Matrices Display: Allocation, Max, Need, Available */}
      {matrices && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Allocation Matrix */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Allocation Matrix (A)
            </h4>
            <table className="w-full text-center text-xs font-mono">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-1">PID</th>
                  {resources.map((r) => (
                    <th key={`ah-${r}`} className="py-1">{r.split(' ')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {processes.map((p, i) => (
                  <tr key={`ar-${p}`}>
                    <td className="py-1 font-bold text-slate-300">{p}</td>
                    {allocation[i]?.map((v, j) => (
                      <td key={`av-${j}`} className="py-1 text-emerald-400">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Max Matrix */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Max Demand Matrix (M)
            </h4>
            <table className="w-full text-center text-xs font-mono">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-1">PID</th>
                  {resources.map((r) => (
                    <th key={`mh-${r}`} className="py-1">{r.split(' ')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {processes.map((p, i) => (
                  <tr key={`mr-${p}`}>
                    <td className="py-1 font-bold text-slate-300">{p}</td>
                    {maxDemand[i]?.map((v, j) => (
                      <td key={`mv-${j}`} className="py-1 text-slate-200">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculated Need Matrix & Available */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Need Matrix (N = M − A)
              </h4>
              <span className="text-[10px] text-cyan-400 font-mono">
                Avail: [{matrices.available.join(', ')}]
              </span>
            </div>
            <table className="w-full text-center text-xs font-mono">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-1">PID</th>
                  {resources.map((r) => (
                    <th key={`nh-${r}`} className="py-1">{r.split(' ')[0]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {processes.map((p, i) => (
                  <tr key={`nr-${p}`}>
                    <td className="py-1 font-bold text-slate-300">{p}</td>
                    {matrices.need[i]?.map((v: number, j: number) => (
                      <td key={`nv-${j}`} className="py-1 text-amber-400 font-bold">{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Safety Algorithm Playback */}
      {activeTab === 'SAFETY' && safetyResult && (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              safetyResult.is_safe
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {safetyResult.is_safe ? (
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              )}
              <div>
                <h3 className="text-sm font-bold uppercase">
                  {safetyResult.is_safe ? 'System is in a SAFE State' : 'UNSAFE State Detected'}
                </h3>
                <p className="text-xs opacity-90 mt-0.5">{safetyResult.explanation}</p>
              </div>
            </div>

            {safetyResult.is_safe && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Safe Sequence
                </span>
                <span className="text-sm font-mono font-extrabold text-cyan-300">
                  {safetyResult.safe_sequence.join(' → ')}
                </span>
              </div>
            )}
          </div>

          {/* Playback Controls */}
          <PlaybackControls
            currentStep={currentStep}
            totalSteps={safetyResult.steps.length - 1}
            isPlaying={isPlaying}
            speed={speed}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onNext={() => setCurrentStep((prev) => Math.min(prev + 1, safetyResult.steps.length - 1))}
            onPrev={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
            onReset={() => {
              setIsPlaying(false);
              setCurrentStep(0);
            }}
            onSpeedChange={(s) => setSpeed(s)}
            onSeek={(s) => setCurrentStep(s)}
            statusText={stepItem?.explanation || 'Safety checking...'}
          />

          {/* Current Step Work Vector Visualizer */}
          {stepItem && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">
                  Step #{currentStep} Snapshot:
                </span>
                <span className="font-mono text-cyan-400 font-bold">
                  Work Vector = [{stepItem.work.join(', ')}]
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">{stepItem.explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Resource Request Simulator */}
      {activeTab === 'REQUEST' && (
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Simulate Dynamic Resource Request
          </h3>
          <p className="text-xs text-slate-400">
            Submit a vector request for an active process. The engine verifies Request ≤ Need and Request ≤ Available,
            tentatively allocates resources, runs the safety algorithm, and commits or rolls back automatically.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Requesting Process</label>
              <select
                value={reqProcIdx}
                onChange={(e) => setReqProcIdx(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
              >
                {processes.map((p, idx) => (
                  <option key={p} value={idx}>
                    {p} (Need: [{matrices?.need[idx]?.join(', ') || ''}])
                  </option>
                ))}
              </select>
            </div>

            {resources.map((r, rIdx) => (
              <div key={`req-res-${r}`}>
                <label className="block text-slate-300 mb-1 font-semibold">{r} Request</label>
                <input
                  type="number"
                  min="0"
                  value={reqVector[rIdx] || 0}
                  onChange={(e) => {
                    const updated = [...reqVector];
                    updated[rIdx] = Number(e.target.value);
                    setReqVector(updated);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSimulateRequest}
            disabled={loading}
            className="py-2 px-5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />
            <span>Simulate Request &amp; Verify Safety</span>
          </button>

          {reqResponse && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                reqResponse.granted
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500 text-rose-300'
              }`}
            >
              <div className="font-bold text-sm mb-1">
                {reqResponse.granted ? 'REQUEST GRANTED ✓' : 'REQUEST REJECTED ✗'}
              </div>
              <p>{reqResponse.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Deadlock Detection */}
      {activeTab === 'DETECTION' && detectionResult && (
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div
            className={`p-4 rounded-xl border ${
              detectionResult.is_deadlocked
                ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
            }`}
          >
            <div className="font-bold text-sm mb-1">
              {detectionResult.is_deadlocked ? 'DEADLOCK DETECTED!' : 'NO DEADLOCK: SYSTEM STABLE'}
            </div>
            <p className="text-xs">{detectionResult.message}</p>
          </div>

          <div className="text-xs text-slate-300">
            <strong>Detection Termination Sequence:</strong>{' '}
            <span className="font-mono text-cyan-400">
              {detectionResult.finish_sequence.length > 0
                ? detectionResult.finish_sequence.join(' → ')
                : 'None'}
            </span>
          </div>
        </div>
      )}

      {/* Tab 4: Resource Allocation Graph Visualizer */}
      {activeTab === 'RAG' && matrices && (
        <RAGVisualizer
          processes={processes}
          resources={resources}
          allocation={allocation}
          needOrRequest={matrices.need}
          available={matrices.available}
          deadlockedProcesses={detectionResult?.deadlocked_processes || []}
        />
      )}
    </div>
  );
};
