import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Users, Shield, Mail, Calendar, RefreshCw, UserPlus, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function AdminUsersPage() {
  const { isAdmin, user, organization } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteOrgId, setInviteOrgId] = useState('');
  const [inviting, setInviting] = useState(false);

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
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*, organization:organization_id(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
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

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      await fetchUsers();
      alert(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
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

      {/* Users List */}
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
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium">{user.full_name || user.email?.split('@')[0]}</span>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role?.toUpperCase() || 'VIEWER'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Building2 className="h-3 w-3" />
                      <span>Organization: {user.organization?.name || 'Not assigned'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={user.role || 'viewer'}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="auditor">Auditor</option>
                      <option value="quality_manager">Quality Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    {isDefaultOrgAdmin && (
                      <select
                        value={user.organization_id || ''}
                        onChange={(e) => updateUserOrganization(user.id, e.target.value)}
                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                      >
                        <option value="">No Organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>{org.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
