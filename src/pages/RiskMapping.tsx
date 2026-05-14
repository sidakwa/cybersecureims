import { GitMerge } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Link2, CheckCircle, AlertTriangle, Target, Trash2 } from 'lucide-react';

interface Risk {
  id: string;
  risk_title: string;
  risk_description: string;
  risk_score: number;
  status: string;
}

interface Control {
  id: string;
  control_code: string;
  control_name: string;
}

interface Mapping {
  id: string;
  risk_id: string;
  control_id: string;
  mapping_type: string;
  mapping_effectiveness: number;
}

export default function RiskMapping() {
  const { profile, loading: authLoading } = useAuth();
  const { organizationId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [controls, setControls] = useState<Control[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [selectedControl, setSelectedControl] = useState('');
  const [mappingType, setMappingType] = useState('mitigates');
  const [effectiveness, setEffectiveness] = useState(50);

  useEffect(() => {
      if (authLoading) return;
    if (organizationId) {
      fetchData();
    }
  }, [organizationId, authLoading]);

  const fetchData = async () => {
    if (!organizationId) return;
    
    try {
      const [risksRes, controlsRes, mappingsRes] = await Promise.all([
        supabase.from('cyber_risks').select('*').eq('organization_id', organizationId).order('risk_score', { ascending: false }),
        supabase.from('uci_controls').select('id, control_code, control_name').eq('organization_id', organizationId).order('control_code'),
        supabase.from('risk_control_mappings').select('*')
      ]);
      
      setRisks(risksRes.data || []);
      setControls(controlsRes.data || []);
      setMappings(mappingsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMapping = async () => {
    if (!selectedRisk || !selectedControl) return;
    
    const { error } = await supabase.from('risk_control_mappings').insert({
      risk_id: selectedRisk.id,
      control_id: selectedControl,
      mapping_type: mappingType,
      mapping_effectiveness: effectiveness,
      mapped_by: 'User'
    });
    
    if (!error) {
      await fetchData();
      setModalOpen(false);
      setSelectedRisk(null);
      setSelectedControl('');
    }
  };

  const deleteMapping = async (mappingId: string) => {
    if (confirm('Remove this risk-control mapping?')) {
      await supabase.from('risk_control_mappings').delete().eq('id', mappingId);
      await fetchData();
    }
  };

  const getMappedControlsForRisk = (riskId: string) => {
    return mappings.filter(m => m.risk_id === riskId);
  };

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const mappedRisks = new Set(mappings.map(m => m.risk_id)).size;
  const coveragePercentage = risks.length > 0 ? Math.round((mappedRisks / risks.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <PageHeader title="Risk-to-Control Mapping" description="Map identified risks to framework controls" icon={<GitMerge className="h-6 w-6" />} />
          <p className="text-gray-600">Map risks to mitigating controls for complete coverage</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{coveragePercentage}%</div>
          <p className="text-sm text-gray-500">Coverage</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium">Coverage Status</p>
              <Progress value={coveragePercentage} className="mt-2" />
              <p className="text-xs text-gray-500 mt-1">{mappedRisks} of {risks.length} risks have controls</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Mappings</p>
              <div className="text-3xl font-bold">{mappings.length}</div>
              <p className="text-xs text-gray-500">risk-control relationships</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Risk Register with Controls</h2>
        {risks.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No risks found. Create risks first in the Risk Register.</CardContent></Card>
        ) : (
          risks.map((risk) => {
            const riskMappings = getMappedControlsForRisk(risk.id);
            const isMapped = riskMappings.length > 0;
            
            return (
              <Card key={risk.id} className={`border-l-4 ${isMapped ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold">{risk.risk_title}</h3>
                        <Badge className={risk.risk_score >= 20 ? 'bg-red-500' : risk.risk_score >= 15 ? 'bg-orange-500' : 'bg-yellow-500'}>
                          Score: {risk.risk_score}
                        </Badge>
                        {isMapped ? (
                          <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Mapped</Badge>
                        ) : (
                          <Badge className="bg-red-500"><AlertTriangle className="h-3 w-3 mr-1" /> Unmapped</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{risk.risk_description}</p>
                      
                      {riskMappings.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-2">Linked Controls:</p>
                          <div className="flex flex-wrap gap-2">
                            {riskMappings.map((mapping) => {
                              const control = controls.find(c => c.id === mapping.control_id);
                              return (
                                <Badge key={mapping.id} variant="secondary" className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {control?.control_code || mapping.control_id}
                                  <button onClick={() => deleteMapping(mapping.id)} className="ml-1 text-red-500 hover:text-red-700">
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedRisk(risk); setModalOpen(true); }}>
                      <Link2 className="h-4 w-4 mr-1" />Map Control
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Map Risk to Control</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Risk: <span className="font-normal">{selectedRisk?.risk_title}</span></p>
            </div>
            <div>
              <label className="text-sm font-medium">Control</label>
              <Select value={selectedControl} onValueChange={setSelectedControl}>
                <SelectTrigger>
                  <SelectValue placeholder="Select control..." />
                </SelectTrigger>
                <SelectContent>
                  {controls.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.control_code} - {c.control_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Mapping Type</label>
              <Select value={mappingType} onValueChange={setMappingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mitigates">Mitigates</SelectItem>
                  <SelectItem value="detects">Detects</SelectItem>
                  <SelectItem value="prevents">Prevents</SelectItem>
                  <SelectItem value="compensates">Compensates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Effectiveness (%)</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={effectiveness} 
                onChange={(e) => setEffectiveness(parseInt(e.target.value))} 
                className="w-full" 
              />
              <div className="text-center text-sm">{effectiveness}%</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={createMapping}>Create Mapping</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {risks.length > 0 && risks.length === mappedRisks && (
        <div className="bg-green-50 border border-green-500 text-green-700 p-4 rounded-lg text-center">
          <CheckCircle className="h-5 w-5 inline mr-2" />
          All risks have been mapped to controls! Good governance practice.
        </div>
      )}
    </div>
  );
}
