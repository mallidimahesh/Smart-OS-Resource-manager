import React from 'react';

interface RAGVisualizerProps {
  processes: string[];
  resources: string[];
  allocation: number[][];
  needOrRequest: number[][];
  available: number[];
  deadlockedProcesses?: string[];
}

export const RAGVisualizer: React.FC<RAGVisualizerProps> = ({
  processes,
  resources,
  allocation,
  needOrRequest,
  available,
  deadlockedProcesses = [],
}) => {
  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Resource Allocation Graph (RAG) Topology
        </h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
            <span className="text-slate-400">Processes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-cyan-500"></span>
            <span className="text-slate-400">Resources</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-emerald-400"></span>
            <span className="text-slate-400">Allocation Edge (R→P)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-amber-400"></span>
            <span className="text-slate-400">Request Edge (P→R)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Processes Column */}
        <div>
          <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Processes (Active Entities)
          </h5>
          <div className="space-y-3">
            {processes.map((p, pIdx) => {
              const isDeadlocked = deadlockedProcesses.includes(p);
              const pAlloc = allocation[pIdx] || [];
              const pReq = needOrRequest[pIdx] || [];

              return (
                <div
                  key={`p-${p}`}
                  className={`p-3 rounded-xl border transition-all ${
                    isDeadlocked
                      ? 'bg-rose-950/30 border-rose-500/80 text-rose-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                        {p}
                      </div>
                      <span className="font-semibold text-sm">{p}</span>
                    </div>
                    {isDeadlocked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        DEADLOCKED
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs grid grid-cols-2 gap-2 text-slate-400">
                    <div>
                      <span className="text-emerald-400 font-medium">Holds (Alloc):</span>{' '}
                      <span className="font-mono text-slate-200">[{pAlloc.join(', ')}]</span>
                    </div>
                    <div>
                      <span className="text-amber-400 font-medium">Claims (Need):</span>{' '}
                      <span className="font-mono text-slate-200">[{pReq.join(', ')}]</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resources Column */}
        <div>
          <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Resource Types & Instances
          </h5>
          <div className="space-y-3">
            {resources.map((r, rIdx) => {
              const avail = available[rIdx] !== undefined ? available[rIdx] : 0;
              const totalAlloc = allocation.reduce((acc, row) => acc + (row[rIdx] || 0), 0);

              return (
                <div
                  key={`r-${r}`}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                        {r.substring(0, 2)}
                      </div>
                      <span className="font-semibold text-sm">{r}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md font-mono text-xs bg-slate-800 text-cyan-400 border border-slate-700">
                      Available: {avail}
                    </span>
                  </div>

                  <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                    <span>Allocated Instances: <strong className="text-slate-200 font-mono">{totalAlloc}</strong></span>
                    <span>Total Pool: <strong className="text-slate-200 font-mono">{totalAlloc + avail}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
