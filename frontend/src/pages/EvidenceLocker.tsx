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
  CheckCircle2,
  X,
  File as FileIcon
} from 'lucide-react';
import { ingestEvidence } from '../services/api';
import { IngestResponse } from '../types/api';

interface EvidenceLockerProps {
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'copilot', cseId?: string) => void;
}

interface UploadResult {
  file: File;
  result?: IngestResponse;
  error?: string;
}

export const EvidenceLocker: React.FC<EvidenceLockerProps> = ({ onNavigate }) => {
  const [entityName, setEntityName] = useState('Selected Entity');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);
  const [currentStage, setCurrentStage] = useState<number>(0);
  
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [batchComplete, setBatchComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    { label: 'Computing SHA-256 Cryptographic Digest', icon: Hash },
    { label: 'SIMHASH Fuzzy Clustering & Compression', icon: Layers },
    { label: 'Ollama Vector Embedding & Semantic Storage', icon: Cpu },
    { label: 'NCIIPC Tamper-Proof Audit Ledger Commit', icon: Database },
  ];

  const appendFiles = (filesList: FileList | File[]) => {
    const newFiles = Array.from(filesList);
    setSelectedFiles(prev => {
      // Deduplicate by name and size
      const existingSignatures = new Set(prev.map(f => `${f.name}-${f.size}`));
      const uniqueNewFiles = newFiles.filter(f => !existingSignatures.has(`${f.name}-${f.size}`));
      return [...prev, ...uniqueNewFiles];
    });
    setGlobalError(null);
    setBatchComplete(false);
    setUploadResults([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      appendFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      appendFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
    setGlobalError(null);
    setBatchComplete(false);
    setUploadResults([]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setGlobalError('Please select or drop at least one SOC log file to ingest.');
      return;
    }

    setIsProcessing(true);
    setGlobalError(null);
    setBatchComplete(false);
    
    const results: UploadResult[] = [];
    setUploadResults(results);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setCurrentFileIndex(i);
      setCurrentStage(0);

      // Progress animation while real API request runs
      const stageInterval = setInterval(() => {
        setCurrentStage((prev) => {
          if (prev < stages.length - 1) return prev + 1;
          return prev;
        });
      }, 700);

      try {
        const response = await ingestEvidence(entityName, file);
        clearInterval(stageInterval);
        setCurrentStage(stages.length);
        
        const newResult = { file, result: response };
        results.push(newResult);
        setUploadResults([...results]);
      } catch (err: unknown) {
        clearInterval(stageInterval);
        const errMsg = err instanceof Error ? err.message : 'Upload failed';
        const newResult = { file, error: errMsg };
        results.push(newResult);
        setUploadResults([...results]);
      }
    }

    setIsProcessing(false);
    setCurrentFileIndex(-1);
    setBatchComplete(true);
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const successfulResults = uploadResults.filter(r => r.result);
  const failedResults = uploadResults.filter(r => r.error);
  
  const aggregateRaw = successfulResults.reduce((acc, r) => acc + (r.result?.total_raw_logs || 0), 0);
  const aggregateClusters = successfulResults.reduce((acc, r) => acc + (r.result?.deduplicated_clusters || 0), 0);
  const latestCaseId = successfulResults.length > 0 ? successfulResults[0].result?.case_id : null;

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
          Submit raw SOC telemetry batches for automated cryptographic verification, SimHash de-duplication, and regulatory audit trail.
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
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                SOC Telemetry Raw Export (JSON / CSV / LOG)
              </label>
              {selectedFiles.length > 0 && !isProcessing && (
                <button 
                  onClick={clearAllFiles}
                  className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-primary bg-primary-container/40' 
                  : 'border-gray-200 hover:border-primary/50 bg-[#FAFBFD]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.log,.txt"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore - webkitdirectory is non-standard but widely supported
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
              
              <div className="w-12 h-12 rounded-2xl bg-primary-container text-primary flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Drag and drop SOC log exports here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports multiple files (Wazuh, Splunk, Elastic, Sentinel or raw audit logs)
                </p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); !isProcessing && fileInputRef.current?.click(); }}
                    className="px-4 py-2 bg-white border border-outline hover:border-gray-300 text-xs font-semibold text-gray-700 rounded-xl shadow-xs transition-colors"
                  >
                    Browse Files
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); !isProcessing && folderInputRef.current?.click(); }}
                    className="px-4 py-2 bg-white border border-outline hover:border-gray-300 text-xs font-semibold text-gray-700 rounded-xl shadow-xs transition-colors"
                  >
                    Browse Folders
                  </button>
                </div>
              </div>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 px-1">
                  <span>{selectedFiles.length} file{selectedFiles.length !== 1 && 's'} queued</span>
                  <span>{(totalSize / (1024 * 1024)).toFixed(2)} MB total</span>
                </div>
                <div className="max-h-48 overflow-y-auto gap-2 pr-1 custom-scrollbar flex flex-col">
                  {selectedFiles.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex items-center justify-between bg-gray-50 border border-outline p-2.5 rounded-lg shrink-0">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-gray-800 truncate">{f.name}</p>
                          <p className="text-[10px] text-gray-500">{(f.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      {!isProcessing && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {globalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{globalError}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleUpload}
              disabled={isProcessing || selectedFiles.length === 0}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                isProcessing || selectedFiles.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-primary text-white hover:bg-[#4d3e91] active:scale-[0.99]'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Ingesting Batch & Committing Ledger...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Execute Batch Ingestion</span>
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

            {/* Batch Progress Header */}
            {isProcessing && currentFileIndex >= 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-[11px] font-mono text-gray-300 mb-1">
                  <span className="truncate pr-2">Processing File {currentFileIndex + 1} of {selectedFiles.length}: {selectedFiles[currentFileIndex].name}</span>
                  <span className="shrink-0">{Math.round(((currentFileIndex) / selectedFiles.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${((currentFileIndex) / selectedFiles.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Live Terminal Log / History */}
            {uploadResults.length > 0 && (
              <div className="gap-2 flex flex-col mb-4 max-h-64 overflow-y-auto custom-scrollbar font-mono text-[10px] border-b border-gray-800 pb-4">
                {uploadResults.map((r, idx) => (
                  <div key={idx} className={`flex items-start gap-2 shrink-0 ${r.error ? 'text-red-400' : 'text-teal-400'}`}>
                    <span className="shrink-0">{r.error ? '✖' : '✔'}</span>
                    <span className="break-all">
                      {r.file.name} — {r.error ? `FAILED: ${r.error}` : `${r.result?.total_raw_logs.toLocaleString()} logs, ${r.result?.deduplicated_clusters.toLocaleString()} clusters [COMMITTED]`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Stepper Display for Active File */}
            <div className="space-y-4 my-auto py-2">
              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                const isComplete = !isProcessing && batchComplete 
                  ? true 
                  : (isProcessing && currentStage > idx);
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

            <div className="pt-4 border-t border-gray-800/80 text-[11px] font-mono text-gray-400 flex items-center justify-between mt-4">
              <span>NODE: NCIIPC-AG-04</span>
              <span>ISOLATION: STRICT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate Result Card */}
      {batchComplete && (
        <div className="bg-white rounded-2xl border border-teal-200 p-6 shadow-sm bg-linear-to-r from-teal-50/40 via-white to-purple-50/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${failedResults.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-accent-teal'}`}>
                {failedResults.length > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Batch Ingestion Completed
                </h3>
                <p className="text-xs text-gray-500">
                  Entity: <span className="font-semibold text-gray-800">{entityName}</span> {latestCaseId && ` | Case ID: `}<span className="font-mono font-bold text-gray-800">{latestCaseId}</span>
                </p>
              </div>
            </div>

            <span className={`self-start sm:self-auto px-3 py-1 font-mono text-xs font-bold rounded-lg border ${failedResults.length > 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-teal-100 text-teal-800 border-teal-200'}`}>
              {successfulResults.length} SUCCEEDED, {failedResults.length} FAILED
            </span>
          </div>

          {failedResults.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
              <p className="text-xs font-bold text-red-800">Errors encountered:</p>
              <ul className="text-xs text-red-700 list-disc list-inside">
                {failedResults.map((r, i) => (
                  <li key={i} className="truncate">{r.file.name}: {r.error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-gray-50 border border-outline flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Aggregate Raw Logs
                </span>
                <div className="text-4xl font-bold font-mono text-gray-900 mt-1 tabular-nums tracking-tighter">
                  {aggregateRaw.toLocaleString()}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-snug">
                Total unfiltered event logs ingested directly from the entity's SOC across {successfulResults.length} file(s).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-outline flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Aggregate SimHash Clusters
                </span>
                <div className="text-4xl font-bold font-mono text-primary mt-1 tabular-nums tracking-tighter">
                  {aggregateClusters.toLocaleString()}
                </div>
              </div>
              <p className="text-xs text-primary/80 mt-2 leading-snug font-medium">
                Unique incident patterns identified after removing {(aggregateRaw - aggregateClusters).toLocaleString()} duplicate/repeated alerts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-outline flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Total Reduction Compression
                </span>
                <div className="text-4xl font-bold font-mono text-accent-teal mt-1 tabular-nums tracking-tighter">
                  {aggregateRaw > 0 
                    ? `${(((aggregateRaw - aggregateClusters) / aggregateRaw) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
              </div>
              <p className="text-xs text-accent-teal/80 mt-2 leading-snug font-medium">
                Overall noise reduction achieved through fuzzy cryptographic clustering, eliminating redundant analyst review.
              </p>
            </div>
          </div>

          {/* Cryptographic SHA-256 Hash Box (Multiple Hashes) */}
          <div className="p-3.5 bg-gray-900 rounded-xl text-gray-200 font-mono text-xs flex flex-col gap-2 max-h-56 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                TAMPER-PROOF LEDGER SEALS ({successfulResults.length})
              </span>
            </div>
            {successfulResults.map((r, i) => (
              <div key={i} className="flex items-center gap-2 overflow-hidden border-b border-gray-800 pb-2 last:border-0 last:pb-0 shrink-0">
                <Hash className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="text-gray-400 text-[10px] shrink-0 truncate w-32">{r.file.name}</span>
                <span className="text-teal-300 select-all truncate text-[11px]">
                  {r.result?.sha256_hash}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => onNavigate('overview')}
              className="px-4 py-2 border border-outline rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              National Overview
            </button>
            <button
              onClick={() => latestCaseId && onNavigate('assessment', latestCaseId)}
              disabled={!latestCaseId}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all ${
                latestCaseId 
                  ? 'bg-primary hover:bg-[#4d3e91] text-white' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
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
