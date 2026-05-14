import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function UserProfile() {
  const { user, profile, organization, role, isAdmin, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (import.meta.env.DEV) {

    console.log('UserProfile - role:', role, 'isAdmin:', isAdmin, 'org:', organization);

  }

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (error) throw error;
      
      await refreshProfile();
      setMessage('Profile updated successfully!');
    } catch (err: any) {
      setMessage('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-500 mb-6">View and manage your account information</p>
        
        {/* Authentication Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-3">Authentication Details</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Signed in with:</span> Azure AD SSO</p>
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Organization:</span> {organization?.name || 'Not assigned'}</p>
            <p><span className="font-medium">Role:</span> {role || 'Unknown'}</p>
            <p><span className="font-medium">Admin Access:</span> {isAdmin ? 'Yes' : 'No'}</p>
          </div>
        </div>
        
        {/* Profile Information */}
        <div className="space-y-4">
          <h2 className="font-semibold">Profile Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-700">{user?.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Member since</label>
            <p className="text-gray-500">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          
          {message && (
            <div className={`p-3 rounded-md text-sm ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message}
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button
            onClick={refreshProfile}
            className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Refresh Profile
          </button>
        </div>
      </div>
    </div>
  );
}
