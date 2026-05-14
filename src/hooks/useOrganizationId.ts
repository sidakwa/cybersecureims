import { useAuth } from '../contexts/AuthContext';

export function useOrganizationId(): string {
  const { organizationId } = useAuth();
  if (!organizationId) throw new Error('No organisation context — ensure component is wrapped in <AuthProvider>');
  return organizationId;
}
