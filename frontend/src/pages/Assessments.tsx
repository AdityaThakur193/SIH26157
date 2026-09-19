import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCheck2, ChevronRight, AlertTriangle, RefreshCw, Building2, 
  ShieldAlert, ShieldCheck, ArrowRight, Filter, Search, Plus
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getOverview } from '../services/api';
import { NationalOverviewResponse, CSESummary } from '../types/api';

interface AssessmentsProps {
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'assessments' | 'copilot', cseId?: string) => void;
}

export const Assessments: React.FC<AssessmentsProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<NationalOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOverview();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment entities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useGSAP(() => {
    if (!loading && data) {
      gsap.fromTo(
        '.assessment-card',
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
  }, { scope: containerRef, dependencies: [loading, data, selectedSector, searchQuery] });

  const sectors = ['ALL', 'Banking & Financial', 'Energy & Power', 'Telecommunications', 'Defense', 'General'];

  const filteredEntities = (data?.entities || []).filter((entity) => {
    const matchesSearch = 
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.sector.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSector = selectedSector === 'ALL' || entity.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const getAttentionBadge = (level: string) => {
    const upper = level.toUpperCase();
    if (upper === 'CRITICAL') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs">
          Critical Focus
        </span>
      );
    }
    if (upper === 'HIGH ATTENTION') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 shadow-2xs">
          High Attention
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100 shadow-2xs">
        Nominal Pool
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading statutory assessment entities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 flex flex-col items-center text-center space-y-3 max-w-md mx-auto mt-12">
        <AlertTriangle className="w-10 h-10 text-rose-500" />
        <p className="text-rose-700 text-sm font-medium">{error}</p>
        <button 
          onClick={fetchData} 
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition"
        >
          Retry Load
        </button>
      </div>
    );
  }

  const entities = data?.entities || [];

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>Screen 04: Statutory Evaluation Roster</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Critical Sector Entity Assessments
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Select any entity to open its full 6-dimension supervisory evaluation board and forensic proof chain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData} 
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all active:scale-95 cursor-pointer" 
            title="Refresh Assessments"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button 
            onClick={() => onNavigate('evidence')} 
            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 active:scale-95 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest New CSE</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                selectedSector === sector
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sector === 'ALL' ? `All Sectors (${entities.length})` : sector}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter entities..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Entities Grid */}
      {filteredEntities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">No matching Critical Sector Entities</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            {entities.length === 0 
              ? 'No telemetry has been ingested yet. Ingest raw logs or SOC case records to generate live assessments.'
              : 'No entities match the current search or sector filter.'}
          </p>
          <button 
            onClick={() => onNavigate('evidence')} 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Go to Data Ingestion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEntities.map((entity) => (
            <div
              key={entity.id}
              onClick={() => onNavigate('assessment', entity.id)}
              className="assessment-card bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md hover:border-indigo-300 hover:-translate-y-1 transition-[box-shadow,border-color] duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700 font-mono group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {entity.name.substring(0, 2).toUpperCase()}
                  </div>
                  {getAttentionBadge(entity.attention_level)}
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {entity.name}
                </h3>
                <span className="font-mono text-xs text-slate-400 font-medium block mt-0.5">
                  {entity.id}
                </span>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Sector:</span>
                    <span className="font-semibold text-slate-800">{entity.sector}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Raw Alerts:</span>
                    <span className="font-mono font-bold text-slate-900">{entity.alerts_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">SimHash Clusters:</span>
                    <span className="font-mono font-bold text-indigo-600">{entity.cases_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Supervisory Status:</span>
                    <span className="font-medium text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Evaluated
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-800">
                <span>View Assessment Board</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
