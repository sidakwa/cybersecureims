import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Upload, 
  FileText, 
  CheckCircle, 
  Bell, 
  Settings,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { UserMenu } from '@/components/UserMenu';
import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';

export default function ClientLayout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/client/dashboard', icon: Home },
    { name: 'Evidence Collection', href: '/client/evidence', icon: Upload },
    { name: 'My Submissions', href: '/client/submissions', icon: FolderOpen },
    { name: 'Compliance Status', href: '/client/compliance', icon: CheckCircle },
    { name: 'Audit Requests', href: '/client/requests', icon: Bell },
    { name: 'Documents', href: '/client/documents', icon: FileText },
    { name: 'Support', href: '/client/support', icon: HelpCircle },
    { name: 'Settings', href: '/client/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-primary">CyberSecureIMS</h1>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Client Portal</span>
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
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <OrganizationSwitcher />
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
                {navigation.find(n => n.href === location.pathname)?.name || 'Client Portal'}
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
