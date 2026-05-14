import { useAuth } from '../contexts/AuthContext';

export function useOrganizationId() {
  const { organizationId } = useAuth();
  
  if (!organizationId) {
    console.warn('Organization ID not available - queries may fail');
    return null;
  }
  
  return organizationId;
}
