import { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { clearOrganizationCache } from '@/lib/tenant';

export function OrganizationSwitcher() {
  const { role, organization, user, refresh } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is admin - directly from role
  const isAdmin = role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchOrganizations();
    }
  }, [isAdmin]);

  const fetchOrganizations = async () => {
    const { data } = await supabase.from('organizations').select('*');
    setOrganizations(data || []);
  };

  const switchOrganization = async (orgId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ organization_id: orgId })
        .eq('id', user.id);
      
      clearOrganizationCache();
      await refresh();
      window.location.reload();
    } catch (error) {
      console.error('Error switching organization:', error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  // Only show for admin users who have access to multiple organizations
  if (!isAdmin) {
    return null;
  }

  if (organizations.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Building2 className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{organization?.name || 'Select Organization'}</span>
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => switchOrganization(org.id)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
              >
                <span>{org.name}</span>
                {organization?.id === org.id && <Check className="h-4 w-4 text-green-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
