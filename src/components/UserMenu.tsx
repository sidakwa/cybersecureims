import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, LogOut, ClipboardList, Shield, Users } from 'lucide-react';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRoleBadgeColor = () => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      quality_manager: 'bg-purple-100 text-purple-800',
      audit_manager: 'bg-blue-100 text-blue-800',
      auditor: 'bg-green-100 text-green-800',
      risk_manager: 'bg-yellow-100 text-yellow-800',
      risk_owner: 'bg-orange-100 text-orange-800',
      control_owner: 'bg-teal-100 text-teal-800',
      engineer: 'bg-indigo-100 text-indigo-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role || 'viewer'] || 'bg-gray-100';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 focus:outline-none hover:bg-gray-50 rounded-lg px-3 py-1 transition-colors"
      >
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
          {getInitials()}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {profile?.full_name || user?.email?.split('@')[0]}
          </p>
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500 capitalize">{role || 'viewer'}</p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            {/* User Info Section */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{profile?.full_name || user?.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}>
                    {(role || 'viewer').toUpperCase()}
                  </span>
                  {user?.app_metadata?.provider === 'azure' && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      Azure SSO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Profile Settings</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/my-assignments');
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ClipboardList className="h-4 w-4" />
              <span>My Assignments</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/roles');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  <span>User Management</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>System Settings</span>
                </button>
              </>
            )}

            <div className="border-t border-gray-100 my-1"></div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Add missing import
import { ChevronDown } from 'lucide-react';
