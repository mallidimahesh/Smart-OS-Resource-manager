import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { PlaybackControls } from '../components/PlaybackControls';
import { MetricCard } from '../components/MetricCard';
import { EventLog } from '../components/EventLog';
import {
  GitMerge,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export const SynchronizationLab: React.FC = () => {
  const [activeProblem, setActiveProblem] = useState<'PROD_CONS' | 'READ_WRITE' | 'DINING'>('PROD_CONS');

  // Producer-Consumer state
  const [pcCapacity, setPcCapacity] = useState<number>(5);
  const [pcMode, setPcMode] = useState<'SAFE' | 'UNSAFE'>('SAFE');
  const [pcResult, setPcResult] = useState<any>(null);

  // Readers-Writers state
  const [rwPolicy, setRwPolicy] = useState<string>('READER_PREFERENCE');
  const [rwResult, setRwResult] = useState<any>(null);

  // Dining Philosophers state
  const [dpStrategy, setDpStrategy] = useState<string>('ASYMMETRIC');
  const [dpResult, setDpResult] = useState<any>(null);

  // Playback state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000);

  const runProdCons = async () => {
    try {
      const res = await api.synchronization.producerConsumer({
        capacity: pcCapacity,
        mode: pcMode,
      });
      setPcResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
    }
  };

  const runReadWrite = async () => {
    try {
      const res = await api.synchronization.readersWriters({
        priority_policy: rwPolicy,
      });
      setRwResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
    }
  };

  const runDining = async () => {
    try {
      const res = await api.synchronization.diningPhilosophers({
        strategy: dpStrategy,
      });
      setDpResult(res);
      setCurrentStep(0);
      setIsPlaying(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeProblem === 'PROD_CONS') runProdCons();
    else if (activeProblem === 'READ_WRITE') runReadWrite();
    else if (activeProblem === 'DINING') runDining();
  }, [activeProblem, pcMode, rwPolicy, dpStrategy]);

  // Active snapshot calculation
  const getActiveSnapshots = () => {
    if (activeProblem === 'PROD_CONS') return pcResult?.snapshots || [];
    if (activeProblem === 'READ_WRITE') return rwResult?.snapshots || [];
    return dpResult?.snapshots || [];
  };

  const snapshots = getActiveSnapshots();

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying && snapshots.length > 0) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, snapshots, speed]);

  const currentSnap = snapshots[currentStep] || null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <GitMerge className="h-6 w-6 text-amber-400" />
          Process Synchronization Laboratory
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Explore classic concurrency problems: Bounded Buffer with semaphores, Readers-Writers mutual exclusion, and Dining Philosophers circular wait.
        </p>
      </div>

      {/* Problem Selection Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveProblem('PROD_CONS')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeProblem === 'PROD_CONS'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          A. Producer–Consumer (Bounded Buffer)
        </button>
        <button
          onClick={() => setActiveProblem('READ_WRITE')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeProblem === 'READ_WRITE'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          B. Readers–Writers (Reader vs. Writer Preference)
        </button>
        <button
          onClick={() => setActiveProblem('DINING')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeProblem === 'DINING'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          C. Dining Philosophers (Deadlock Avoidance)
        </button>
      </div>

      {/* SECTION A: Producer-Consumer */}
      {activeProblem === 'PROD_CONS' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Buffer Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={pcCapacity}
                    onChange={(e) => setPcCapacity(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Synchronization Mode</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPcMode('SAFE')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        pcMode === 'SAFE'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Safe Semaphores
                    </button>
                    <button
                      onClick={() => setPcMode('UNSAFE')}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                        pcMode === 'UNSAFE'
                          ? 'bg-rose-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Unsafe (Race Demo)
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={runProdCons}
                className="py-1.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Simulate
              </button>
            </div>
          </div>

          {/* Buffer Visualizer */}
          {currentSnap && (
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Bounded Buffer State ({currentSnap.buffer?.length || 0} / {pcCapacity} slots)
                </h4>
                {currentSnap.semaphores && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      mutex: {currentSnap.semaphores.mutex}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      empty: {currentSnap.semaphores.empty}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      full: {currentSnap.semaphores.full}
                    </span>
                  </div>
                )}
              </div>

              {/* Buffer Slots Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: pcCapacity }).map((_, idx) => {
                  const item = currentSnap.buffer?.[idx];
                  const isOccupied = item !== undefined;

                  return (
                    <div
                      key={`slot-${idx}`}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isOccupied
                          ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-600'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold text-slate-400 mb-1">
                        Slot #{idx + 1}
                      </span>
                      <span className="font-mono text-sm">{isOccupied ? item : '[Empty]'}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                {currentSnap.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION B: Readers-Writers */}
      {activeProblem === 'READ_WRITE' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-400 font-semibold">Priority Policy:</label>
                <button
                  onClick={() => setRwPolicy('READER_PREFERENCE')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    rwPolicy === 'READER_PREFERENCE'
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Reader Preference
                </button>
                <button
                  onClick={() => setRwPolicy('WRITER_PREFERENCE')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    rwPolicy === 'WRITER_PREFERENCE'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Writer Preference (Starvation-Free for Writers)
                </button>
              </div>

              <button
                onClick={runReadWrite}
                className="py-1.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Re-simulate
              </button>
            </div>
          </div>

          {/* Readers Writers Visualizer */}
          {currentSnap && (
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Active Readers */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-2">
                    Active Readers (Shared Lock)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentSnap.active_readers?.length > 0 ? (
                      currentSnap.active_readers.map((r: string) => (
                        <span key={r} className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-500/40">
                          {r}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-600">No active readers</span>
                    )}
                  </div>
                </div>

                {/* Shared Resource Data */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center flex flex-col justify-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Shared Database State
                  </span>
                  <span className="text-sm font-mono font-bold text-slate-100">
                    "{currentSnap.resource_data}"
                  </span>
                </div>

                {/* Active Writer */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-2">
                    Active Writer (Exclusive Lock)
                  </span>
                  {currentSnap.active_writer ? (
                    <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/40">
                      {currentSnap.active_writer}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">No active writer (Unlocked)</span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
                {currentSnap.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION C: Dining Philosophers */}
      {activeProblem === 'DINING' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <label className="text-slate-400 font-semibold">Solution Strategy:</label>
                <button
                  onClick={() => setDpStrategy('ASYMMETRIC')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    dpStrategy === 'ASYMMETRIC'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Asymmetric Deadlock-Free Order
                </button>
                <button
                  onClick={() => setDpStrategy('NAIVE_DEADLOCK')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    dpStrategy === 'NAIVE_DEADLOCK'
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Naive Strategy (Deadlock Demonstration)
                </button>
              </div>

              <button
                onClick={runDining}
                className="py-1.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              >
                Re-simulate
              </button>
            </div>
          </div>

          {/* Dining Philosophers Round Table */}
          {currentSnap && (
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  5 Philosophers Round Table
                </h4>
                {currentSnap.deadlocked && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500">
                    CIRCULAR WAIT DEADLOCK DETECTED!
                  </span>
                )}
              </div>

              {/* Philosophers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {currentSnap.philosophers?.map((state: string, idx: number) => {
                  const stateColors: Record<string, string> = {
                    THINKING: 'bg-slate-800/80 text-slate-400 border-slate-700',
                    HUNGRY: 'bg-amber-950/40 text-amber-300 border-amber-800',
                    EATING: 'bg-emerald-950/40 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/40',
                  };

                  return (
                    <div
                      key={`phil-${idx}`}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center ${stateColors[state] || ''}`}
                    >
                      <span className="text-xs font-bold mb-1">Philosopher {idx}</span>
                      <span className="text-xs font-mono font-extrabold uppercase">{state}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {currentSnap.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step Playback Controls */}
      {snapshots.length > 0 && (
        <PlaybackControls
          currentStep={currentStep}
          totalSteps={snapshots.length - 1}
          isPlaying={isPlaying}
          speed={speed}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onNext={() => setCurrentStep((prev) => Math.min(prev + 1, snapshots.length - 1))}
          onPrev={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
          onReset={() => {
            setIsPlaying(false);
            setCurrentStep(0);
          }}
          onSpeedChange={(s) => setSpeed(s)}
          onSeek={(s) => setCurrentStep(s)}
          statusText={currentSnap?.explanation || 'Simulating...'}
        />
      )}
    </div>
  );
};
