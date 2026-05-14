import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Plus, Edit, Trash2 } from 'lucide-react';

export default function VendorRiskManagement() {
  const { profile, loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { organizationId } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchVendors();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchVendors = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('third_party_vendors')
        .select('*')
        .eq('organization_id', organizationId)
        .order('vendor_name', { ascending: true });

      if (error) throw error;
      setVendors(data || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch(risk?.toLowerCase()) {
      case 'high': return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      default: return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Risk Management</h1>
          <p className="text-gray-500 mt-1">Manage third-party vendor risks and assessments</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" /> Add Vendor</Button>
      </div>

      <div className="grid gap-4">
        {vendors.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No vendors found.</CardContent></Card>
        ) : (
          vendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-lg">{vendor.vendor_name}</h3>
                      {getRiskBadge(vendor.risk_level)}
                    </div>
                    <p className="text-sm text-gray-600">{vendor.description}</p>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Service: {vendor.service_type || '-'}</span>
                      <span>Status: {vendor.status || 'Active'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
