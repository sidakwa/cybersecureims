import { useAuth } from '../contexts/AuthContext';

export function useOrganization() {
  const { organizationId, profile, user } = useAuth();
  
  return {
    organizationId,
    profile,
    user,
    isLoading: !organizationId && !!user,
  };
}
