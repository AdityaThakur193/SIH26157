import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { EvidenceLocker } from './pages/EvidenceLocker';
import { AssessmentDossier } from './pages/AssessmentDossier';
import { DeepDiveCopilot } from './pages/DeepDiveCopilot';
import { Findings } from './pages/Findings';
import { ReviewQueue } from './pages/ReviewQueue';

const VALID_CREDENTIALS: Record<string, { passcode: string; role: string }> = {
  'SHARMA-994': { passcode: 'Alpha-Secure-901', role: 'Auditor - Supervisory Lead' },
  'ROOT-SEC-01': { passcode: 'Node-Admin-004', role: 'System Administrator' },
  'DIR-GEN-07': { passcode: 'NCIIPC-Exec-77', role: 'NCIIPC Director / General Counsel' },
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('sat_sa_auth') === 'true';
  });
  const [officerId, setOfficerId] = useState(() => sessionStorage.getItem('sat_sa_officer') || 'SHARMA-994');
  const [role, setRole] = useState(() => sessionStorage.getItem('sat_sa_role') || 'Auditor - Supervisory Lead');
  const [activeView, setActiveView] = useState('overview');
  const [selectedCseId, setSelectedCseId] = useState('');

  const handleLogin = (id: string, r: string, passcode: string): string | null => {
    const cred = VALID_CREDENTIALS[id];
    if (!cred) return 'Unknown Officer ID. Access denied.';
    if (cred.passcode !== passcode) return 'Invalid passcode. Authentication failed.';
    if (cred.role !== r) return 'Role mismatch. Contact enclave administrator.';
    
    setOfficerId(id);
    setRole(r);
    setIsAuthenticated(true);
    sessionStorage.setItem('sat_sa_auth', 'true');
    sessionStorage.setItem('sat_sa_officer', id);
    sessionStorage.setItem('sat_sa_role', r);
    return null;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('sat_sa_auth');
    sessionStorage.removeItem('sat_sa_officer');
    sessionStorage.removeItem('sat_sa_role');
  };

  const handleNavigate = (view: 'overview' | 'evidence' | 'assessment' | 'copilot', cseId?: string) => {
    if (cseId) {
      setSelectedCseId(cseId);
    }
    setActiveView(view);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AppLayout
      activeView={activeView}
      setActiveView={setActiveView}
      officerId={officerId}
      role={role}
      onLogout={handleLogout}
    >
      {activeView === 'overview' && (
        <Overview onNavigate={handleNavigate} />
      )}
      {activeView === 'assessments' && (
        <Overview onNavigate={handleNavigate} />
      )}
      {activeView === 'evidence' && (
        <EvidenceLocker onNavigate={handleNavigate} />
      )}
      {activeView === 'assessment' && selectedCseId && (
        <AssessmentDossier cseId={selectedCseId} onNavigate={handleNavigate} />
      )}
      {activeView === 'findings' && (
        <Findings onNavigate={handleNavigate} />
      )}
      {activeView === 'review-queue' && (
        <ReviewQueue onNavigate={handleNavigate} />
      )}
      {activeView === 'copilot' && (
        <DeepDiveCopilot cseId={selectedCseId} onNavigate={handleNavigate} />
      )}
    </AppLayout>
  );
}
