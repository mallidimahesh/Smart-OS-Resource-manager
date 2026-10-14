import React, { useState } from 'react';
import { GanttInterval } from '../types/os';

interface GanttChartProps {
  intervals: GanttInterval[];
  totalTime?: number;
  activeIntervalIndex?: number;
}

const PROCESS_COLORS: Record<string, string> = {
  '1': '#38bdf8', // sky
  '2': '#a855f7', // purple
  '3': '#10b981', // emerald
  '4': '#f59e0b', // amber
  '5': '#f43f5e', // rose
  '6': '#06b6d4', // cyan
  '7': '#8b5cf6', // violet
  '8': '#84cc16', // lime
};

function getIntervalColor(interval: GanttInterval): string {
  if (interval.is_idle) return '#475569'; // slate-600
  if (interval.is_cs) return '#d97706'; // amber-600
  return PROCESS_COLORS[interval.pid] || '#6366f1';
}

export const GanttChart: React.FC<GanttChartProps> = ({
  intervals,
  totalTime: propTotalTime,
  activeIntervalIndex,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!intervals || intervals.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
        No execution timeline available yet. Run a CPU scheduling algorithm to generate the Gantt chart.
      </div>
    );
  }

  const computedTotal = intervals[intervals.length - 1].end_time;
  const totalTime = propTotalTime || computedTotal || 1;

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Execution Gantt Timeline
        </h4>
        <span className="text-xs text-slate-400 font-mono">
          Span: 0 → {totalTime} units
        </span>
      </div>

      {/* Gantt Bar */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[650px]">
          {/* Blocks */}
          <div className="relative flex h-14 w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shadow-inner">
            {intervals.map((item, idx) => {
              const duration = item.end_time - item.start_time;
              const widthPct = (duration / totalTime) * 100;
              const color = getIntervalColor(item);
              const isActive = activeIntervalIndex === idx;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={`${item.pid}-${item.start_time}-${idx}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  }}
                  className={`relative flex flex-col items-center justify-center border-r border-slate-900/50 transition-all cursor-pointer ${
                    isActive ? 'ring-2 ring-white scale-y-105 z-10' : ''
                  } ${isHovered ? 'brightness-125' : ''}`}
                >
                  <span className="text-xs font-bold text-slate-950 px-1 truncate drop-shadow-sm">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-900/90 leading-tight">
                    {duration}u
                  </span>
                </div>
              );
            })}
          </div>

          {/* Time markers below Gantt */}
          <div className="relative w-full h-6 mt-1.5 text-[11px] font-mono text-slate-400">
            <span className="absolute left-0">0</span>
            {intervals.map((item, idx) => {
              const leftPct = (item.end_time / totalTime) * 100;
              return (
                <span
                  key={`marker-${idx}`}
                  style={{ left: `${leftPct}%` }}
                  className="absolute -translate-x-1/2 before:content-[''] before:absolute before:-top-1.5 before:left-1/2 before:-translate-x-1/2 before:h-1 before:w-px before:bg-slate-600"
                >
                  {item.end_time}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Hover tooltip details */}
      {hoveredIndex !== null && intervals[hoveredIndex] && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: getIntervalColor(intervals[hoveredIndex]) }}
            ></span>
            <span className="font-semibold text-slate-100">
              {intervals[hoveredIndex].name}
            </span>
            <span className="text-slate-400">
              ({intervals[hoveredIndex].is_idle ? 'CPU Idle' : intervals[hoveredIndex].is_cs ? 'Context Switching' : `PID: ${intervals[hoveredIndex].pid}`})
            </span>
          </div>
          <div className="text-slate-300 font-mono">
            Interval: [{intervals[hoveredIndex].start_time} → {intervals[hoveredIndex].end_time}] (Duration: {intervals[hoveredIndex].end_time - intervals[hoveredIndex].start_time}s)
          </div>
        </div>
      )}
    </div>
  );
};
