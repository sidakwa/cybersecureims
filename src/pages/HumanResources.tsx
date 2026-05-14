import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, GraduationCap, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HumanResources() {
  const { profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [personnel, setPersonnel] = useState<any[]>([]);
  
  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchPersonnel();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchPersonnel = async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonnel(data || []);
    } catch (error) {
      console.error('HumanResources error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'onboarding': return <Badge className="bg-blue-100 text-blue-800">Onboarding</Badge>;
      default: return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch(role?.toLowerCase()) {
      case 'admin': return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'manager': return <Badge className="bg-purple-100 text-purple-800">Manager</Badge>;
      case 'user': return <Badge variant="outline">User</Badge>;
      default: return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <PageHeader title="Security Training" description="Manage personnel and training records" icon={<GraduationCap className="h-6 w-6" />} />
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Personnel</Button>
      </div>
      
      <div className="grid gap-4">
        {personnel.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No personnel records found.</CardContent></Card>
        ) : (
          personnel.map((person) => (
            <Card key={person.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{person.full_name || person.name}</h3>
                      {getRoleBadge(person.role)}
                      {getStatusBadge(person.status)}
                    </div>
                    <p className="text-sm text-gray-500">{person.email}</p>
                    {person.department && <p className="text-sm text-gray-500 mt-1">Department: {person.department}</p>}
                    {person.training_status && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Training: {person.training_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
