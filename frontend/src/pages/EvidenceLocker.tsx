import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Terminal, 
  Cpu, 
  Database, 
  ArrowRight, 
  AlertCircle,
  ShieldCheck,
  Hash,
  Layers,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { ingestEvidence } from '../services/api';
import { IngestResponse } from '../types/api';

interface EvidenceLockerProps {
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'copilot', cseId?: string) => void;
}

export const EvidenceLocker: React.FC<EvidenceLockerProps> = ({ onNavigate }) => {
  const [entityName, setEntityName] = useState('Selected Entity');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    { label: 'Computing SHA-256 Cryptographic Digest', icon: Hash },
    { label: 'SIMHASH Fuzzy Clustering & Compression', icon: Layers },
    { label: 'Ollama Vector Embedding & Semantic Storage', icon: Cpu },
    { label: 'NCIIPC Tamper-Proof Audit Ledger Commit', icon: Database },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select or drop a SOC log file to ingest.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setCurrentStage(0);

    // Progress animation while real API request runs
    const stageInterval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev < stages.length - 1) return prev + 1;
        return prev;
      });
    }, 700);

    try {
      const response = await ingestEvidence(entityName, selectedFile);
      clearInterval(stageInterval);
      setCurrentStage(stages.length);
      setResult(response);
    } catch (err: unknown) {
      clearInterval(stageInterval);
      const errMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(`Ingestion failed: ${errMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-primary font-semibold text-xs tracking-wider uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>Evidence Acquisition & Verification</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Air-Gapped Evidence Locker</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Submit raw SOC telemetry for automated cryptographic verification, SimHash de-duplication, and regulatory audit trail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload & Configuration Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-outline p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-primary" />
            Entity Evidence Metadata
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Critical Sector Entity (CSE)
            </label>
            <input
              type="text"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="e.g. Critical Sector Entity A"
              disabled={isProcessing}
              className="w-full px-4 py-2.5 rounded-xl border border-outline bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors font-medium text-gray-800"
            />
          </div>

          {/* Drag & Drop Zone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              SOC Telemetry Raw Export (JSON / CSV / LOG)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-primary bg-primary-container/40' 
                  : 'border-gray-200 hover:border-primary/50 bg-[#FAFBFD]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.log,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
              
              <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB  Ready to ingest
                  </p>
                  <span className="inline-block mt-3 px-3 py-1 bg-teal-50 text-accent-teal text-xs font-semibold rounded-lg border border-teal-200">
                    Click to swap file
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Drag and drop SOC log export here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports Wazuh, Splunk, Elastic, Sentinel or raw audit logs
                  </p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-2 bg-white border border-outline hover:border-gray-300 text-xs font-semibold text-gray-700 rounded-xl shadow-xs transition-colors"
                  >
                    Browse Files
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleUpload}
              disabled={isProcessing || !selectedFile}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                isProcessing || !selectedFile
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-primary text-white hover:bg-[#4d3e91] active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Ingesting Telemetry & Committing Ledger...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Execute Enclave Verification & Ingest</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Verification Terminal / Execution Status (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="bg-[#191924] rounded-2xl border border-gray-800 p-6 text-white shadow-sm flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-gray-400 ml-2">enclave://ingest-daemon</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-800 text-teal-400 border border-teal-500/30">
                AIR-GAP ACTIVE
              </span>
            </div>

            {/* Stepper Display */}
            <div className="space-y-4 my-auto py-2">
              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                const isComplete = result || (isProcessing && currentStage > idx);
                const isCurrent = isProcessing && currentStage === idx;
                
                return (
                  <div 
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                      isCurrent 
                        ? 'bg-purple-950/40 border border-purple-500/40 text-purple-200' 
                        : isComplete 
                        ? 'bg-gray-800/30 text-gray-300' 
                        : 'text-gray-600 opacity-60'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-accent-teal" />
                      ) : isCurrent ? (
                        <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-xs font-mono leading-relaxed">
                      <div className="font-semibold">{stage.label}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {isComplete 
                          ? 'VERIFIED & RECORDED' 
                          : isCurrent 
                          ? 'PROCESSING VIA HARDWARE ACCELERATOR...' 
                          : 'STANDBY'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-gray-800/80 text-[11px] font-mono text-gray-400 flex items-center justify-between">
              <span>NODE: NCIIPC-AG-04</span>
              <span>ISOLATION: STRICT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Card: Displaying Actual Cryptographic & Ingestion Data */}
      {result && (
        <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm bg-linear-to-r from-teal-50/40 via-white to-purple-50/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-accent-teal flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Ingestion Cryptographically Committed
                </h3>
                <p className="text-xs text-gray-500">
                  Case ID: <span className="font-mono font-bold text-gray-800">{result.case_id}</span>  Entity: <span className="font-semibold text-gray-800">{result.entity_name}</span>
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto px-3 py-1 bg-teal-100 text-teal-800 font-mono text-xs font-bold rounded-lg border border-teal-200">
              {result.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-gray-50 border border-outline flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Raw Telemetry Logs
                </span>
                <div className="text-4xl font-bold font-mono text-gray-900 mt-1 tabular-nums tracking-tighter">
                  {result.total_raw_logs.toLocaleString()}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-snug">
                Total unfiltered event logs ingested directly from the entity's SOC before processing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-outline flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  SimHash Clusters
                </span>
                <div className="text-4xl font-bold font-mono text-primary mt-1 tabular-nums tracking-tighter">
                  {result.deduplicated_clusters.toLocaleString()}
                </div>
              </div>
              <p className="text-xs text-primary/80 mt-2 leading-snug font-medium">
                Unique incident patterns identified after removing {((result.total_raw_logs - result.deduplicated_clusters)).toLocaleString()} duplicate/repeated alerts from the raw telemetry.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-outline flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Reduction Compression
                </span>
                <div className="text-4xl font-bold font-mono text-accent-teal mt-1 tabular-nums tracking-tighter">
                  {result.total_raw_logs > 0 
                    ? `${(((result.total_raw_logs - result.deduplicated_clusters) / result.total_raw_logs) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
              <p className="text-xs text-accent-teal/80 mt-2 leading-snug font-medium">
                Overall noise reduction achieved through fuzzy cryptographic clustering, eliminating redundant analyst review.
              </p>
            </div>
          </div>

          {/* Cryptographic SHA-256 Hash Box */}
          <div className="p-3.5 bg-gray-900 rounded-xl text-gray-200 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Hash className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-gray-400 text-[11px] shrink-0">SHA-256:</span>
              <span className="text-teal-300 select-all truncate text-[11px]">
                {result.sha256_hash}
              </span>
            </div>
            <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700 shrink-0 self-end sm:self-auto">
              TAMPER-PROOF LEDGER SEAL
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => onNavigate('overview')}
              className="px-4 py-2 border border-outline rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              National Overview
            </button>
            <button
              onClick={() => onNavigate('assessment', result.case_id)}
              className="px-5 py-2 bg-primary hover:bg-[#4d3e91] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <span>Inspect CSE Dossier</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
