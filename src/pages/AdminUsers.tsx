import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Shield, Mail, Calendar, RefreshCw, UserPlus, Building2, UserCog, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string | null;
  organization?: {
    id: string;
    name: string;
  };
  created_at: string | null;
  last_sign_in_at: string | null;
}

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', badge: 'bg-red-100 text-red-800' },
  { value: 'quality_manager', label: 'Quality Manager', badge: 'bg-blue-100 text-blue-800' },
  { value: 'auditor', label: 'Auditor', badge: 'bg-green-100 text-green-800' },
  { value: 'viewer', label: 'Viewer', badge: 'bg-gray-100 text-gray-800' },
];

export default function AdminUsersPage() {
  const { isAdmin, user, organization } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ user: AdminUser; newRole: string } | null>(null);

  // Check if user is default org admin
  const isDefaultOrgAdmin = isAdmin && organization?.name === 'Default Organization';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchOrganizations();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('admin-list-users');
      if (error) throw error;

      const payload = data as { users: AdminUser[] };
      setUsers(payload?.users || []);
    } catch (fetchError: any) {
      console.error('Error fetching users:', fetchError);
      setError(fetchError?.message || 'Failed to load users. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleRoleSelection = (target: AdminUser, newRole: string) => {
    if (target.role === newRole) return;
    if (target.id === user?.id && newRole !== 'admin') {
      setError('You cannot remove your own admin role.');
      return;
    }
    setPendingRoleChange({ user: target, newRole });
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange) return;

    const { user: target, newRole } = pendingRoleChange;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.functions.invoke('admin-update-role', {
        body: JSON.stringify({ userId: target.id, newRole }),
      });
      if (error) throw error;
      setUsers((current) => current.map((item) => item.id === target.id ? { ...item, role: newRole } : item));
      setPendingRoleChange(null);
    } catch (updateError: any) {
      console.error('Error updating role:', updateError);
      setError(updateError?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const updateUserOrganization = async (userId: string, newOrgId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: newOrgId || null })
        .eq('id', userId);
      
      if (error) throw error;
      await fetchUsers();
      alert(`User organization updated`);
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Failed to update organization');
    }
  };

  const inviteUser = async () => {
    if (!inviteEmail) return;
    
    setInviting(true);
    try {
      // Send invitation via Supabase Auth
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail, {
        data: {
          role: inviteRole,
          organization_id: inviteOrgId
        }
      });
      
      if (error) throw error;
      
      alert(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('viewer');
      setInviteOrgId('');
      setShowInvite(false);
      
      setTimeout(() => fetchUsers(), 2000);
    } catch (error: any) {
      console.error('Error inviting user:', error);
      alert('Failed to send invitation: ' + error.message);
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      quality_manager: 'bg-blue-100 text-blue-800',
      auditor: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100';
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <Shield className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <PageHeader title="User Management" description="Manage system users and access permissions" icon={<UserCog className="h-6 w-6" />} />
            <p className="text-sm text-muted-foreground">Manage user roles and organization assignments</p>
            {isDefaultOrgAdmin && (
              <p className="text-xs text-green-600 mt-1">✓ Default Organization Admin - Can create users</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isDefaultOrgAdmin && (
            <Button onClick={() => setShowInvite(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          )}
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email Address *</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="user@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="quality_manager">Quality Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="inviteOrg">Organization</Label>
              <Select value={inviteOrgId} onValueChange={setInviteOrgId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowInvite(false)} className="flex-1">Cancel</Button>
              <Button onClick={inviteUser} disabled={inviting || !inviteEmail} className="flex-1">
                {inviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="mb-4">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="py-4 px-5 text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Last seen</th>
                    <th className="p-3 text-left">Organization</th>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{userItem.full_name || userItem.email.split('@')[0]}</td>
                      <td className="p-3">{userItem.email}</td>
                      <td className="p-3 text-gray-500">{formatLastSeen(userItem.last_sign_in_at)}</td>
                      <td className="p-3">{userItem.organization?.name || 'Not assigned'}</td>
                      <td className="p-3">
                        <Badge className={getRoleBadgeColor(userItem.role)}>
                          {getRoleLabel(userItem.role)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Select
                          value={userItem.role}
                          onValueChange={(value) => handleRoleSelection(userItem, value)}
                          disabled={userItem.id === user?.id}
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
                        {userItem.id === user?.id && (
                          <p className="text-xs text-gray-500 mt-1">Cannot change your own role.</p>
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

      <Dialog open={Boolean(pendingRoleChange)} onOpenChange={(open) => { if (!open) setPendingRoleChange(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm role change</DialogTitle>
            <DialogDescription>
              {pendingRoleChange ? (
                <>
                  Change <strong>{pendingRoleChange.user.full_name}</strong> from <strong>{getRoleLabel(pendingRoleChange.user.role)}</strong> to <strong>{getRoleLabel(pendingRoleChange.newRole)}</strong>?
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          {pendingRoleChange?.newRole === 'admin' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
              Granting admin access gives full system privileges. Confirm only if this user should manage roles and core settings.
            </div>
          )}
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setPendingRoleChange(null)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={confirmRoleChange} disabled={!pendingRoleChange || loading} className="w-full sm:w-auto">
              {loading ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
