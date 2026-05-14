import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Building2, ChevronDown } from 'lucide-react';

export const TenantSwitcher: React.FC = () => {
  const { organization, switchOrganization } = useAuthContext();
  const [organizations, setOrganizations] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchUserOrganizations();
  }, []);

  const fetchUserOrganizations = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('organization_id, organizations(*)')
      .eq('id', userData.user.id);
    
    if (data) {
      const orgs = data.map((p: any) => p.organizations).filter(Boolean);
      setOrganizations(orgs);
    }
  };

  if (!organization) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
      >
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">{organization.name}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && organizations.length > 0 && (
        <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-lg border z-50 min-w-[200px]">
          {organizations.map((org: any) => (
            <button
              key={org.id}
              onClick={() => {
                switchOrganization(org.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
            >
              {org.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
