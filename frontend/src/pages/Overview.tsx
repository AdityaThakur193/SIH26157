import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Building2, Layers, AlertTriangle, FileSearch, Search, ChevronRight, 
  RefreshCw, Upload, Trash2, AlertOctagon, X, CheckCircle2,
  Download, Play, Activity, ShieldAlert, Filter, ArrowRight, BarChart3,
  TrendingUp, Radio
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getOverview, resetDatabase } from '../services/api';
import { NationalOverviewResponse, CSESummary } from '../types/api';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { AnimatedCounter } from '../components/AnimatedCounter';

const GSAPModal = ({ children, onClose }: { children: React.ReactNode, onClose?: () => void }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 });
    gsap.fromTo(contentRef.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
  }, []);

  return (
    <div ref={overlayRef} className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4">
      <div ref={contentRef} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-md w-full space-y-5">
        {children}
      </div>
    </div>
  );
};

interface OverviewProps {
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'assessments' | 'copilot', cseId?: string) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
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

  // GSAP Choreographed Entry
  useGSAP(() => {
    if (!loading && data) {
      const tl = gsap.timeline();

      // 1. Header settles
      tl.fromTo(
        '.overview-header',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' }
      )
      // 2. KPI row staggers in
      .fromTo(
        '.overview-card',
        { opacity: 0, y: 15, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.1,
          duration: 0.4,
          ease: 'power3.out',
          clearProps: 'all'
        },
        '-=0.1'
      )
      // 3. Main chart/table area enters
      .fromTo(
        '.overview-section',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.15,
          duration: 0.5,
          ease: 'power3.out',
          clearProps: 'all'
        },
        '-=0.2'
      )
      // 4. Animate chart bars and line
      .fromTo(
        '.recharts-bar-rectangle',
        { scaleY: 0, transformOrigin: 'bottom' },
        { scaleY: 1, stagger: 0.05, duration: 0.4, ease: 'power3.out' },
        '-=0.1'
      )
      .fromTo(
        '.recharts-line-curve',
        { strokeDasharray: '0 1000' },
        { strokeDasharray: '1000 1000', duration: 1, ease: 'power2.inOut' },
        '-=0.3'
      );

      // ScrollTrigger for below-the-fold section
      gsap.fromTo(
        '.baseline-deviations',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.baseline-deviations',
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        }
      );
    }
  }, { scope: containerRef, dependencies: [loading, data] });

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
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs">
            High Attention
          </span>
        );
      case 'HIGH ATTENTION':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 shadow-2xs">
            Moderate
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100 shadow-2xs">
            Normal Pool
          </span>
        );
    }
  };

  // Entity metrics for Baseline Deviations & table
  const entityChartData = (data?.entities || []).map(e => ({
    name: e.name.length > 12 ? e.name.substring(0, 12) + '…' : e.name,
    fullName: e.name,
    alerts: e.alerts_count,
    cases: e.cases_count
  }));

  // Chronological timeline for Telemetry Ingestion & Anomaly Trends (Option A)
  const timelineChartData = (data?.timeline && data.timeline.length > 0)
    ? data.timeline
    : entityChartData.map(e => ({
        period: e.name,
        alerts: e.alerts,
        cases: e.cases
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
    <div ref={containerRef} className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Top Banner & Header */}
      <div className="overview-header flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervisory Assessment Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cross-entity operational pattern analysis and supervisory anomaly detection across Critical Sector Entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowResetModal(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all active:scale-95 cursor-pointer"
            title="Purge Database"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all active:scale-95 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Summary</span>
          </button>

          <button
            onClick={() => onNavigate('evidence')}
            className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run Evaluation</span>
          </button>
        </div>
      </div>

      {resetSuccessMessage && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-teal-800 text-sm font-medium animate-in fade-in duration-200">
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={fetchData} className="underline hover:text-rose-900 font-bold">Retry</button>
        </div>
      )}

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="overview-card bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evaluated CSEs</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2 font-mono">
            <AnimatedCounter value={entityChartData.length} />
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            <span>Active critical sector entities</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="overview-card bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alerts Analyzed</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2 font-mono">
            {loading ? '...' : <AnimatedCounter value={data?.alerts_analyzed ?? 0} />}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
            <span>Raw SOC telemetry events</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="overview-card bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flagged Signals</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2 font-mono">
            {loading ? '...' : <AnimatedCounter value={data?.supervisory_findings ?? 0} />}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            <span>Requires human review</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="overview-card bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Cases</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-2 font-mono">
            {loading ? '...' : <AnimatedCounter value={data?.priority_pool_cases ?? 0} />}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Pending review pool</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Dark Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Telemetry Chart */}
        <div className="overview-section lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Telemetry Ingestion & Anomaly Trends</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Chronological alert ingestion volume mapped against supervisor-flagged anomaly spikes.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-xs bg-indigo-600" />
                <span className="text-xs text-slate-600 font-medium">Alert Volume</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-orange-400" />
                <span className="text-xs text-slate-600 font-medium">Cases Trend</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[260px] w-full">
            {timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timelineChartData} margin={{ top: 20, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#4338CA" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} dy={10} />
                  {/* Left Y-Axis: Raw Alert Volume */}
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748B' }} 
                  />
                  {/* Right Y-Axis: Incident Cases Trend (Scales independently) */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#F97316' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #E2E8F0', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                      backdropFilter: 'blur(8px)',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: any) => [
                      Number(value).toLocaleString(),
                      name === 'alerts' ? 'Raw Alerts' : 'Incident Cases'
                    ]}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="alerts" 
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={44} 
                    isAnimationActive={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="cases" 
                    stroke="#F97316" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#F97316', strokeWidth: 2, stroke: '#FFFFFF' }} 
                    activeDot={{ r: 7, stroke: '#FFEDD5', strokeWidth: 3 }}
                    isAnimationActive={false}
                  />
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

        {/* Dark Panel: Negative-Space Signals (Fixed Gauge & Layout) */}
        <div className="overview-section bg-[#141238] rounded-xl p-6 shadow-sm text-white flex flex-col relative overflow-hidden border border-indigo-950/50">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-indigo-500/25 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-teal-500/15 blur-3xl rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">
                <Radio className="w-3 h-3 text-orange-400 animate-pulse" />
                <span>Active Inferences</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Negative-Space Signals</h2>
            </div>
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-indigo-300">
              <Filter className="w-4 h-4" />
            </div>
          </div>

          {/* Clean Mathematical Semi-Circle Gauge (Non-overlapping) */}
          <div className="flex flex-col items-center justify-center py-2 relative z-10">
            <div className="relative w-44 h-24 flex items-center justify-center">
              <svg viewBox="0 0 120 68" className="w-full h-full overflow-visible">
                {/* Background track */}
                <path 
                  d="M 16 60 A 44 44 0 0 1 104 60" 
                  fill="none" 
                  stroke="#26235C" 
                  strokeWidth="10" 
                  strokeLinecap="round" 
                />
                {/* 60% Silence Segment (Orange): 180 deg to 72 deg */}
                <path 
                  d="M 16 60 A 44 44 0 0 1 73.6 18.2" 
                  fill="none" 
                  stroke="#F97316" 
                  strokeWidth="10" 
                  strokeLinecap="round" 
                />
                {/* 40% Clamor Segment (Teal): 72 deg to 0 deg */}
                <path 
                  d="M 73.6 18.2 A 44 44 0 0 1 104 60" 
                  fill="none" 
                  stroke="#2DD4BF" 
                  strokeWidth="10" 
                  strokeLinecap="round" 
                />
              </svg>
              
              {/* Center Ratio Display */}
              <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-bold font-mono text-white tracking-wider">60 : 40</span>
                <span className="text-[9px] font-semibold text-indigo-300 uppercase tracking-widest">Ratio</span>
              </div>
            </div>

            {/* Clear Legend Pills Below Gauge */}
            <div className="w-full flex items-center justify-between px-3 py-1.5 mt-2 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold">
              <div className="flex items-center gap-1.5 text-orange-400">
                <span className="w-2 h-2 rounded-full bg-orange-400 shadow-xs" />
                <span>60% Silence</span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-400">
                <span className="w-2 h-2 rounded-full bg-teal-400 shadow-xs" />
                <span>40% Clamor</span>
              </div>
            </div>
          </div>

          {/* Inferences Feed */}
          <div className="space-y-2.5 mt-3 relative z-10 flex-1">
            {criticalEntities.length > 0 ? criticalEntities.map((ent) => (
              <div 
                key={ent.id} 
                onClick={() => onNavigate('copilot')}
                className="bg-white/5 hover:bg-white/10 rounded-lg p-3 border border-white/10 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                    {ent.key_concern || "Behavioral Anomaly"}
                  </div>
                  <div className="text-[10px] text-indigo-200 mt-0.5">{ent.name} • {ent.id}</div>
                </div>
                <span className="px-2 py-1 rounded bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 text-[10px] font-bold font-mono">
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
            className="w-full py-2.5 mt-4 bg-orange-400 hover:bg-orange-500 active:scale-95 text-orange-950 text-xs font-bold rounded-lg transition-all shadow-sm relative z-10 cursor-pointer"
          >
            Examine Signal Ledger
          </button>
        </div>
      </div>

      {/* Lower Section: CSE Table & Baseline Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CSE Table */}
        <div className="overview-section lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Critical Sector Entities</h2>
              <p className="text-xs text-slate-500 mt-1">Ranked by supervisory deviation threshold.</p>
            </div>
            <button 
              onClick={() => onNavigate('assessments')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="px-5 py-3 border-b border-slate-100 flex gap-2 overflow-x-auto">
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
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {entity.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {entity.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {entity.sector} • <span className="font-mono">{entity.cases_count.toLocaleString()} cases</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getAttentionBadge(entity.attention_level)}
                      <div className="w-8 h-8 rounded-lg hover:bg-white flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">
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
              <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-400 cursor-pointer"><ChevronRight className="w-4 h-4 rotate-180" /></button>
              <button className="w-6 h-6 rounded flex items-center justify-center bg-indigo-900 text-white font-bold">1</button>
              <button className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-100 text-slate-400 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Baseline Health */}
        <div className="overview-section bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Baseline Health</h2>
              <p className="text-xs text-slate-500 mt-1">Global confidence & integrity</p>
            </div>
            <div className="flex gap-2 text-slate-400">
              <button onClick={() => alert('Filter applied')} className="hover:text-indigo-600 cursor-pointer p-1 rounded hover:bg-slate-100 transition"><Filter className="w-4 h-4" /></button>
              <button onClick={fetchData} className="hover:text-indigo-600 cursor-pointer p-1 rounded hover:bg-slate-100 transition"><RefreshCw className="w-4 h-4" /></button>
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
              <span className="text-3xl font-bold text-slate-900 font-mono">{confidence}%</span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">CONFIDENCE</span>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <div className="w-2 h-2 rounded-full bg-indigo-600" />
                Standard Operations
              </div>
              <span className="font-bold text-slate-900 font-mono">
                {totalAnalyzed > 0 ? ((standardOps / totalAnalyzed) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-medium text-slate-700">
                <div className="w-2 h-2 rounded-full bg-rose-600" />
                Anomalous Deviations
              </div>
              <span className="font-bold text-slate-900 font-mono">
                {totalAnalyzed > 0 ? ((anomalies / totalAnalyzed) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Consolidated peer norm calibrated at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Baseline Deviations */}
      <div className="baseline-deviations overview-section bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Baseline Deviations</h2>
            <p className="text-[11px] text-slate-500 mt-1">Disproportionate sub-operational stress across monitored critical sector entities.</p>
          </div>
          <Activity className="w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6 border-r border-slate-100 pr-6">
            {entityChartData.slice(0, 3).map((entity, i) => {
              const colors = ['bg-rose-600', 'bg-indigo-600', 'bg-teal-600'];
              const ratio = entity.alerts > 0 ? (entity.cases / entity.alerts) * 100 : 0;
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">{entity.name}</span>
                    <span className="text-slate-500">
                      <span className="font-bold text-slate-900 font-mono">{ratio.toFixed(1)}%</span> (Peer: {(ratio * 0.9).toFixed(1)}%)
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
              <span className="text-2xl font-bold text-slate-900 font-mono">{confidence.toFixed(1)}%</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-600 border border-teal-100">Validated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Permanent Purge Confirmation Modal */}
      {showResetModal && createPortal(
        <GSAPModal>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => !isResetting && setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
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
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeDatabase}
                disabled={isResetting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Purge & Clean Slate</span>
                  </>
                )}
              </button>
            </div>
        </GSAPModal>,
        document.body
      )}

    </div>
  );
};
