import React, { useState, useEffect } from 'react';
import { 
  Building2, Layers, AlertTriangle, FileSearch, Search, ChevronRight, 
  RefreshCw, Upload, Trash2, AlertOctagon, X, CheckCircle2,
  Download, Play, Activity, ShieldAlert, Filter, ArrowRight, BarChart3
} from 'lucide-react';
import { getOverview, resetDatabase } from '../services/api';
import { NationalOverviewResponse, CSESummary } from '../types/api';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

interface OverviewProps {
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'copilot', cseId?: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<NationalOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOverview();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load supervisory overview';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeDatabase = async () => {
    setIsResetting(true);
    setError(null);
    setResetSuccessMessage(null);
    try {
      const res = await resetDatabase();
      setShowResetModal(false);
      setResetSuccessMessage(res.message || 'Enclave database purged successfully.');
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Purge failed';
      setError(msg);
      setShowResetModal(false);
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sectors = ['ALL', 'Banking & Financial', 'Energy & Power', 'Telecommunications', 'Defense'];

  const filteredEntities = data?.entities.filter((entity) => {
    const matchesSearch = 
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entity.key_concern.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSector = selectedSector === 'ALL' || entity.sector === selectedSector;
    return matchesSearch && matchesSector;
  }) || [];

  const getAttentionBadge = (level: string) => {
    switch (level.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
            High Attention
          </span>
        );
      case 'HIGH ATTENTION':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
            Moderate
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100">
            Normal Pool
          </span>
        );
    }
  };

  // Prepare chart data based on real entities
  const chartData = (data?.entities || []).map(e => ({
    name: e.name.substring(0, 10),
    alerts: e.alerts_count,
    cases: e.cases_count
  }));

  // Baseline Health Math
  const totalAnalyzed = data?.cases_analyzed || 0;
  const anomalies = data?.supervisory_findings || 0;
  const standardOps = Math.max(0, totalAnalyzed - anomalies);
  const confidence = totalAnalyzed > 0 ? Math.round((standardOps / totalAnalyzed) * 100) : 100;
  
  const pieData = [
    { name: 'Standard Operations', value: standardOps, color: '#4F46E5' },
    { name: 'Anomalous Deviations', value: anomalies, color: '#E11D48' }
  ];

  const COLORS = ['#4F46E5', '#E11D48'];

  // Critical Inferences based on findings
  const criticalEntities = (data?.entities || []).filter(e => e.attention_level.toUpperCase() === 'CRITICAL').slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Top Banner & Header matching the screenshot */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervisory Assessment Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cross-entity operational pattern analysis and supervisory anomaly detection across Critical Sector Entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Purge Database"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Summary</span>
          </button>

          <button
            onClick={() => onNavigate('evidence')}
            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run Evaluation</span>
          </button>
        </div>
      </div>

      {resetSuccessMessage && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-teal-800 text-sm font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-teal-600" />
            <span>{resetSuccessMessage}</span>
          </div>
          <button onClick={() => setResetSuccessMessage(null)} className="text-teal-400 hover:text-teal-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-red-800 text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="underline hover:text-red-900">Retry</button>
        </div>
      )}

      {/* 4 KPI Metric Cards matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluated CSEs</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2 font-mono">
            {chartData.length}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
            <span>Active critical sector entities</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alerts Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {loading ? '...' : (data?.alerts_analyzed ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
            <span>Raw SOC telemetry events</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flagged Signals</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {loading ? '...' : (data?.supervisory_findings ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            <span>Requires human review</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Cases</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {loading ? '...' : (data?.priority_pool_cases ?? 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Pending review pool</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Dark Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Telemetry Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Telemetry Ingestion & Anomaly Trends</h2>
              <p className="text-xs text-slate-500 mt-1">Entity volume ingestion frequency mapped against supervisor-flagged anomalies.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-indigo-600" />
                <span className="text-xs text-slate-600 font-medium">Alert Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-orange-400" />
                <span className="text-xs text-slate-600 font-medium">Cases Trend</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="alerts" fill="#4F46E5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="cases" stroke="#F97316" strokeWidth={3} dot={{ r: 4, fill: '#F97316', strokeWidth: 2, stroke: '#FFF' }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-sm">No telemetry data available</span>
              </div>
            )}
          </div>
        </div>

        {/* Dark Panel: Negative-Space Signals */}
        <div className="bg-[#1E1B4B] rounded-xl p-6 shadow-sm text-white flex flex-col relative overflow-hidden">
          {/* Subtle bg glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/30 blur-3xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">Active Inferences</div>
              <h2 className="text-lg font-bold">Negative-Space Signals</h2>
            </div>
            <Filter className="w-5 h-5 text-indigo-300" />
          </div>

          <div className="flex justify-center mb-6 relative z-10">
            {/* Custom SVG semi-circle gauge to match screenshot exactly */}
            <div className="relative w-40 h-24 flex flex-col items-center justify-end">
              <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#312E81" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 50 A 40 40 0 0 1 50 10" fill="none" stroke="#F97316" strokeWidth="12" strokeLinecap="round" />
                <path d="M 50 10 A 40 40 0 0 1 75 22" fill="none" stroke="#2DD4BF" strokeWidth="12" strokeLinecap="round" />
              </svg>
              <div className="absolute bottom-0 w-full flex justify-between px-2 text-[10px] font-bold text-indigo-200">
                <span>60% Silence</span>
                <span>40% Clamor</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 relative z-10 flex-1">
            {criticalEntities.length > 0 ? criticalEntities.map((ent, i) => (
              <div key={ent.id} className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white mb-0.5">{ent.key_concern || "Behavioral Anomaly"}</div>
                  <div className="text-[10px] text-indigo-200">{ent.name} • {ent.id}</div>
                </div>
                <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  {ent.cases_count} logs
                </span>
              </div>
            )) : (
              <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
                <span className="text-xs text-indigo-200">No critical inferences detected in current timeframe.</span>
              </div>
            )}
          </div>

          <button 
            onClick={() => onNavigate('copilot')}
            className="w-full py-2.5 mt-4 bg-orange-400 hover:bg-orange-500 text-orange-950 text-xs font-bold rounded-lg transition-colors relative z-10"
          >
            Examine Signal Ledger
          </button>
        </div>
      </div>

      {/* Lower Section: CSE Table & Baseline Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CSE Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Critical Sector Entities</h2>
              <p className="text-xs text-slate-500 mt-1">Ranked by supervisory deviation threshold.</p>
            </div>
            <button 
              onClick={() => { setSelectedSector('ALL'); setSearchQuery(''); }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
            {sectors.map((sector) => (
              <button
                key={sector}
                onClick={() => setSelectedSector(sector)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                  selectedSector === sector
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sector === 'ALL' ? `All Sectors (${data?.entities.length || 0})` : sector}
              </button>
            ))}
          </div>

          <div className="p-3 flex-1">
            {filteredEntities.length > 0 ? (
              <div className="space-y-2">
                {filteredEntities.slice(0, 4).map((entity) => (
                  <div 
                    key={entity.id}
                    onClick={() => onNavigate('assessment', entity.id)}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700">
                        {entity.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {entity.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {entity.sector} • {entity.cases_count.toLocaleString()} cases
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getAttentionBadge(entity.attention_level)}
                      <div className="w-8 h-8 rounded hover:bg-white flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-400">
                No entities match the selected criteria.
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {Math.min(4, filteredEntities.length)} of {filteredEntities.length} monitor operations</span>
            <div className="flex items-center gap-1">
              <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-400"><ChevronRight className="w-4 h-4 rotate-180" /></button>
              <button className="w-6 h-6 rounded flex items-center justify-center bg-indigo-900 text-white font-bold">1</button>
              <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-400"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Baseline Health */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Baseline Health</h2>
              <p className="text-xs text-slate-500 mt-1">Global confidence & integrity</p>
            </div>
            <div className="flex gap-2 text-slate-400">
              <button onClick={() => alert('Filter applied')} className="hover:text-indigo-600"><Filter className="w-4 h-4" /></button>
              <button onClick={fetchData} className="hover:text-indigo-600"><RefreshCw className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
              <span className="text-3xl font-bold text-slate-900">{confidence}%</span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">CONFIDENCE</span>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                Standard Operations
              </div>
              <span className="font-bold text-slate-900">
                {totalAnalyzed > 0 ? ((standardOps / totalAnalyzed) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <div className="w-2 h-2 rounded-full bg-rose-600" />
                Anomalous Deviations
              </div>
              <span className="font-bold text-slate-900">
                {totalAnalyzed > 0 ? ((anomalies / totalAnalyzed) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
            Consolidated peer norm calibrated at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Baseline Deviations */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Baseline Deviations</h2>
            <p className="text-[11px] text-slate-500 mt-1">Disproportionate sub-operational stress across monitored critical sector entities.</p>
          </div>
          <Activity className="w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 border-r border-slate-100 pr-6">
            {chartData.slice(0, 3).map((entity, i) => {
              const colors = ['bg-rose-700', 'bg-indigo-600', 'bg-teal-600'];
              const ratio = entity.alerts > 0 ? (entity.cases / entity.alerts) * 100 : 0;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">{entity.name}</span>
                    <span className="text-slate-500">
                      <span className="font-bold text-slate-900">{ratio.toFixed(1)}%</span> (Peer: {(ratio * 0.9).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div style={{ width: `${ratio}%` }} className={`h-full rounded-full ${colors[i % colors.length]}`} />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="w-full md:w-48 pl-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Peer Confidence Index</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{confidence.toFixed(1)}%</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100">Validated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permanent Purge Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-md w-full space-y-5">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => !isResetting && setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Permanently Purge Enclave Database?
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                This will permanently delete all stored telemetry logs, SimHash clusters, ChromaDB vector embeddings, and NCIIPC audit ledger records.
              </p>
              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-700 space-y-1">
                <div>• Target: <span className="text-rose-600 font-bold">sparse_index.sqlite (FTS5)</span></div>
                <div>• Target: <span className="text-rose-600 font-bold">ledger.sqlite (Audit Trail)</span></div>
                <div>• Target: <span className="text-rose-600 font-bold">chroma/sat_sa_incidents</span></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                The system will immediately revert to a clean slate (0 records). This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeDatabase}
                disabled={isResetting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                {isResetting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Purging Enclave...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Purge & Clean Slate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
