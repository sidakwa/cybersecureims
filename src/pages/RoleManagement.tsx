import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, RefreshCw, AlertCircle } from 'lucide-react';

interface UserWithProfile {
    id: string;
    email: string;
    role: string;
    full_name: string;
    organization_id: string;
    last_sign_in_at: string | null;
    has_profile: boolean;
}

export default function RoleManagement() {
    const { profile, isAdmin, organization } = useAuth();
    const [users, setUsers] = useState<UserWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const currentOrgId = organizationId;

    useEffect(() => {
        if (isAdmin && currentOrgId) {
            fetchUsers();
        } else {
            setLoading(false);
        }
    }, [isAdmin, currentOrgId]);

    const fetchUsers = async () => {
        if (!currentOrgId) {
            if (import.meta.env.DEV) {
              console.log('No organization ID available');
            }
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            if (import.meta.env.DEV) {
              console.log('Fetching users for org:', currentOrgId);
            }
            
            // First, get all profiles for this organization
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('organization_id', currentOrgId);

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                setError(profileError.message);
                throw profileError;
            }

            if (import.meta.env.DEV) {

              console.log('Profiles found:', profiles?.length || 0);

            }

            if (!profiles || profiles.length === 0) {
                if (import.meta.env.DEV) {
                  console.log('No profiles found for organization');
                }
                setUsers([]);
                setLoading(false);
                return;
            }

            // Map profiles to users
            const mappedUsers: UserWithProfile[] = profiles.map(prof => ({
                id: prof.id,
                email: prof.email,
                role: prof.role || 'viewer',
                full_name: prof.full_name || prof.email?.split('@')[0] || 'Unknown',
                organization_id: prof.organization_id,
                last_sign_in_at: null,
                has_profile: true
            }));

            setUsers(mappedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError('Failed to load users. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId: string, newRole: string) => {
        if (!currentOrgId) return;
        
        setUpdatingUserId(userId);
        setError(null);
        
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    role: newRole,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            // Refresh the user list
            await fetchUsers();
        } catch (error) {
            console.error("Error updating role:", error);
            setError('Failed to update user role. Please try again.');
        } finally {
            setUpdatingUserId(null);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            admin: 'bg-red-100 text-red-800',
            quality_manager: 'bg-purple-100 text-purple-800',
            auditor: 'bg-blue-100 text-blue-800',
            viewer: 'bg-gray-100 text-gray-800'
        };
        return colors[role] || 'bg-gray-100';
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
                                        <th className="text-left p-3">Current Role</th>
                                        <th className="text-left p-3">Change Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="p-3 font-medium">{user.full_name}</td>
                                            <td className="p-3">{user.email}</td>
                                            <td className="p-3">
                                                <Badge className={getRoleBadgeColor(user.role)}>
                                                    {user.role?.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(value) => updateUserRole(user.id, value)}
                                                    disabled={updatingUserId === user.id || user.email === profile?.email}
                                                >
                                                    <SelectTrigger className="w-36">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="quality_manager">Quality Manager</SelectItem>
                                                        <SelectItem value="auditor">Auditor</SelectItem>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                    </SelectContent>
                                                </Select>
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
        </div>
    );
}
