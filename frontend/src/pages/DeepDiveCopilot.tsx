import React, { useState } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { askCopilot } from '../services/api';
import { CopilotResponse } from '../types/api';

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
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: `Supervisory Forensic Copilot initialized for ${cseId || 'Alpha Bank Ltd'}. All queries are routed air-gapped to Ollama (llama3.1:8b) with semantic vector retrieval against ChromaDB clusters. Ask any question regarding anomalous telemetry, fidelity gaps, or statutory compliance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('assessment', cseId)}
            className="p-2 rounded-xl bg-white border border-card-border text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs font-semibold text-primary-purple uppercase tracking-wider">
              Screen 06: Deep Dive & Forensic Copilot
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-2xl font-bold text-gray-900">Enclave Forensic Copilot</h1>
              <span className="font-mono text-xs text-primary-purple bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-bold">
                {cseId || 'No Entity Selected'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 bg-white border border-card-border px-3 py-1.5 rounded-xl shadow-xs">
          <Cpu className="w-3.5 h-3.5 text-[#1D7179]" />
          <span>LLM: llama3.1:8b • Air-Gapped Local RAG</span>
        </div>
      </div>

      {/* Main Grid: Left quick prompts + Right Chat Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Context & Suggested Prompts (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-card space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary-purple" />
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
                  className="w-full text-left p-3 rounded-xl border border-card-border hover:border-primary-purple/50 bg-[#FAFBFD] hover:bg-purple-50/30 text-xs font-medium text-gray-700 transition-all flex items-start justify-between gap-2 group"
                >
                  <span className="line-clamp-2">{prompt}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-purple shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-card space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#1D7179]" />
              Supervisory Proof Chain
            </h3>
            <div className="text-xs text-gray-600 space-y-2 font-mono">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-card-border">
                <span className="text-[10px] text-gray-400 block">EVIDENCE STORE</span>
                <span className="font-bold text-gray-800">ChromaDB Local Collection</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-card-border">
                <span className="text-[10px] text-gray-400 block">VECTOR EMBEDDINGS</span>
                <span className="font-bold text-gray-800">nomic-embed-text / FastEmbed</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-card-border">
                <span className="text-[10px] text-gray-400 block">TAMPER LEDGER</span>
                <span className="font-bold text-accent-teal">SHA-256 Immutable Audit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Chat Conversation & Synthesis (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-card-border shadow-card flex flex-col h-[650px]">
          {/* Chat Messages Container */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'copilot' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-primary-purple flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-2xl space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-primary-purple text-white rounded-tr-xs'
                        : 'bg-[#FAFBFD] text-gray-800 border border-card-border rounded-tl-xs shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>

                  {/* Evidence Source Tags (Rendered when Copilot returns evidence) */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-primary-purple text-[11px]">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Retrieved Incident Evidence Sources:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2.5 py-1 bg-white border border-purple-200 text-gray-700 font-mono text-[10px] rounded-md shadow-2xs"
                          >
                            {src}
                          </span>
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
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-primary-purple flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-[#FAFBFD] border border-card-border text-xs text-gray-600 flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-primary-purple/30 border-t-primary-purple rounded-full animate-spin" />
                  <span className="font-mono">Querying ChromaDB vectors & generating Ollama synthesis...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-card-border bg-[#FAFBFD]/60 rounded-b-2xl">
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
                className="flex-1 px-4 py-3 bg-white rounded-xl border border-card-border text-xs focus:outline-none focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple transition-all font-medium text-gray-800 shadow-2xs"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  loading || !query.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-primary-purple text-white hover:bg-[#4d3e91] active:scale-[0.98] shadow-sm'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
