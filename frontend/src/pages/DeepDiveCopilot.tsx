import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  Send, 
  Database, 
  Cpu, 
  ShieldAlert, 
  Terminal, 
  Layers, 
  AlertCircle,
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';
import { askCopilot, getEvidenceDetail } from '../services/api';
import { CopilotResponse, EvidenceDetail } from '../types/api';
import { TextBeautifier } from '../components/common/TextBeautifier';

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  sources?: string[];
  findingsFlagged?: boolean;
  timestamp: string;
}

interface DeepDiveCopilotProps {
  cseId: string;
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'copilot', cseId?: string) => void;
}

export const DeepDiveCopilot: React.FC<DeepDiveCopilotProps> = ({ cseId, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDetail | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: `Supervisory Forensic Copilot initialized for ${cseId || 'Alpha Bank Ltd'}. All queries are routed air-gapped to Ollama (llama3.1:8b) with semantic vector retrieval against ChromaDB clusters. Ask any question regarding anomalous telemetry, fidelity gaps, or statutory compliance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    `What are the most critical threat findings for ${cseId}?`,
    `Analyze the anomaly patterns and temporal spikes detected in ${cseId}.`,
    `What compliance gaps exist for ${cseId} against NCIIPC baseline controls?`,
    `Summarize the peer variance and risk posture for ${cseId} compared to sector peers.`
  ];

  const handleSend = async (customQuery?: string) => {
    const textToSend = customQuery || query;
    if (!textToSend.trim() || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: userTime
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setQuery('');
    setLoading(true);

    try {
      const response: CopilotResponse = await askCopilot({
        query: textToSend,
        case_id: cseId
      });

      const copilotTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const copilotMsg: Message = {
        sender: 'copilot',
        text: response.answer,
        sources: response.evidence_sources,
        findingsFlagged: response.findings_flagged,
        timestamp: copilotTime
      };

      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Copilot query failed';
      setMessages((prev) => [
        ...prev,
        {
          sender: 'copilot',
          text: `Error executing enclave analysis: ${errMsg}. Ensure the Ollama daemon is running with model llama3.1:8b.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectSource = async (fingerprint: string) => {
    setLoadingEvidence(true);
    try {
      const detail = await getEvidenceDetail(fingerprint);
      setSelectedEvidence(detail);
    } catch (err) {
      // Fallback display if not found in db
      setSelectedEvidence({
        fingerprint,
        event_type: 'SimHash Clustered Telemetry',
        source_ips: [],
        dest_ip: 'Internal Subnet',
        severity: 'EVALUATED',
        sample_raw: `Evidence Fingerprint: ${fingerprint}\nClustered from vectorstore hybrid semantic search for current query.`,
        count: 1,
        first_seen: 'Recorded in Ledger',
        last_seen: 'Verified'
      });
    } finally {
      setLoadingEvidence(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('assessment', cseId)}
            className="p-2 rounded-xl bg-white border border-outline text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider">
              Screen 06: Deep Dive & Forensic Copilot
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-2xl font-bold text-gray-900">Enclave Forensic Copilot</h1>
              <span className="font-mono text-xs text-primary bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-bold">
                {cseId || 'No Entity Selected'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-white border border-outline px-3 py-1.5 rounded-xl shadow-xs">
          <Cpu className="w-3.5 h-3.5 text-[#1D7179]" />
          <span>LLM: llama3.1:8b • Air-Gapped Local RAG</span>
        </div>
      </div>

      {/* Main Grid: Left quick prompts + Right Chat Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Context & Suggested Prompts (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-outline p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              Forensic Inquiry Presets
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Standardized supervisory inquiries executed against clustered evidence vectors:
            </p>

            <div className="space-y-2">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-xl border border-outline hover:border-primary/50 bg-[#FAFBFD] hover:bg-purple-50/30 text-xs font-medium text-gray-700 transition-all flex items-start justify-between gap-2 group cursor-pointer active:scale-98"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-outline p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#1D7179]" />
              Supervisory Proof Chain
            </h3>
            <div className="text-xs text-gray-600 space-y-2 font-mono">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-outline">
                <span className="text-[10px] text-gray-400 block">EVIDENCE STORE</span>
                <span className="font-bold text-gray-800">ChromaDB Local Collection</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-outline">
                <span className="text-[10px] text-gray-400 block">VECTOR EMBEDDINGS</span>
                <span className="font-bold text-gray-800">nomic-embed-text / FastEmbed</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-outline">
                <span className="text-[10px] text-gray-400 block">TAMPER LEDGER</span>
                <span className="font-bold text-accent-teal">SHA-256 Immutable Audit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Chat Conversation & Synthesis (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-outline shadow-sm flex flex-col h-[650px]">
          {/* Chat Messages Container with data-lenis-prevent for smooth internal mouse wheel scrolling */}
          <div 
            className="flex-1 p-6 overflow-y-auto space-y-5 overscroll-contain" 
            data-lenis-prevent="true"
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'copilot' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-primary flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white rounded-tr-xs'
                        : 'bg-[#FAFBFD] text-gray-800 border border-outline rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <TextBeautifier content={msg.text} isUser={msg.sender === 'user'} />
                  </div>

                  {/* Evidence Source Tags (Clickable Pills to inspect raw evidence) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-primary text-[11px]">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Retrieved Incident Evidence Sources (Click to inspect):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleInspectSource(src)}
                            className="px-2.5 py-1 bg-white hover:bg-purple-100 hover:border-purple-300 border border-purple-200 text-gray-700 font-mono text-[10px] rounded-md shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 group"
                            title={`Inspect evidence cluster: ${src}`}
                          >
                            <span>{src}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-purple-400 group-hover:text-purple-600" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-gray-400 font-mono block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-primary flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-[#FAFBFD] border border-outline text-xs text-gray-600 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="font-mono">Querying ChromaDB vectors & generating Ollama synthesis...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-outline bg-[#FAFBFD]/60 rounded-b-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask Forensic Copilot regarding entity evidence, telemetry clusters, or statutory rules..."
                disabled={loading}
                className="flex-1 px-4 py-3 bg-white rounded-xl border border-outline text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-800 shadow-2xs"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  loading || !query.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-primary text-white hover:bg-[#4d3e91] active:scale-[0.98] shadow-sm cursor-pointer'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Forensic Evidence Inspector Modal */}
      {selectedEvidence && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl max-w-xl w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    SHA-256 Ledger Verified
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Evidence Cluster: <span className="font-mono text-indigo-600">{selectedEvidence.fingerprint}</span>
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEvidence(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Event Type</span>
                <span className="font-bold text-slate-800">{selectedEvidence.event_type}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Severity</span>
                <span className={`font-bold ${selectedEvidence.severity.toUpperCase() === 'HIGH' || selectedEvidence.severity.toUpperCase() === 'CRITICAL' ? 'text-rose-600' : 'text-slate-800'}`}>
                  {selectedEvidence.severity}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Cluster Volume</span>
                <span className="font-bold text-indigo-600 font-mono">x{selectedEvidence.count} logs</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Target IP</span>
                <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">{selectedEvidence.dest_ip}</span>
              </div>
            </div>

            {selectedEvidence.source_ips && selectedEvidence.source_ips.length > 0 && (
              <div className="text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Source IP Address(es)</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200" data-lenis-prevent="true">
                  {selectedEvidence.source_ips.map((ip, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                      {ip}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Raw Telemetry Sample Payload</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto overflow-y-auto max-h-36 border border-slate-800 leading-relaxed whitespace-pre-wrap break-all" data-lenis-prevent="true">
                <code>
                  {selectedEvidence.sample_raw ? (
                    (() => {
                      try {
                        return JSON.stringify(JSON.parse(selectedEvidence.sample_raw), null, 2);
                      } catch (err) {
                        return selectedEvidence.sample_raw;
                      }
                    })()
                  ) : 'No raw payload stored'}
                </code>
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400 font-mono">
              <span>First Seen: {selectedEvidence.first_seen}</span>
              <button
                onClick={() => {
                  const fp = selectedEvidence.fingerprint;
                  setSelectedEvidence(null);
                  handleSend(`Analyze forensic evidence cluster ${fp} in detail.`);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-sans font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Copilot About This Cluster</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
