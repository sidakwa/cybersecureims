import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ClipboardCheck, 
  FileSearch, 
  CheckSquare,
  Users,
  BarChart3,
  Bell,
  Settings,
  Shield
} from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';

export default function AuditorLayout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/auditor/dashboard', icon: Home },
    { name: 'Control Verification', href: '/auditor/verify', icon: ClipboardCheck },
    { name: 'Audit Checklists', href: '/auditor/checklists', icon: FileSearch },
    { name: 'Findings Dashboard', href: '/auditor/findings', icon: CheckSquare },
    { name: 'Client Reviews', href: '/auditor/clients', icon: Users },
    { name: 'Compliance Reports', href: '/auditor/reports', icon: BarChart3 },
    { name: 'Notifications', href: '/auditor/notifications', icon: Bell },
    { name: 'Settings', href: '/auditor/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">CyberSecureIMS</h1>
            <span className="px-2 py-1 text-xs bg-yellow-600 text-white rounded">Auditor Portal</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? 'bg-yellow-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Auditor Access</span>
            </div>
            <div className="mt-3">
              <OrganizationSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <div>
              <h2 className="text-lg font-semibold">
                {navigation.find(n => n.href === location.pathname)?.name || 'Auditor Portal'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
