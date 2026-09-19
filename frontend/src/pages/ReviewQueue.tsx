import React, { useState, useEffect, useRef } from 'react';
import { 
  ListChecks, Search, ChevronRight, Clock, ShieldAlert, ShieldCheck, 
  AlertTriangle, CheckCircle2, FileText, Sparkles, RefreshCw,
  Check, AlertOctagon
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getOverview, adjudicateEntity } from '../services/api';
import { NationalOverviewResponse, CSESummary } from '../types/api';

interface ReviewQueueProps {
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'assessments' | 'copilot' | 'findings' | 'review-queue', cseId?: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<NationalOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'adjudicated'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [adjudicatingId, setAdjudicatingId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getOverview();
      setData(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load adjudication queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initial load animation
  useGSAP(() => {
    if (!loading && data) {
      const tl = gsap.timeline();
      
      tl.fromTo(
        '.queue-header',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' }
      )
      .fromTo(
        '.queue-tabs',
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' },
        '-=0.1'
      );
    }
  }, { scope: containerRef, dependencies: [loading, data] });

  // Tab switch list animation
  useGSAP(() => {
    if (!loading && data) {
      gsap.fromTo(
        '.queue-card',
        { opacity: 0, y: 15, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.05,
          duration: 0.3,
          ease: 'power3.out',
          clearProps: 'all'
        }
      );
    }
  }, { scope: containerRef, dependencies: [loading, data, activeTab, searchQuery] });

  const handleAdjudicate = async (cseId: string, verdict: 'APPROVED' | 'ESCALATED' | 'REMEDIATION_REQUIRED') => {
    setAdjudicatingId(cseId);
    setActionSuccess(null);
    try {
      const remarks = 
        verdict === 'APPROVED' ? 'Statutory evaluation certified by human examiner.' :
        verdict === 'ESCALATED' ? 'Escalated for formal Section 70B inquiry and deep forensics.' :
        'Corrective Action Plan (CAP) demanded within 15 calendar days.';

      await adjudicateEntity(cseId, verdict, remarks);
      setActionSuccess(`Case ${cseId} successfully marked as ${verdict}`);
      await fetchData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Adjudication failed');
    } finally {
      setAdjudicatingId(null);
    }
  };

  const entities = data?.entities || [];

  const pendingEntities = entities.filter(
    (e) => !e.review_status || e.review_status === 'Pending'
  );

  const adjudicatedEntities = entities.filter(
    (e) => e.review_status && e.review_status !== 'Pending'
  );

  const displayList = 
    activeTab === 'pending' ? pendingEntities :
    activeTab === 'adjudicated' ? adjudicatedEntities :
    entities;

  const filteredList = displayList.filter((entity) => {
    const q = searchQuery.toLowerCase();
    return entity.name.toLowerCase().includes(q) || entity.id.toLowerCase().includes(q) || entity.sector.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
            <Check className="w-3 h-3" /> CERTIFIED COMPLIANT
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3" /> FORMAL ESCALATION
          </span>
        );
      case 'REMEDIATION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> CAP MANDATED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3 h-3" /> AWAITING ADJUDICATION
          </span>
        );
    }
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="queue-header flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <ListChecks className="w-4 h-4" />
            <span>Screen 06: Review Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Pending Adjudications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Priority Critical Sector Entities awaiting human supervisory examiner evaluation and verdict.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl flex items-center gap-3 text-sm font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Status Strip */}
      <div className="queue-tabs grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Awaiting Review</div>
          <div className="text-2xl font-black text-indigo-600 font-mono">
            {pendingEntities.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Unadjudicated cases</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Critical Urgency</div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            {pendingEntities.filter(e => e.attention_level === 'CRITICAL').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Immediate intervention</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Adjudicated & Certified</div>
          <div className="text-2xl font-black text-teal-600 font-mono">
            {adjudicatedEntities.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Completed reviews</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Monitored</div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            {entities.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Active CSE dossiers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="queue-tabs bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Adjudication ({pendingEntities.length})
          </button>
          <button
            onClick={() => setActiveTab('adjudicated')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'adjudicated'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Adjudicated ({adjudicatedEntities.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Entities ({entities.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search CSE ID or entity name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold">Loading adjudication roster...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          <p className="font-bold">Error loading review queue</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}

      {/* Empty State when zero items match the active filter */}
      {!loading && !error && filteredList.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
            <Clock className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">
            {activeTab === 'pending' ? 'No pending reviews' : 'No entities found'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm">
            {activeTab === 'pending'
              ? 'All ingested cases have been processed or adjudicated. New telemetry flagged by the SAT-SA engine will appear here.'
              : 'Try clearing your search query or switching to another filter.'}
          </p>
          <button 
            onClick={() => { setActiveTab('all'); setSearchQuery(''); }}
            className="mt-5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            View All Entities
          </button>
        </div>
      )}

      {/* Roster of Adjudication Cards */}
      {!loading && !error && filteredList.length > 0 && (
        <div className="space-y-4">
          {filteredList.map((entity: CSESummary) => {
            const isCritical = entity.attention_level === 'CRITICAL';
            const isPending = !entity.review_status || entity.review_status === 'Pending';
            const isWorking = adjudicatingId === entity.id;

            return (
              <div
                key={entity.id}
                className="queue-card bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-[box-shadow,border-color] duration-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Identity & Metadata */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      {entity.id}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {entity.sector}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">
                      Cycle: {entity.period}
                    </span>
                    <span className="ml-auto lg:ml-2">
                      {getStatusBadge(entity.review_status)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {entity.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-500">Supervisory Finding:</span>
                      <span className={isCritical ? 'text-rose-600 font-semibold' : 'text-slate-700'}>
                        {entity.key_concern}
                      </span>
                    </p>
                  </div>

                  {/* Telemetry Chips */}
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="text-slate-400 font-medium">Alerts:</span>
                      <span className="font-mono font-bold text-slate-900">{entity.alerts_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="text-slate-400 font-medium">SimHash Clusters:</span>
                      <span className="font-mono font-bold text-slate-900">{entity.cases_count.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="text-slate-400 font-medium">Risk Level:</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        isCritical ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-teal-50 text-teal-600 border border-teal-100'
                      }`}>
                        {entity.attention_level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions and Adjudication Controls */}
                <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Inspection Link Buttons */}
                  <button
                    onClick={() => onNavigate('assessment', entity.id)}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-200 cursor-pointer"
                    title="Open Full Assessment Dossier"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Dossier</span>
                  </button>

                  <button
                    onClick={() => onNavigate('copilot', entity.id)}
                    className="px-3 py-2 bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-purple-100 cursor-pointer"
                    title="Launch Forensic Copilot"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Evidence</span>
                  </button>

                  {/* Adjudication Decision Buttons */}
                  {isPending ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          gsap.fromTo(e.currentTarget, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
                          handleAdjudicate(entity.id, 'APPROVED');
                        }}
                        disabled={isWorking}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-50"
                        title="Certify Statutory Compliance"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Certify</span>
                      </button>

                      <button
                        onClick={(e) => {
                          gsap.fromTo(e.currentTarget, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
                          handleAdjudicate(entity.id, 'ESCALATED');
                        }}
                        disabled={isWorking}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-50"
                        title="Escalate for Formal Section 70B Inquiry"
                      >
                        <AlertOctagon className="w-3.5 h-3.5" />
                        <span>Escalate</span>
                      </button>

                      <button
                        onClick={(e) => {
                          gsap.fromTo(e.currentTarget, { scale: 0.9 }, { scale: 1, duration: 0.3, ease: 'back.out(1.5)' });
                          handleAdjudicate(entity.id, 'REMEDIATION_REQUIRED');
                        }}
                        disabled={isWorking}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-50"
                        title="Mandate Corrective Action Plan (CAP)"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Remediate</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjudicate(entity.id, 'APPROVED')}
                        disabled={isWorking}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                        title="Re-open or modify verdict"
                      >
                        Change Verdict
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
