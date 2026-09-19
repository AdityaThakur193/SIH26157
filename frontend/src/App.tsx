import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Assessments } from './pages/Assessments';
import { EvidenceLocker } from './pages/EvidenceLocker';
import { AssessmentDossier } from './pages/AssessmentDossier';
import { DeepDiveCopilot } from './pages/DeepDiveCopilot';
import { Findings } from './pages/Findings';
import { ReviewQueue } from './pages/ReviewQueue';
import { EvidenceView } from './pages/EvidenceView';

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
  const [activeView, setActiveView] = useState(() => sessionStorage.getItem('sat_sa_active_view') || 'overview');
  const [selectedCseId, setSelectedCseId] = useState(() => sessionStorage.getItem('sat_sa_selected_cse_id') || '');
  const [selectedDomainCode, setSelectedDomainCode] = useState(() => sessionStorage.getItem('sat_sa_selected_domain') || '');

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
    sessionStorage.removeItem('sat_sa_active_view');
    sessionStorage.removeItem('sat_sa_selected_cse_id');
    sessionStorage.removeItem('sat_sa_selected_domain');
  };

  const handleNavigate = (view: string, cseId?: string, extraData?: string) => {
    if (cseId) {
      setSelectedCseId(cseId);
      sessionStorage.setItem('sat_sa_selected_cse_id', cseId);
    }
    if (extraData) {
      setSelectedDomainCode(extraData);
      sessionStorage.setItem('sat_sa_selected_domain', extraData);
    } else {
      setSelectedDomainCode('');
      sessionStorage.removeItem('sat_sa_selected_domain');
    }
    setActiveView(view);
    sessionStorage.setItem('sat_sa_active_view', view);
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
        <Assessments onNavigate={handleNavigate} />
      )}
      {activeView === 'evidence' && (
        <EvidenceLocker onNavigate={handleNavigate} />
      )}
      {activeView === 'assessment' && (
        <AssessmentDossier cseId={selectedCseId || 'CASE-2026-CYB-09'} onNavigate={handleNavigate} />
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
      {activeView === 'evidence-view' && (
        <EvidenceView cseId={selectedCseId} domainCode={selectedDomainCode} onNavigate={handleNavigate} />
      )}
    </AppLayout>
  );
}
