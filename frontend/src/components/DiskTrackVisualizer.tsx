import React from 'react';

interface DiskTrackVisualizerProps {
  currentHead: number;
  diskSize: number;
  requests: number[];
  visitedSequence?: number[];
  direction?: string;
  lastDistance?: number;
}

export const DiskTrackVisualizer: React.FC<DiskTrackVisualizerProps> = ({
  currentHead,
  diskSize,
  requests,
  visitedSequence = [],
  direction = 'UP',
  lastDistance = 0,
}) => {
  const headPct = Math.min(Math.max((currentHead / (diskSize - 1)) * 100, 0), 100);

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Magnetic Disk Platter / Cylinder Track
          </h4>
          <span className="text-xs text-slate-400">
            Current Head Position: <strong className="text-cyan-400 font-mono">Cylinder {currentHead}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700">
            Direction: <strong className="text-amber-400 font-mono">{direction}</strong>
          </span>
          {lastDistance > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-cyan-950/40 text-cyan-400 font-medium border border-cyan-800/40">
              Seek: +{lastDistance} cyl
            </span>
          )}
        </div>
      </div>

      {/* Disk track linear scale */}
      <div className="relative h-16 w-full rounded-xl bg-slate-950 border border-slate-800 p-2 flex items-center shadow-inner overflow-hidden">
        {/* Track groove line */}
        <div className="absolute left-4 right-4 h-2 rounded-full bg-slate-800"></div>

        {/* Request Markers */}
        {requests.map((req) => {
          const reqPct = (req / (diskSize - 1)) * 100;
          const isVisited = visitedSequence.includes(req);
          const isCurrent = req === currentHead;

          return (
            <div
              key={`req-${req}`}
              style={{ left: `calc(1rem + ${reqPct * 0.92}%)` }}
              className="absolute -translate-x-1/2 flex flex-col items-center z-10"
              title={`Cylinder Request: ${req}`}
            >
              <div
                className={`h-4 w-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold ${
                  isCurrent
                    ? 'bg-cyan-400 border-white text-slate-950 scale-125 shadow-lg shadow-cyan-500/50'
                    : isVisited
                    ? 'bg-emerald-500 border-emerald-300 text-slate-950'
                    : 'bg-slate-700 border-slate-500 text-slate-300'
                }`}
              >
                {req}
              </div>
            </div>
          );
        })}

        {/* Read/Write Head Indicator */}
        <div
          style={{ left: `calc(1rem + ${headPct * 0.92}%)` }}
          className="absolute -translate-x-1/2 top-1 bottom-1 w-1 bg-cyan-400 z-20 shadow-md shadow-cyan-400 transition-all duration-300"
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rotate-45 rounded-xs"></div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-400 rotate-45 rounded-xs"></div>
        </div>
      </div>

      {/* Cylinders Scale range */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 px-4">
        <span>Cylinder 0 (Inner Track)</span>
        <span>Cylinder {Math.floor(diskSize / 2)}</span>
        <span>Cylinder {diskSize - 1} (Outer Track)</span>
      </div>

      {/* Serviced trajectory queue */}
      <div className="mt-4 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
        <span className="text-slate-400 font-semibold mr-2">Visited Seek Trajectory:</span>
        <span className="font-mono text-cyan-300">
          {visitedSequence.length > 0 ? visitedSequence.join(' → ') : currentHead}
        </span>
      </div>
    </div>
  );
};
