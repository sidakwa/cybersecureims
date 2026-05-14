import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function DebugProfile() {
  const { user, organizationId } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchOrganizations();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(data);
  };

  const fetchOrganizations = async () => {
    const { data } = await supabase
      .from('organizations')
      .select('*');
    setOrganizations(data || []);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Profile Debug</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold">Auth Info:</h2>
        <p>User ID: {user?.id}</p>
        <p>User Email: {user?.email}</p>
        <p>Organization ID from Auth: {organizationId || 'NULL'}</p>
      </div>

      <div className="bg-blue-50 p-4 rounded mb-4">
        <h2 className="font-semibold">Profile:</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(profile, null, 2)}</pre>
      </div>

      <div className="bg-green-50 p-4 rounded">
        <h2 className="font-semibold">Organizations:</h2>
        <pre className="text-xs overflow-auto">{JSON.stringify(organizations, null, 2)}</pre>
      </div>
    </div>
  );
}
