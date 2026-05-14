import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, FileText, AlertTriangle, CheckCircle, Calendar, BarChart3 } from 'lucide-react';

const auditNavItems = [
  { name: 'Audit Engagements', path: '/audits/portfolio', icon: ClipboardList },
  { name: 'Findings Register', path: '/audits/findings', icon: AlertTriangle },
  { name: 'Evidence Library', path: '/audits/evidence', icon: FileText },
  { name: 'Action Tracker', path: '/audits/actions', icon: CheckCircle },
  { name: 'Audit Calendar', path: '/audits/calendar', icon: Calendar },
  { name: 'Metrics & Trends', path: '/audits/metrics', icon: BarChart3 },
];

export function AuditNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-wrap justify-center gap-2 border-b pb-2 mb-6">
      {auditNavItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isActive 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
