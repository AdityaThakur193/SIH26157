import React, { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { EvidenceLocker } from './pages/EvidenceLocker';
import { AssessmentDossier } from './pages/AssessmentDossier';
import { DeepDiveCopilot } from './pages/DeepDiveCopilot';
import { ReviewQueue } from './pages/ReviewQueue';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [officerId, setOfficerId] = useState('SHARMA-994');
  const [role, setRole] = useState('Auditor - Supervisory Lead');
  const [activeView, setActiveView] = useState('overview');
  const [selectedCseId, setSelectedCseId] = useState('CASE-2026-SOC-09');

  const handleLogin = (id: string, r: string) => {
    setOfficerId(id);
    setRole(r);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
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
      {(activeView === 'overview' || activeView === 'assessments') && (
        <Overview onNavigate={handleNavigate} />
      )}
      {activeView === 'evidence' && (
        <EvidenceLocker onNavigate={handleNavigate} />
      )}
      {(activeView === 'assessment' || activeView === 'findings') && (
        <AssessmentDossier cseId={selectedCseId} onNavigate={handleNavigate} />
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
