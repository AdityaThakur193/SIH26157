import React from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  FileCheck2, 
  UploadCloud, 
  AlertTriangle, 
  ListChecks, 
  Bot, 
  Search, 
  Bell, 
  User, 
  Lock, 
  WifiOff 
} from 'lucide-react';

interface AppLayoutProps {
  activeView: string;
  setActiveView: (view: string) => void;
  officerId: string;
  role: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeView,
  setActiveView,
  officerId,
  role,
  onLogout,
  children
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'core' },
    { id: 'assessments', label: 'Assessments', icon: FileCheck2, section: 'core' },
    { id: 'evidence', label: 'Data Ingestion', icon: UploadCloud, section: 'core' },
    { id: 'findings', label: 'Findings', icon: AlertTriangle, section: 'core' },
    { id: 'review-queue', label: 'Review Queue', icon: ListChecks, section: 'core' },
    { id: 'copilot', label: 'AI Threat Copilot', icon: Bot, section: 'system' }
  ];

  return (
    <div className="min-h-screen bg-surface-dim flex">
      {/* 240px Fixed White Sidebar */}
      <aside className="w-[240px] fixed top-0 left-0 bottom-0 bg-surface border-r border-outline flex flex-col justify-between z-40 select-none">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="h-16 px-5 flex items-center gap-3 border-b border-outline">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[15px] text-on-surface leading-none tracking-tight">SAT-SA</span>
              <span className="text-[11px] text-on-surface-variant leading-tight truncate mt-1">Supervisory Analytics</span>
            </div>
          </div>

          {/* Core Operations Navigation */}
          <div className="px-3 pt-5 pb-2">
            <p className="px-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              Core Operations
            </p>
            <nav className="space-y-1">
              {navItems.filter(i => i.section === 'core').map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id || (activeView === 'assessment' && item.id === 'assessments');
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] transition-colors ${
                      isActive 
                        ? 'bg-primary-container text-primary font-semibold' 
                        : 'text-on-surface-variant hover:bg-surface-dim hover:text-on-surface font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Supervisory & System Navigation */}
          <div className="px-3 pt-4 pb-2">
            <p className="px-3 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
              Supervisory & Intelligence
            </p>
            <nav className="space-y-1">
              {navItems.filter(i => i.section === 'system').map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[13px] transition-colors ${
                      isActive 
                        ? 'bg-primary-container text-primary font-semibold' 
                        : 'text-on-surface-variant hover:bg-surface-dim hover:text-on-surface font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Air-Gapped Node Status Card */}
        <div className="p-3 border-t border-outline bg-surface">
          <div className="p-3 rounded-lg border border-outline bg-surface-dim flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-on-surface font-semibold truncate">Local Node #04</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" title="Operational / Stable" />
            </div>
            <div className="flex items-center justify-between text-on-surface-variant text-[11px]">
              <span className="flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-emerald-600" />
                Air-Gapped Core
              </span>
              <span className="font-mono font-medium text-on-surface-variant">v4.2.1</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-[240px] flex-1 flex flex-col min-w-0">
        {/* Top Command Bar */}
        <header className="h-16 bg-surface/90 backdrop-blur-md border-b border-outline px-8 flex items-center justify-between gap-6 sticky top-0 z-30">
          {/* Search bar */}
          <div className="relative flex items-center w-72">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search entities, rules, or CVE..."
              className="w-full h-10 pl-9 pr-3.5 bg-[#F5F6F8] border border-outline rounded-[10px] text-[13px] text-on-surface placeholder:text-[#858891] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-container transition-all"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={() => alert('No new notifications')}
              className="w-10 h-10 rounded-[10px] flex items-center justify-center text-on-surface-variant hover:bg-[#F5F6F8] hover:text-on-surface transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface" />
            </button>

            <div className="h-6 w-px bg-outline mx-1" />

            {/* Officer Profile Badge */}
            <div className="flex items-center gap-3 pl-1">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[12px] font-bold">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[13px] font-semibold text-on-surface leading-tight">{officerId}</span>
                <span className="text-[11px] text-on-surface-variant leading-tight">{role}</span>
              </div>
            </div>

            {/* Switch / Enclave Lock */}
            <button
              onClick={onLogout}
              title="Lock Enclave & Switch Persona"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-surface-dim hover:bg-surface-container-highest border border-outline text-[11px] text-on-surface font-medium transition"
            >
              <Lock className="w-3 h-3 text-secondary" />
              <span>Lock</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-8 bg-surface-dim">
          {children}
        </main>
      </div>
    </div>
  );
};