import React from 'react';
import { PageFrame } from '../types/os';

interface FrameVisualizerProps {
  frames: PageFrame[];
  currentPage?: number;
  isHit?: boolean;
  replacedPage?: number | null;
  targetFrame?: number | null;
}

export const FrameVisualizer: React.FC<FrameVisualizerProps> = ({
  frames,
  currentPage,
  isHit,
  replacedPage,
  targetFrame,
}) => {
  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Physical Page Frames
        </h4>
        {currentPage !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Referencing Page:</span>
            <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-sm bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              {currentPage}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                isHit
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
              }`}
            >
              {isHit ? 'HIT ✓' : 'FAULT ✗'}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {frames.map((frame) => {
          const isTarget = targetFrame === frame.frame_id;
          const isEvicted = replacedPage !== null && replacedPage !== undefined && isTarget && !isHit;

          return (
            <div
              key={`frame-${frame.frame_id}`}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isTarget
                  ? isHit
                    ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/50 scale-105'
                    : 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/50 scale-105'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase text-slate-400 mb-1">
                Frame {frame.frame_id}
              </span>

              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 border border-slate-700 font-mono text-xl font-extrabold text-white shadow-inner">
                {frame.page !== null ? frame.page : '-'}
              </div>

              <div className="mt-2 text-[10px] font-mono text-slate-400 text-center leading-tight">
                {frame.page !== null ? (
                  <>
                    <div>Loaded: #{frame.load_step}</div>
                    <div>Used: #{frame.last_used}</div>
                    <div>Freq: {frame.freq}x</div>
                  </>
                ) : (
                  <span>Empty</span>
                )}
              </div>

              {isEvicted && (
                <span className="mt-1 text-[9px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800">
                  Evicted #{replacedPage}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
