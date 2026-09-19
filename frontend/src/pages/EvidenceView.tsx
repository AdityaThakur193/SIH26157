import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Search, Database, ChevronRight, X, AlertCircle, Sparkles, Send, Loader2, ShieldCheck, FilterX
} from 'lucide-react';
import { getEvidenceList, askCopilot } from '../services/api';
import { EvidenceDetail, EvidenceListResponse, CopilotResponse } from '../types/api';
import { TextBeautifier } from '../components/common/TextBeautifier';

interface EvidenceViewProps {
  cseId: string;
  domainCode: string;
  onNavigate: (view: string, cseId?: string, extraData?: string) => void;
}

interface Message {
  sender: 'user' | 'copilot';
  text: string;
  sources?: string[];
  findingsFlagged?: boolean;
  timestamp: string;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ cseId, domainCode, onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState<EvidenceDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [activeDomain, setActiveDomain] = useState<string>(domainCode || '');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Copilot state
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'copilot',
      text: `Supervisory Forensic Copilot initialized for ${cseId}. I have direct semantic access to the raw evidence clusters currently displayed. Ask me anything about this telemetry.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, copilotLoading]);

  const fetchEvidence = async (domain: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEvidenceList(cseId, domain);
      setEvidence(res.clusters || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence(activeDomain);
  }, [cseId, activeDomain]);

  const handleSendCopilot = async (customQuery?: string) => {
    const textToSend = customQuery || copilotQuery;
    if (!textToSend.trim() || copilotLoading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setCopilotQuery('');
    setCopilotLoading(true);

    try {
      const res = await askCopilot({ query: textToSend, case_id: cseId });
      
      const aiMsg: Message = {
        sender: 'copilot',
        text: res.answer,
        sources: res.evidence_sources,
        findingsFlagged: res.findings_flagged,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: unknown) {
      setMessages(prev => [...prev, {
        sender: 'copilot',
        text: err instanceof Error ? err.message : 'Analysis failed. Neural link timeout.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const filteredEvidence = evidence.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.fingerprint.toLowerCase().includes(q) || 
           e.event_type.toLowerCase().includes(q) || 
           e.severity.toLowerCase().includes(q) ||
           e.dest_ip.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 overflow-hidden pt-4 pb-4">
      
      {/* LEFT PANE: Evidence Data Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('assessment', cseId)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900">Raw Telemetry Evidence</h1>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Entity: {cseId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {activeDomain ? (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                  Filtered: {activeDomain}
                </span>
                <button 
                  onClick={() => setActiveDomain('')}
                  className="text-indigo-400 hover:text-indigo-600 ml-2 cursor-pointer"
                  title="Clear filter to show full telemetry"
                >
                  <FilterX className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 uppercase tracking-wider">
                Showing All Entity Telemetry
              </span>
            )}
            
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input 
                type="text" 
                placeholder="Search clusters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto bg-slate-50/50" data-lenis-prevent="true">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mb-3" />
              <span className="text-xs font-medium">Retrieving Ledger Evidence...</span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-rose-500">
              <AlertCircle className="w-6 h-6 mb-2" />
              <span className="text-xs font-medium">{error}</span>
            </div>
          ) : filteredEvidence.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Database className="w-8 h-8 mb-3 opacity-50" />
              <span className="text-sm font-medium text-slate-600">No telemetry clusters found</span>
              <span className="text-xs mt-1">Try clearing filters or search query</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 shadow-sm z-10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                <tr>
                  <th className="px-4 py-3 border-b border-slate-200">Fingerprint</th>
                  <th className="px-4 py-3 border-b border-slate-200">Event Type</th>
                  <th className="px-4 py-3 border-b border-slate-200">Severity</th>
                  <th className="px-4 py-3 border-b border-slate-200 text-right">Volume</th>
                  <th className="px-4 py-3 border-b border-slate-200">Target IP</th>
                  <th className="px-4 py-3 border-b border-slate-200"></th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredEvidence.map((e, idx) => (
                  <React.Fragment key={idx}>
                    <tr 
                      onClick={() => setExpandedRow(expandedRow === e.fingerprint ? null : e.fingerprint)}
                      className={`cursor-pointer hover:bg-slate-100 transition-colors ${expandedRow === e.fingerprint ? 'bg-indigo-50/50' : 'bg-white'} border-b border-slate-100`}
                    >
                      <td className="px-4 py-3 font-mono text-indigo-600 font-medium">{e.fingerprint.substring(0, 8)}...</td>
                      <td className="px-4 py-3 text-slate-700 font-medium">{e.event_type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          e.severity.toUpperCase() === 'HIGH' || e.severity.toUpperCase() === 'CRITICAL' 
                            ? 'bg-rose-50 text-rose-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {e.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">x{e.count}</td>
                      <td className="px-4 py-3 font-mono text-slate-500 truncate max-w-[120px]">{e.dest_ip}</td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className={`w-4 h-4 text-slate-400 inline-block transition-transform ${expandedRow === e.fingerprint ? 'rotate-90 text-indigo-500' : ''}`} />
                      </td>
                    </tr>
                    {expandedRow === e.fingerprint && (
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Raw Telemetry Payload</div>
                              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-y-auto max-h-48 border border-slate-800 leading-relaxed shadow-inner whitespace-pre-wrap break-all" data-lenis-prevent="true">
                                <code>
                                  {e.sample_raw ? (
                                    (() => {
                                      try {
                                        return JSON.stringify(JSON.parse(e.sample_raw), null, 2);
                                      } catch (err) {
                                        return e.sample_raw;
                                      }
                                    })()
                                  ) : 'No raw payload stored'}
                                </code>
                              </pre>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cluster Metadata</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-slate-500 block mb-0.5">First Seen</span>
                                    <span className="font-mono text-slate-900">{e.first_seen}</span>
                                  </div>
                                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                                    <span className="text-slate-500 block mb-0.5">Full Fingerprint</span>
                                    <span className="font-mono text-slate-900 truncate block" title={e.fingerprint}>{e.fingerprint}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    handleSendCopilot(`Analyze anomaly fingerprint ${e.fingerprint}: ${e.event_type} affecting ${e.dest_ip}. Explain the risk.`);
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-colors active:scale-95 cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5" /> Ask Copilot
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Copilot Side Panel */}
      <div className="w-[400px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
        <div className="p-4 bg-[#111118] border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Supervisory Copilot</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider">OLLAMA // AIR-GAPPED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" data-lenis-prevent="true">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[90%] rounded-2xl p-4 shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}>
                <TextBeautifier content={msg.text} isUser={msg.sender === 'user'} />
                
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Analyzed Clusters</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, sIdx) => (
                        <span key={sIdx} className="px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[9px] rounded-md" title={src}>
                          {src.substring(0, 8)}...
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-[9px] font-mono mt-2 ${msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}
          
          {copilotLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-medium text-slate-500">Synthesizing telemetry...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <div className="relative flex items-end">
            <textarea
              value={copilotQuery}
              onChange={(e) => setCopilotQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendCopilot();
                }
              }}
              placeholder="Query the evidence ledger..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none min-h-[44px] max-h-32"
              rows={1}
            />
            <button
              onClick={() => handleSendCopilot()}
              disabled={!copilotQuery.trim() || copilotLoading}
              className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[9px] text-center text-slate-400 mt-2 font-medium">
            Shift + Enter for new line
          </div>
        </div>
      </div>

    </div>
  );
};
