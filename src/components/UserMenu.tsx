import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  UserCircle,
  Settings,
  LogOut,
  Shield,
  Users,
  Building2,
  ChevronDown,
  Upload,
  Database
} from 'lucide-react';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, organization, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/login');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Get display name
  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get role display name
  const getRoleDisplay = () => {
    const roleMap: Record<string, string> = {
      admin: 'Administrator',
      quality_manager: 'Quality Manager',
      auditor: 'Auditor',
      viewer: 'Viewer'
    };
    return roleMap[role || 'viewer'] || 'User';
  };

  // Get role badge color
  const getRoleBadgeColor = () => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      quality_manager: 'bg-purple-100 text-purple-800',
      auditor: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role || 'viewer'] || 'bg-gray-100';
  };

  // Menu items with correct routes from App.tsx
  const menuItems = [
    {
      label: 'My Profile',
      path: '/profile',
      icon: UserCircle,
      show: true
    },
    {
      label: 'User Management',
      path: '/admin/roles',
      icon: Users,
      show: isAdmin
    },
    {
      label: 'Organizations',
      path: '/admin/organizations',
      icon: Building2,
      show: false,  // DISABLED for now - set to true to enable organization switching
      // TODO: Enable this when organization switching functionality is ready
    },
    {
      label: 'Bulk Import',
      path: '/bulk-import',
      icon: Upload,
      show: isAdmin
    },
    {
      label: 'System Settings',
      path: '/settings',
      icon: Settings,
      show: isAdmin
    }
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none transition-all duration-200 hover:opacity-80"
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <span className="text-white font-semibold text-sm">
              {getUserInitials()}
            </span>
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">
                  {getUserInitials()}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{getDisplayName()}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}>
                    {getRoleDisplay()}
                  </span>
                  {organization && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {organization.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item) => item.show && (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <item.icon className="h-4 w-4 text-gray-400" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100"></div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
