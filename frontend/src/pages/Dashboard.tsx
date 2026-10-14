import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { MetricCard } from '../components/MetricCard';
import {
  Cpu,
  Layers,
  Database,
  Lock,
  GitMerge,
  HardDrive,
  BarChart3,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PIE_COLORS = ['#38bdf8', '#818cf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

export const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await api.analytics.overview();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, []);

  const labCards = [
    {
      title: 'CPU Scheduling Lab',
      desc: 'Simulate FCFS, SJF, SRTF, Priority (P & NP), Round Robin, and Aging with real-time Gantt timelines.',
      icon: Cpu,
      path: '/cpu-scheduling',
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
    },
    {
      title: 'Memory Allocation Lab',
      desc: 'First Fit, Best Fit, and Worst Fit dynamic partitioning with block splitting, coalescing, and fragmentation analysis.',
      icon: Layers,
      path: '/memory-allocation',
      color: 'from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400',
    },
    {
      title: 'Virtual Memory (Paging)',
      desc: 'FIFO, LRU, and LFU page replacement with step-by-step hit/fault tracking and Belady anomaly verification.',
      icon: Database,
      path: '/virtual-memory',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      title: "Deadlock & Banker's Lab",
      desc: "Banker's Safety Algorithm, resource request rollback, deadlock detection, and Resource Allocation Graph visualization.",
      icon: Lock,
      path: '/deadlock',
      color: 'from-rose-500/20 to-amber-500/10 border-rose-500/30 text-rose-400',
    },
    {
      title: 'Process Synchronization',
      desc: 'Interactive Producer-Consumer bounded buffer, Readers-Writers priority policies, and Dining Philosophers deadlock demonstration.',
      icon: GitMerge,
      path: '/synchronization',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    },
    {
      title: 'Disk Scheduling Lab',
      desc: 'Seek time evaluation across all 6 algorithms: FCFS, SSTF, SCAN, C-SCAN, LOOK, and C-LOOK with head trajectory tracks.',
      icon: HardDrive,
      path: '/disk-scheduling',
      color: 'from-cyan-500/20 to-sky-500/10 border-cyan-500/30 text-cyan-400',
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 border border-slate-700/60 shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>40-Mark Operating Systems Lab Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Operating System Resource Manager & Simulation Laboratory
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            A comprehensive, rigorous platform featuring deterministic algorithm execution, step-by-step state playback,
            dynamic Gantt charts, fragmentation analysis, safe sequences, and offline viva preparation.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/cpu-scheduling"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all"
            >
              <span>Launch CPU Scheduling</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/comparison-center"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-medium text-xs transition-colors"
            >
              <BarChart3 className="h-4 w-4 text-cyan-400" />
              <span>Algorithm Comparison Center</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Simulated System Metrics Note */}
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
          <span>Metrics below represent <strong>simulated operating system telemetry</strong> computed from actual execution results.</span>
        </div>
        <span className="font-mono text-cyan-400">Deterministic Engine Active</span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Saved Experiments"
          value={loading ? '...' : analytics?.total_experiments || 0}
          unit="runs"
          subtitle="Persistent test benchmarks"
          icon={Clock}
          badge="SQLite Persisted"
          badgeColor="cyan"
        />
        <MetricCard
          title="Avg Turnaround Time"
          value={loading ? '...' : analytics?.simulated_metrics?.avg_turnaround_time || 0}
          unit="units"
          subtitle="Mean TAT across simulations"
          icon={TrendingUp}
          badge="CPU Scheduling"
          badgeColor="emerald"
        />
        <MetricCard
          title="Avg Page Hit Ratio"
          value={loading ? '...' : `${analytics?.simulated_metrics?.avg_hit_ratio || 0}%`}
          subtitle="Virtual Memory efficiency"
          icon={Database}
          badge="Paging Lab"
          badgeColor="purple"
        />
        <MetricCard
          title="Avg Head Movement"
          value={loading ? '...' : analytics?.simulated_metrics?.avg_disk_movement || 0}
          unit="cylinders"
          subtitle="Disk seek benchmark"
          icon={HardDrive}
          badge="Disk Scheduling"
          badgeColor="amber"
        />
      </div>

      {/* Analytics Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Distribution Chart */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Laboratory Activity by OS Module
            </h3>
            <span className="text-xs text-slate-400">Experiment Distribution</span>
          </div>

          <div className="h-64 w-full">
            {analytics?.module_distribution && analytics.module_distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.module_distribution}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-500">
                Run and save simulations to visualize laboratory distribution.
              </div>
            )}
          </div>
        </div>

        {/* Algorithm Usage Pie */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Algorithm Popularity
            </h3>
            <span className="text-xs text-slate-400">Top Algorithms</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {analytics?.top_algorithms && analytics.top_algorithms.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.top_algorithms}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name }) => name}
                  >
                    {analytics.top_algorithms.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-500">No algorithm statistics yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Laboratories Quick Launch */}
      <div>
        <h2 className="text-lg font-bold tracking-tight text-white mb-4">
          Simulation Laboratories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {labCards.map((lab) => {
            const Icon = lab.icon;
            return (
              <Link
                key={lab.title}
                to={lab.path}
                className={`group rounded-xl p-5 border bg-gradient-to-br ${lab.color} hover:border-cyan-500/50 hover:shadow-xl transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {lab.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {lab.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] font-semibold text-cyan-400">
                  <span>Enter Lab Workspace</span>
                  <span>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Experiments Table */}
      {analytics?.recent_experiments && analytics.recent_experiments.length > 0 && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Recent Experiment Runs
            </h3>
            <Link to="/experiments" className="text-xs text-cyan-400 hover:underline">
              View All History →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Title</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Algorithm</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {analytics.recent_experiments.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{exp.title}</td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{exp.module}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{exp.algorithm}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(exp.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        to={`/experiments`}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
