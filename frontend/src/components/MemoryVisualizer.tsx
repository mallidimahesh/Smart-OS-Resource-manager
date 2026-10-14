import React from 'react';
import { MemoryBlock } from '../types/os';

interface MemoryVisualizerProps {
  blocks: MemoryBlock[];
  totalMemory: number;
  highlightBlockId?: number | null;
}

export const MemoryVisualizer: React.FC<MemoryVisualizerProps> = ({
  blocks,
  totalMemory,
  highlightBlockId,
}) => {
  if (!blocks || blocks.length === 0) {
    return <div className="text-slate-400 text-xs text-center py-6">No memory blocks allocated.</div>;
  }

  const totMem = totalMemory || blocks.reduce((acc, b) => acc + b.size, 0) || 1;

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Physical Address Space Map
        </h4>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-500/80"></span>
            <span className="text-slate-400">Free Memory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-indigo-600"></span>
            <span className="text-slate-400">Allocated Process</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-500/80"></span>
            <span className="text-slate-400">Internal Frag</span>
          </div>
        </div>
      </div>

      {/* Proportional Memory Map */}
      <div className="flex h-16 w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
        {blocks.map((b) => {
          const widthPct = (b.size / totMem) * 100;
          const isHighlighted = highlightBlockId === b.block_id;

          return (
            <div
              key={`block-${b.block_id}-${b.start}`}
              style={{ width: `${Math.max(widthPct, 3)}%` }}
              className={`relative flex flex-col items-center justify-center p-1 border-r border-slate-900 transition-all ${
                b.is_free ? 'bg-emerald-950/60 text-emerald-300' : 'bg-indigo-900/80 text-white'
              } ${isHighlighted ? 'ring-2 ring-cyan-400 scale-y-105 z-10 brightness-125' : ''}`}
            >
              <span className="text-xs font-bold truncate max-w-full">
                {b.is_free ? 'FREE' : b.pid}
              </span>
              <span className="text-[10px] font-mono opacity-80 leading-none">
                {b.size} KB
              </span>
              {b.internal_fragmentation > 0 && (
                <div
                  title={`Internal Frag: ${b.internal_fragmentation} KB`}
                  className="absolute bottom-0 left-0 right-0 h-1.5 bg-amber-500"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Addresses scale */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 px-1">
        <span>0 KB (Base)</span>
        <span>{totMem} KB (Limit)</span>
      </div>

      {/* Detailed Block Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {blocks.map((b) => (
          <div
            key={`detail-${b.block_id}`}
            className={`p-2.5 rounded-lg border text-xs ${
              b.is_free
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-indigo-950/20 border-indigo-800/40 text-indigo-300'
            } ${highlightBlockId === b.block_id ? 'ring-2 ring-cyan-400' : ''}`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>Block #{b.block_id}</span>
              <span className="text-[10px] uppercase font-semibold">
                {b.is_free ? 'FREE' : 'ALLOCATED'}
              </span>
            </div>
            <div className="mt-1 text-[11px] font-mono opacity-90">
              <div>Size: {b.size} KB</div>
              <div>Address: {b.start} KB</div>
              {!b.is_free && <div>Owner: {b.pid}</div>}
              {b.internal_fragmentation > 0 && (
                <div className="text-amber-400 font-semibold">
                  Int Frag: {b.internal_fragmentation} KB
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
