import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { Dashboard } from './pages/Dashboard';
import { ProcessManager } from './pages/ProcessManager';
import { CPUSchedulingLab } from './pages/CPUSchedulingLab';
import { MemoryAllocationLab } from './pages/MemoryAllocationLab';
import { VirtualMemoryLab } from './pages/VirtualMemoryLab';
import { DeadlockLab } from './pages/DeadlockLab';
import { SynchronizationLab } from './pages/SynchronizationLab';
import { DiskSchedulingLab } from './pages/DiskSchedulingLab';
import { ComparisonCenter } from './pages/ComparisonCenter';
import { OSTutorLab } from './pages/OSTutorLab';
import { ExperimentHistory } from './pages/ExperimentHistory';
import { ReportsExports } from './pages/ReportsExports';
import { ProfileSettings } from './pages/ProfileSettings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/process-manager" element={<ProcessManager />} />
              <Route path="/cpu-scheduling" element={<CPUSchedulingLab />} />
              <Route path="/memory-allocation" element={<MemoryAllocationLab />} />
              <Route path="/virtual-memory" element={<VirtualMemoryLab />} />
              <Route path="/deadlock" element={<DeadlockLab />} />
              <Route path="/synchronization" element={<SynchronizationLab />} />
              <Route path="/disk-scheduling" element={<DiskSchedulingLab />} />
              <Route path="/comparison-center" element={<ComparisonCenter />} />
              <Route path="/os-tutor" element={<OSTutorLab />} />
              <Route path="/experiments" element={<ExperimentHistory />} />
              <Route path="/reports" element={<ReportsExports />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
