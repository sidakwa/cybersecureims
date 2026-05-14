import React from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: 'portfolio', name: 'Portfolio' },
  { path: 'findings', name: 'Findings' },
  { path: 'evidence', name: 'Evidence' },
  { path: 'actions', name: 'Actions' },
  { path: 'calendar', name: 'Calendar' },
  { path: 'metrics', name: 'Metrics' },
];

export default function AuditManager() {
  const location = useLocation();

  if (location.pathname === '/audits') {
    return <Navigate to="/audits/portfolio" replace />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Manager</h1>
        <p className="text-gray-600">Enterprise audit workpaper engine and intelligence</p>
      </div>

      <div className="flex gap-2 border-b pb-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#0057B8] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
