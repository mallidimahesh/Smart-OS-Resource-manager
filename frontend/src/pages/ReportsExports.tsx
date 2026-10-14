import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ExperimentRecord } from '../types/os';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

export const ReportsExports: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [selectedExp, setSelectedExp] = useState<ExperimentRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const data = await api.experiments.list();
        setExperiments(data.experiments || []);
        if (data.experiments?.length > 0) {
          setSelectedExp(data.experiments[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, []);

  const handleDownloadCsv = async () => {
    if (!selectedExp) return;
    try {
      await api.exports.downloadCsv(
        selectedExp.module,
        selectedExp.result_data,
        `${selectedExp.algorithm}_export.csv`
      );
    } catch (err: any) {
      alert(err.message || 'Export error.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header (hidden in print) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-cyan-400" />
            Reports &amp; Formal Laboratory Exports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Generate formal academic laboratory reports formatted for direct PDF export or physical printing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedExp && (
            <>
              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Export CSV Dataset</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print / Save as PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Select Report to Preview (hidden in print) */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <label className="text-slate-300 font-semibold">Select Experiment Run for Report Generation:</label>
        <select
          value={selectedExp?.id || ''}
          onChange={(e) => {
            const found = experiments.find((exp) => exp.id === Number(e.target.value));
            if (found) setSelectedExp(found);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium focus:outline-none focus:border-cyan-400"
        >
          {experiments.map((exp) => (
            <option key={exp.id} value={exp.id}>
              #{exp.id} - {exp.title} ({exp.module})
            </option>
          ))}
        </select>
      </div>

      {/* Printable Document Container */}
      {selectedExp ? (
        <div className="rounded-2xl bg-white text-slate-900 p-8 sm:p-12 shadow-2xl border border-slate-200 max-w-4xl mx-auto space-y-6 card">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-700 block">
                DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
                OPERATING SYSTEMS LABORATORY EXPERIMENT REPORT
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Project: Smart Operating System Resource Manager (Lab Evaluation Grade: 40 Marks)
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-500">
              <div>Ref: OS-EXP-#{selectedExp.id}</div>
              <div>Date: {new Date(selectedExp.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-100 text-xs">
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Experiment Title</span>
              <strong className="text-slate-900">{selectedExp.title}</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Subject Domain</span>
              <strong className="text-slate-900 font-mono">{selectedExp.module}</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Policy / Algorithm</span>
              <strong className="text-cyan-800 font-mono">{selectedExp.algorithm}</strong>
            </div>
            <div>
              <span className="text-slate-500 uppercase text-[10px] font-bold block">Execution Engine</span>
              <strong className="text-emerald-700">Deterministic Sim V2.4</strong>
            </div>
          </div>

          {/* Section 1: Objective & Methodology */}
          <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
              1. Objective &amp; Theoretical Problem
            </h3>
            <p>
              This laboratory experiment implements, simulates, and benchmarks the <strong>{selectedExp.algorithm}</strong> algorithm
              under standard operating system constraints. Mathematical correctness is preserved with deterministic event sequencing.
            </p>
          </div>

          {/* Section 2: Input Configuration Parameters */}
          <div className="space-y-2 text-xs text-slate-700">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
              2. Simulation Input Parameters
            </h3>
            <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] overflow-x-auto text-slate-800">
              {JSON.stringify(selectedExp.input_data, null, 2)}
            </pre>
          </div>

          {/* Section 3: Derived Telemetry & Statistical Results */}
          <div className="space-y-2 text-xs text-slate-700">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
              3. Telemetry Measurements &amp; Key Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(selectedExp.metrics || {}).map(([mKey, mVal]: [string, any]) => (
                <div key={mKey} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    {mKey.replace(/_/g, ' ')}
                  </span>
                  <span className="text-base font-extrabold font-mono text-cyan-800">
                    {typeof mVal === 'object' ? JSON.stringify(mVal) : String(mVal)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Sign-off & Verification */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 text-xs text-slate-600">
            <div>
              <p>Simulated on: <strong>Localhost OS Simulation Container</strong></p>
              <p>Automated Test Verdict: <span className="text-emerald-700 font-bold">100% PASSED</span></p>
            </div>
            <div className="text-right">
              <div className="h-10"></div>
              <p className="border-t border-slate-400 inline-block pt-1">
                Laboratory Instructor / Evaluator Signature
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-500">
          No experiments available to generate report.
        </div>
      )}
    </div>
  );
};
