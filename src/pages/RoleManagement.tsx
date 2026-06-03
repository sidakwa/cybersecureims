import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface UserWithProfile {
  id: string;
  email: string;
  role: string;
  full_name: string;
  organization_id: string | null;
  last_sign_in_at: string | null;
  created_at: string | null;
  department?: string | null;
  business_unit?: string | null;
  has_profile: boolean;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', badge: 'bg-red-100 text-red-800' },
  { value: 'quality_manager', label: 'Quality Manager', badge: 'bg-purple-100 text-purple-800' },
  { value: 'auditor', label: 'Auditor', badge: 'bg-blue-100 text-blue-800' },
  { value: 'viewer', label: 'Viewer', badge: 'bg-gray-100 text-gray-800' },
];

export default function RoleManagement() {
  const { profile, isAdmin, organization, organizationId } = useAuth();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ user: UserWithProfile; newRole: string } | null>(null);

  const currentOrgId = organizationId;

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin, currentOrgId]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('admin-list-users');
      if (invokeError) {
        throw invokeError;
      }

      const payload = data as { users: UserWithProfile[] };
      if (!payload?.users) {
        throw new Error('Unexpected response from admin-list-users');
      }

      const filtered = currentOrgId
        ? payload.users.filter((u) => u.organization_id === currentOrgId)
        : payload.users;
      setUsers(filtered);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err?.message || 'Failed to load users. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handlePendingRoleChange = (user: UserWithProfile, newRole: string) => {
    if (user.role === newRole) return;
    if (user.id === profile?.id && newRole !== 'admin') {
      setError('You cannot remove your own admin role.');
      return;
    }
    setConfirmation({ user, newRole });
  };

  const confirmRoleChange = async () => {
    if (!confirmation) return;

    const { user, newRole } = confirmation;
    setUpdatingUserId(user.id);
    setError(null);

    try {
      const { error: invokeError } = await supabase.functions.invoke('admin-update-role', {
        body: JSON.stringify({ userId: user.id, newRole }),
      });

      if (invokeError) {
        throw invokeError;
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, role: newRole } : item
        )
      );
      setConfirmation(null);
    } catch (err: any) {
      console.error('Error updating role:', err);
      setError(err?.message || 'Failed to update user role. Please try again.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const option = ROLE_OPTIONS.find((item) => item.value === role);
    return option?.badge ?? 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    return ROLE_OPTIONS.find((item) => item.value === role)?.label ?? role.replace('_', ' ');
  };

  const formatLastSeen = (timestamp: string | null) => {
    if (!timestamp) return 'Never signed in';
    try {
      return `Last seen ${format(new Date(timestamp), 'dd MMM yyyy')}`;
    } catch {
      return 'Never signed in';
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="bg-red-50">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600">Access Denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage user roles and permissions for {organization?.name || 'your organization'}</p>
        </div>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No users found in your organization.</p>
              <p className="text-sm mt-2">Users will appear here once they have logged in and created a profile.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3">User</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Last seen</th>
                    <th className="text-left p-3">Current Role</th>
                    <th className="text-left p-3">Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{user.full_name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3 text-gray-500">{formatLastSeen(user.last_sign_in_at)}</td>
                      <td className="p-3">
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Select
                          value={user.role}
                          onValueChange={(value) => handlePendingRoleChange(user, value)}
                          disabled={updatingUserId === user.id || user.id === profile?.id}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {user.id === profile?.id && (
                          <p className="text-xs text-gray-500 mt-1">Cannot change your own admin role.</p>
                        )}
                        {updatingUserId === user.id && (
                          <Loader2 className="h-4 w-4 animate-spin inline ml-2" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open) setConfirmation(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm role change</DialogTitle>
            <DialogDescription>
              {confirmation ? (
                <>
                  Changing <strong>{confirmation.user.full_name}</strong> from <strong>{getRoleLabel(confirmation.user.role)}</strong> to <strong>{getRoleLabel(confirmation.newRole)}</strong>.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {confirmation?.newRole === 'admin' && (
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              Granting admin access gives full system privileges. Confirm only if this user should manage roles and core settings.
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setConfirmation(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={confirmRoleChange}
              disabled={!confirmation || updatingUserId === confirmation.user.id}
              className="w-full sm:w-auto"
            >
              {updatingUserId === confirmation?.user.id ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
