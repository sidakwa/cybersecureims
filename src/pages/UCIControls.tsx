import { CheckSquare } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function UCIControls() {
  const { profile, loading: authLoading } = useAuth();
  const [controls, setControls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState('all');

  const organizationId = profile?.organization_id;

  console.log('UCIControls - organizationId:', organizationId, 'authLoading:', authLoading);

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchControls();
    } else {
      console.log('No organizationId, setting loading false');
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchControls = async () => {
    if (!organizationId) {
      console.log('No organizationId, skipping fetch');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching UCI controls for org:', organizationId);
      
      const { data, error } = await supabase
        .from('uci_controls')
        .select('*')
        .eq('organization_id', organizationId)
        .order('control_code', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        throw error;
      }
      
      console.log('Fetched controls count:', data?.length);
      setControls(data || []);
    } catch (err) {
      console.error('Error fetching UCI controls:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tiers = ['all', ...new Set(controls.map(c => c.risk_tier).filter(Boolean))];
  const filteredControls = selectedTier === 'all' ? controls : controls.filter(c => c.risk_tier === selectedTier);

  const getStatusIcon = (status: string) => {
    if (status === 'In Place') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'Partial') return <Clock className="h-4 w-4 text-yellow-500" />;
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  };

  const totalControls = controls.length;
  const inPlace = controls.filter(c => c.uci_status === 'In Place').length;
  const partial = controls.filter(c => c.uci_status === 'Partial').length;
  const notStarted = controls.filter(c => !c.uci_status || c.uci_status === 'Not Started').length;

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading controls: {error}</p>
            <Button className="mt-4" onClick={() => fetchControls()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <PageHeader title="UCI Dashboard" description="Unified Control Implementation status" icon={<CheckSquare className="h-6 w-6" />} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{totalControls}</div><p className="text-sm text-gray-500">Total Controls</p></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-green-600">{inPlace}</div><p className="text-sm text-green-600">In Place</p></CardContent></Card>
        <Card className="bg-yellow-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-yellow-600">{partial}</div><p className="text-sm text-yellow-600">Partial</p></CardContent></Card>
        <Card className="bg-red-50"><CardContent className="pt-6"><div className="text-2xl font-bold text-red-600">{notStarted}</div><p className="text-sm text-red-600">Not Started</p></CardContent></Card>
      </div>

      {tiers.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {tiers.map(tier => (
            <Button key={tier} variant={selectedTier === tier ? 'default' : 'outline'} size="sm" onClick={() => setSelectedTier(tier)}>
              {tier === 'all' ? 'All Tiers' : tier}
            </Button>
          ))}
        </div>
      )}

      {filteredControls.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-gray-500">No UCI controls found. The table may be empty or there might be a connection issue.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filteredControls.map((control) => (
            <Card key={control.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(control.uci_status)}
                      <span className="font-mono text-xs text-gray-500">{control.control_code}</span>
                      <Badge variant="outline" className="text-xs">{control.risk_tier || 'T2'}</Badge>
                    </div>
                    <h3 className="font-semibold">{control.control_name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>Maturity: {control.current_maturity || 'L0'} → {control.target_maturity || 'L3'}</span>
                    </div>
                  </div>
                  <Badge className={control.uci_status === 'In Place' ? 'bg-green-500' : control.uci_status === 'Partial' ? 'bg-yellow-500' : 'bg-gray-500'}>
                    {control.uci_status || 'Not Started'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
