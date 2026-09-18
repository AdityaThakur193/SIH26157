import React from 'react';
import { ListChecks, Search, ChevronRight, Clock } from 'lucide-react';

interface ReviewQueueProps {
  onNavigate: (view: 'overview' | 'evidence' | 'assessment' | 'copilot', cseId?: string) => void;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase">
            <ListChecks className="w-4 h-4" />
            <span>Screen 06: Review Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Pending Adjudications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Priority cases requiring human examiner review and approval.
          </p>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">No pending reviews</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          All high-priority cases have been processed. New anomalies flagged by the SAT-SA engine will appear here.
        </p>
        <button 
          onClick={() => onNavigate('overview')}
          className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold rounded-lg text-sm transition-colors"
        >
          Return to Overview
        </button>
      </div>
    </div>
  );
};
