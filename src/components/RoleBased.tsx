import { useAuth, UserRole } from '@/hooks/useAuth';

interface RoleBasedProps {
  children: React.ReactNode;
  roles?: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleBased({ children, roles, fallback = null }: RoleBasedProps) {
  const { role, loading } = useAuth();

  if (loading) return null;
  
  if (!roles || roles.includes(role as UserRole)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

// Specific role components for easier use
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleBased roles={['admin']} fallback={fallback}>{children}</RoleBased>;
}

export function ManagerOrAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleBased roles={['admin', 'quality_manager']} fallback={fallback}>{children}</RoleBased>;
}

export function AuditorOrHigher({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <RoleBased roles={['admin', 'quality_manager', 'auditor']} fallback={fallback}>{children}</RoleBased>;
}

export function ViewerOnly({ children }: { children: React.ReactNode }) {
  return <RoleBased roles={['viewer']}>{children}</RoleBased>;
}
