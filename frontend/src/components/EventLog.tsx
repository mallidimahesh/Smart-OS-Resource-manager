import React, { useState } from 'react';
import { Search, ScrollText } from 'lucide-react';

interface EventItem {
  time?: number;
  step?: number;
  type?: string;
  description: string;
}

interface EventLogProps {
  events: EventItem[];
  title?: string;
}

export const EventLog: React.FC<EventLogProps> = ({ events, title = 'Simulation Event Trace' }) => {
  const [filter, setFilter] = useState('');

  const filteredEvents = events.filter((e) =>
    e.description.toLowerCase().includes(filter.toLowerCase()) ||
    (e.type && e.type.toLowerCase().includes(filter.toLowerCase()))
  );

  const getBadgeClass = (type?: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('COMPLET') || t.includes('HIT') || t.includes('SUCCESS') || t.includes('SAFE')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (t.includes('PREEMPT') || t.includes('FAULT') || t.includes('BLOCKED') || t.includes('EXPIRE') || t.includes('AGING')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    if (t.includes('FAIL') || t.includes('DEADLOCK') || t.includes('OVERFLOW') || t.includes('UNSAFE')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
  };

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {title} ({events.length} events)
          </h4>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter trace..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-800/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
        {filteredEvents.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No matching events logged.</p>
        ) : (
          filteredEvents.map((evt, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs hover:border-slate-700 transition-colors"
            >
              <span className="font-mono text-slate-400 text-[11px] shrink-0 pt-0.5">
                {evt.time !== undefined ? `T=${evt.time}` : evt.step !== undefined ? `Step ${evt.step}` : `#${idx+1}`}
              </span>

              {evt.type && (
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border shrink-0 ${getBadgeClass(evt.type)}`}>
                  {evt.type}
                </span>
              )}

              <p className="text-slate-300 flex-1 leading-relaxed">{evt.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
