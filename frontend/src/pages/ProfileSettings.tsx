import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../api/client';
import {
  Settings,
  User as UserIcon,
  Moon,
  Sun,
  Shield,
  LogOut,
  Save,
  Sparkles,
} from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [defaultQuantum, setDefaultQuantum] = useState<number>(2);
  const [defaultDiskSize, setDefaultDiskSize] = useState<number>(200);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSaveSettings = async () => {
    try {
      await api.auth.updateSettings({
        theme,
        settings: {
          default_quantum: defaultQuantum,
          default_disk_size: defaultDiskSize,
        },
      });
      await refreshUser();
      setSaveMessage('Preferences successfully saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving settings.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-cyan-400" />
          User Profile &amp; Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Manage your student account, theme preferences, and default simulation parameters.
        </p>
      </div>

      {saveMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* User Information Card */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-cyan-400" />
          Active Account Information
        </h3>

        {user ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Username</span>
              <span className="font-bold text-slate-100 text-sm font-mono">{user.username}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Email</span>
              <span className="font-medium text-slate-200">{user.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Access Role</span>
              <span className="text-emerald-400 font-semibold">OS Laboratory Student</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Account Registered</span>
              <span className="text-slate-400">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-950 text-xs text-slate-400">
            Currently operating in <strong>Guest Mode</strong>. Sign in to isolate and secure private experiments across browser sessions.
          </div>
        )}
      </div>

      {/* Preferences Form */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4 text-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
          Simulation &amp; Display Preferences
        </h3>

        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
          <div>
            <span className="font-semibold text-slate-200 block">Theme Mode</span>
            <span className="text-slate-400 text-[11px]">Toggle between High-Contrast Dark and Clean Light themes</span>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
          >
            {theme === 'dark' ? <Moon className="h-4 w-4 text-cyan-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
            <span className="capitalize">{theme} Theme</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Default Round Robin Quantum</label>
            <input
              type="number"
              min="1"
              value={defaultQuantum}
              onChange={(e) => setDefaultQuantum(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Default Disk Track Cylinders</label>
            <input
              type="number"
              min="10"
              value={defaultDiskSize}
              onChange={(e) => setDefaultDiskSize(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono"
            />
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between">
          <button
            onClick={handleSaveSettings}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md transition-all"
          >
            <Save className="h-4 w-4" />
            <span>Save Preferences</span>
          </button>

          {user && (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-semibold border border-rose-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
