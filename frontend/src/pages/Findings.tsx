import React, { useState, useEffect, useRef } from 'react';
import { FileSearch, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getOverview } from '../services/api';
import { NationalOverviewResponse, CSESummary } from '../types/api';

interface FindingsProps {
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'copilot', cseId?: string) => void;
}

export const Findings: React.FC<FindingsProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<NationalOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useGSAP(() => {
    if (!loading && data) {
      gsap.fromTo(
        '.finding-card',
        { opacity: 0, y: 24, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.08,
          duration: 0.5,
          delay: 0.04,
          ease: 'power3.out',
          clearProps: 'transform,opacity,scale'
        }
      );
    }
  }, { scope: containerRef, dependencies: [loading, data] });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOverview();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getAttentionBadge = (level: string) => {
    const upper = level.toUpperCase();
    if (upper === 'CRITICAL') return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">Critical</span>;
    if (upper === 'HIGH ATTENTION') return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">High Attention</span>;
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100">Nominal</span>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading entity findings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex flex-col items-center text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-rose-700 text-sm">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold">Retry</button>
      </div>
    );
  }

  const entities = data?.entities || [];

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <FileSearch className="w-4 h-4" />
            <span>Supervisory Findings</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Assessment Dossiers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select a Critical Sector Entity to review its full supervisory evaluation.</p>
        </div>
        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all active:scale-95 cursor-pointer" title="Refresh">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {entities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm flex flex-col items-center text-center">
          <FileSearch className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">No entities ingested</h2>
          <p className="text-sm text-slate-500 max-w-sm">Ingest SOC telemetry data via the Data Ingestion page to generate assessment findings.</p>
          <button onClick={() => onNavigate('evidence')} className="mt-6 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 font-semibold rounded-xl text-sm transition-all shadow-sm">Go to Data Ingestion</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => (
            <div
              key={entity.id}
              onClick={() => onNavigate('assessment', entity.id)}
              className="finding-card bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-indigo-200 hover:-translate-y-0.5 cursor-pointer transition-[box-shadow,border-color] duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                  {entity.name.substring(0, 2).toUpperCase()}
                </div>
                {getAttentionBadge(entity.attention_level)}
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{entity.name}</h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">{entity.id}</p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{entity.sector} · {entity.cases_count.toLocaleString()} cases</span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
