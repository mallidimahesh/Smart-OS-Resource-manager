import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  Database,
  Lock,
  GitMerge,
  HardDrive,
  BarChart3,
  GraduationCap,
  History,
  FileSpreadsheet,
  Settings,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/', label: 'System Dashboard', icon: LayoutDashboard },
        { path: '/process-manager', label: 'Process Manager', icon: Activity },
      ],
    },
    {
      title: 'SIMULATION LABORATORIES',
      items: [
        { path: '/cpu-scheduling', label: 'CPU Scheduling Lab', icon: Cpu },
        { path: '/memory-allocation', label: 'Memory Allocation Lab', icon: Layers },
        { path: '/virtual-memory', label: 'Virtual Memory (Paging)', icon: Database },
        { path: '/deadlock', label: "Deadlock & Banker's Lab", icon: Lock },
        { path: '/synchronization', label: 'Process Synchronization', icon: GitMerge },
        { path: '/disk-scheduling', label: 'Disk Scheduling Lab', icon: HardDrive },
      ],
    },
    {
      title: 'ANALYTICS & TUTOR',
      items: [
        { path: '/comparison-center', label: 'Algorithm Comparisons', icon: BarChart3 },
        { path: '/os-tutor', label: 'OS Tutor & Viva Practice', icon: GraduationCap },
      ],
    },
    {
      title: 'DATA & SETTINGS',
      items: [
        { path: '/experiments', label: 'Experiment History', icon: History },
        { path: '/reports', label: 'Reports & Exports', icon: FileSpreadsheet },
        { path: '/profile', label: 'Profile & Settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-900/95 dark:bg-slate-950/95 p-4 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-y-auto no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                {section.title}
              </h3>
              <nav className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                        }`
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer info card */}
        <div className="mt-8 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-200">OS Simulation Engine</p>
          <p className="mt-0.5">Version 2.4.0 (Lab Edition)</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            Deterministic Execution Verified
          </div>
        </div>
      </aside>
    </>
  );
};
