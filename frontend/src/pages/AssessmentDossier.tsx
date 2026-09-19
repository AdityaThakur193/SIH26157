import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Upload, CheckCircle2, AlertOctagon, Sparkles, FileText, ChevronRight
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getAssessment, ingestCompliance } from '../services/api';
import { CSEDetailResponse, DimensionMetric } from '../types/api';

interface AssessmentDossierProps {
  cseId: string;
  onNavigate: (view: string, cseId?: string, extraData?: string) => void;
}

export const AssessmentDossier: React.FC<AssessmentDossierProps> = ({ cseId, onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<CSEDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUploadingPolicy, setIsUploadingPolicy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);
  const ismsFileInputRef = useRef<HTMLInputElement>(null);

  useGSAP(() => {
    if (!loading && data) {
      const tl = gsap.timeline();
      
      tl.fromTo(
        '.dossier-header',
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' }
      )
      .fromTo(
        '.dossier-stat',
        { opacity: 0, y: 16, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.45, ease: 'power3.out', clearProps: 'all' },
        '-=0.1'
      )
      .fromTo(
        '.dimension-card',
        { opacity: 0, scale: 0.95 },
        { opacity: 1, scale: 1, stagger: 0.08, duration: 0.4, ease: 'power2.out', clearProps: 'all' },
        '-=0.2'
      );
    }
  }, { scope: containerRef, dependencies: [loading, data] });

  const fetchDossier = async () => {
    if (!data) setLoading(true);
    setError(null);
    try {
      if (containerRef.current && data) {
        gsap.to(containerRef.current, { opacity: 0.5, duration: 0.2 });
      }
      const res = await getAssessment(cseId);
      setData(res);
      if (containerRef.current) {
        gsap.to(containerRef.current, { opacity: 1, duration: 0.3 });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load assessment dossier';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [cseId]);

  const handleUploadClick = () => {
    ismsFileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPolicy(true);
    setPolicyMessage(null);
    try {
      await ingestCompliance(cseId, file);
      setPolicyMessage(`Successfully ingested ISMS policy: ${file.name}`);
      await fetchDossier();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
    } finally {
      setIsUploadingPolicy(false);
      if (ismsFileInputRef.current) {
        ismsFileInputRef.current.value = '';
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium">Retrieving supervisory dossier for {cseId}...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 flex flex-col items-center text-center space-y-3">
        <AlertOctagon className="w-10 h-10 text-rose-500" />
        <h3 className="text-rose-900 font-bold">Failed to load dossier</h3>
        <p className="text-rose-700 text-sm max-w-md">{error}</p>
        <button 
          onClick={fetchDossier}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-bold mt-2"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto pb-10 space-y-8 animate-in fade-in duration-300">
      
      {/* Hidden file input for ISMS Policy */}
      <input 
        type="file" 
        ref={ismsFileInputRef} 
        onChange={handleFileSelected}
        className="hidden" 
        accept=".pdf,.txt,.doc,.docx"
      />

      {/* Header */}
      <div className="dossier-header flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-4">
          <button 
            onClick={() => onNavigate('assessments')}
            className="mt-1 p-2 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              Supervisory Assessment Dossier
            </div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {data.cse_name}
              </h1>
              <span className="text-sm font-mono text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1.5" title="System-generated case identifier">
                {data.cse_id}
                <span className="font-sans text-[9px] uppercase tracking-wider text-slate-300 border border-slate-200 px-1 rounded-sm bg-white">Auto-ID</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleUploadClick}
            disabled={isUploadingPolicy}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            {isUploadingPolicy ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>Audit ISMS Policy</span>
          </button>

          <button 
            onClick={() => onNavigate('copilot')}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 border border-indigo-100 rounded-xl text-sm font-bold flex items-center gap-2 shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Forensic Copilot & Evidence</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {policyMessage && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center gap-2 text-teal-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
          {policyMessage}
        </div>
      )}

      {/* Meta Card & Stats */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-bold text-slate-400 tracking-wider">SECTOR TIER:</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[10px]">{data.tier}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-400 tracking-wider">AUDIT CYCLE:</span>
              <span className="text-slate-700 font-bold">{data.audit_window}</span>
            </div>
            <div className="text-xs text-slate-500">
              Assigned Supervisory Examiner: <span className="font-bold text-slate-900">{data.examiner}</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 tracking-wider mb-1 uppercase">Supervisory Tier</div>
            <span className={`px-4 py-1 rounded-lg text-xs font-bold border ${
              data.attention_level === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              {data.attention_level}
            </span>
          </div>
        </div>

        {/* 6 Stat Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          
          <div className="dossier-stat border border-slate-100 rounded-xl p-4 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Raw Telemetry</div>
            <div className="inline-block bg-indigo-600 text-white px-2 py-0.5 rounded text-xl font-bold font-mono shadow-xs">
              {data.alerts_ingested.toLocaleString()}
            </div>
          </div>

          <div className="dossier-stat border border-slate-100 rounded-xl p-4 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">SimHash Clusters</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {data.cases_correlated.toLocaleString()}
            </div>
          </div>

          <div className="dossier-stat border border-slate-100 rounded-xl p-4 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Formal Investigations</div>
            <div className="text-xl font-bold text-rose-600 font-mono">
              {data.formal_investigations.toLocaleString()}
            </div>
          </div>

          <div className="dossier-stat border border-slate-100 rounded-xl p-4 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Escalations Logged</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {data.escalations_logged.toLocaleString()}
            </div>
          </div>

          <div className="dossier-stat border border-slate-100 rounded-xl p-4 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Peer Variance</div>
            <div className="text-xl font-bold text-orange-500 font-mono">
              {data.peer_variance_index}
            </div>
          </div>

          <div className="dossier-stat border border-slate-100 rounded-xl p-4 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Priority Review</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {data.manual_review_queue_count.toLocaleString()}
            </div>
          </div>

        </div>
      </div>

      {/* Dimensions Header */}
      <div className="flex items-end justify-between pt-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Supervisory Evaluation Dimensions</h2>
          <p className="text-sm text-slate-500 mt-1">Automated statutory compliance and technical fidelity verification.</p>
        </div>
        <div className="text-xs font-mono font-medium text-slate-400">
          {data.dimensions.length}/{data.dimensions.length} Dimensions Evaluated
        </div>
      </div>

      {/* Dimensions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.dimensions.map((dim: DimensionMetric, i: number) => {
          
          let badgeClass = "bg-slate-100 text-slate-600";
          if (dim.status_color === "red") badgeClass = "bg-rose-50 text-rose-600 border border-rose-100";
          if (dim.status_color === "green") badgeClass = "bg-teal-50 text-teal-600 border border-teal-100";
          if (dim.status_color === "yellow") badgeClass = "bg-amber-50 text-amber-600 border border-amber-100";
          if (dim.status_color === "gray") badgeClass = "bg-slate-100 text-slate-500 border border-slate-200";

          return (
            <div key={i} className="dimension-card bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,border-color] duration-200">
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-1">
                    <span className={`text-lg font-black uppercase tracking-tight ${dim.status_color === "red" ? 'text-rose-600' : dim.status_color === "green" ? 'text-teal-600' : dim.status_color === "yellow" ? 'text-amber-600' : 'text-slate-500'}`}>
                      {dim.status_label}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900 font-mono tracking-tighter tabular-nums leading-none">
                        {dim.findings_count}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Findings</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold font-mono tracking-wider">
                    {dim.domain_code}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-slate-700 mb-1">{dim.title}</h3>
                <p className="text-[11px] text-slate-500 leading-snug mb-3 flex-1 font-medium">
                  {dim.domain_code === 'DET-01' ? "Composite risk metric derived from anomaly frequency, severity, and peer variance. Scores above 80 require immediate attention." :
                   dim.domain_code === 'ANM-02' ? "Spike of high-severity events compared to a 30-day trailing baseline." :
                   dim.domain_code === 'CMP-03' ? "Verification of required compliance documentation against NCIIPC standards." :
                   dim.domain_code === 'PRV-04' ? "Deviation of anomaly frequency compared against the sector average baseline." :
                   dim.domain_code === 'AST-05' ? "Number of distinct critical assets currently exposed to high-severity alerts." :
                   dim.domain_code === 'FID-06' ? "Ratio of unique incident patterns identified after removing duplicate/repeated alerts." : ""}
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Trigger Context
                    </div>
                    <div className="text-[11px] font-medium text-slate-700">
                      {dim.evaluation_metric}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Fidelity Gap / Finding
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {dim.fidelity_gap}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end text-xs mt-auto bg-slate-50/50 rounded-b-2xl h-12">
                {dim.findings_count > 0 ? (
                  <button 
                    onClick={() => onNavigate('evidence-view', data.cse_id, dim.domain_code)}
                    className="font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Forensic Audit <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="font-bold text-slate-400">No Forensic Evidence</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
