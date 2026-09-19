import React, { useState } from 'react';
import { Shield, Key, BadgeCheck, Lock, WifiOff, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface LoginProps {
  onLogin: (officerId: string, role: string, passcode: string) => string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [officerId, setOfficerId] = useState('SHARMA-994');
  const [passcode, setPasscode] = useState('Alpha-Secure-901');
  const [role, setRole] = useState('Auditor - Supervisory Lead');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPersona = (id: string, r: string, pass: string) => {
    setOfficerId(id);
    setRole(r);
    setPasscode(pass);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = onLogin(officerId, role, passcode);
    if (result) {
      setError(result);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dim flex flex-col items-center justify-center p-6 relative select-none">
      <div className="absolute w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md mb-6 z-10 flex items-center justify-between px-4 py-2 bg-surface rounded-xl border border-outline shadow-sm">
        <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
          Enclave Profiles:
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => applyPersona('SHARMA-994', 'Auditor - Supervisory Lead', 'Alpha-Secure-901')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition active:scale-95 cursor-pointer ${officerId === 'SHARMA-994' ? 'bg-primary-container text-primary font-bold' : 'bg-surface-container-high text-on-surface hover:bg-slate-200'}`}>
            AUDITOR
          </button>
          <button type="button" onClick={() => applyPersona('ROOT-SEC-01', 'System Administrator', 'Node-Admin-004')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition active:scale-95 cursor-pointer ${officerId === 'ROOT-SEC-01' ? 'bg-primary-container text-primary font-bold' : 'bg-surface-container-high text-on-surface hover:bg-slate-200'}`}>
            ADMIN
          </button>
          <button type="button" onClick={() => applyPersona('DIR-GEN-07', 'NCIIPC Director / General Counsel', 'NCIIPC-Exec-77')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition active:scale-95 cursor-pointer ${officerId === 'DIR-GEN-07' ? 'bg-primary-container text-primary font-bold' : 'bg-surface-container-high text-on-surface hover:bg-slate-200'}`}>
            DIRECTOR
          </button>
        </div>
      </div>

      <div className="w-full max-w-md bg-surface rounded-2xl p-8 border border-outline shadow-md relative z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary-container text-primary flex items-center justify-center mb-3 shadow-sm relative">
            <Shield className="w-7 h-7" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 absolute -top-1 -right-1 ring-4 ring-white" />
          </div>
          <h1 className="text-[18px] font-bold text-on-surface tracking-tight uppercase">NCIIPC SECURE TERMINAL</h1>
          <p className="text-[12px] text-on-surface-variant mt-1">Supervisory Analytics Tool for SOC Assessment (SAT-SA)</p>
          <div className="mt-3 px-3 py-1 bg-surface-dim rounded-full flex items-center gap-2 border border-outline">
            <WifiOff className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">ENCLAVE LEVEL-5 // OFFLINE NODE: 127.0.0.1</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              <span>Officer ID</span>
              <span className="text-primary font-mono text-[10px]">REQ-UID</span>
            </div>
            <div className="relative flex items-center">
              <BadgeCheck className="w-4 h-4 text-on-surface-variant absolute left-3 pointer-events-none" />
              <input type="text" value={officerId} onChange={(e) => setOfficerId(e.target.value)} required
                className="w-full h-11 pl-10 pr-3 bg-surface-dim border border-outline rounded-xl text-[13px] font-mono font-medium text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-container transition" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              <span>Secure Passcode</span>
              <span className="text-on-surface-variant font-mono text-[10px]">FIPS-201</span>
            </div>
            <div className="relative flex items-center">
              <Key className="w-4 h-4 text-on-surface-variant absolute left-3 pointer-events-none" />
              <input type={showPasscode ? 'text' : 'password'} value={passcode} onChange={(e) => setPasscode(e.target.value)} required
                className="w-full h-11 pl-10 pr-10 bg-surface-dim border border-outline rounded-xl text-[13px] font-mono font-medium text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-container transition" />
              <button type="button" onClick={() => setShowPasscode(!showPasscode)} className="absolute right-3 text-on-surface-variant hover:text-on-surface">
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
              <span>Role Authorization</span>
              <span className="text-secondary font-mono text-[10px]">CLEARANCE-A</span>
            </div>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full h-11 px-3 bg-surface-dim border border-outline rounded-xl text-[13px] text-on-surface font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-container transition cursor-pointer">
              <option value="Auditor - Supervisory Lead">Auditor - Supervisory Lead</option>
              <option value="System Administrator">System Administrator</option>
              <option value="NCIIPC Director / General Counsel">NCIIPC Director / General Counsel</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit"
            className="w-full h-12 bg-primary hover:bg-[#4d3c96] text-white font-semibold rounded-xl text-[14px] flex items-center justify-center gap-2 shadow-md transition-all mt-6">
            <Lock className="w-4 h-4" />
            <span>AUTHENTICATE ENCLAVE</span>
          </button>
        </form>

        <p className="text-center text-[11px] text-on-surface-variant mt-5">TPM 2.0 Validated · Zero External Telemetry Leakage</p>
      </div>
    </div>
  );
};