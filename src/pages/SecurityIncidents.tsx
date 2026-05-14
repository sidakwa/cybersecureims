import { AlertOctagon } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { AlertTriangle, CheckCircle, Clock, Plus } from 'lucide-react';

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  detected_at: string;
  resolved_at: string | null;
  created_at: string;
}

export default function SecurityIncidents() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<SecurityIncident | null>(null);
  const { profile, loading: authLoading } = useAuth();
  const organizationId = profile?.organization_id;

  useEffect(() => {
      if (authLoading) return;
    if (organizationId) {
      loadIncidents();
    }
  }, [organizationId, authLoading]);

  const loadIncidents = async () => {
    if (!organizationId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('security_incidents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('detected_at', { ascending: false });

    if (error) {
      console.error('Error loading incidents:', error);
    } else {
      setIncidents(data || []);
    }
    setLoading(false);
  };

  const saveIncident = async (incident: Partial<SecurityIncident>) => {
    if (!organizationId) return;

    if (editingIncident) {
      const { error } = await supabase
        .from('security_incidents')
        .update(incident)
        .eq('id', editingIncident.id)
        .eq('organization_id', organizationId);
      
      if (!error) {
        await loadIncidents();
        setModalOpen(false);
        setEditingIncident(null);
      }
    } else {
      const { error } = await supabase
        .from('security_incidents')
        .insert([{ ...incident, organization_id: organizationId }]);
      
      if (!error) {
        await loadIncidents();
        setModalOpen(false);
      }
    }
  };

  const deleteIncident = async (id: string) => {
    if (confirm('Are you sure you want to delete this incident?')) {
      await supabase.from('security_incidents').delete().eq('id', id);
      await loadIncidents();
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return <Badge className="bg-red-500">Critical</Badge>;
      case 'high': return <Badge className="bg-orange-500">High</Badge>;
      case 'medium': return <Badge className="bg-yellow-500">Medium</Badge>;
      default: return <Badge className="bg-blue-500">Low</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <Badge className="bg-green-500">Resolved</Badge>;
      case 'investigating': return <Badge className="bg-yellow-500">Investigating</Badge>;
      case 'closed': return <Badge className="bg-gray-500">Closed</Badge>;
      default: return <Badge className="bg-red-500">Open</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading incidents...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageHeader title="Security Incidents" description="Track and manage security incidents and responses" icon={<AlertOctagon className="h-6 w-6" />} />
          <p className="text-gray-600">Track and manage security incidents</p>
        </div>
        <Button onClick={() => {
          setEditingIncident(null);
          setModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Report Incident
        </Button>
      </div>

      <div className="grid gap-4">
        {incidents.map(incident => (
          <Card key={incident.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getSeverityBadge(incident.severity)}
                    {getStatusBadge(incident.status)}
                    <span className="text-sm text-gray-500">
                      Detected: {new Date(incident.detected_at).toLocaleString()}
                    </span>
                    {incident.resolved_at && (
                      <span className="text-sm text-green-600">
                        Resolved: {new Date(incident.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{incident.title}</h3>
                  <p className="text-gray-600 mt-1">{incident.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingIncident(incident);
                      setModalOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteIncident(incident.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <IncidentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={saveIncident}
        incident={editingIncident}
      />
    </div>
  );
}

// Incident Modal Component
function IncidentModal({ open, onClose, onSave, incident }: any) {
  const [formData, setFormData] = useState({
    title: incident?.title || '',
    description: incident?.description || '',
    severity: incident?.severity || 'medium',
    status: incident?.status || 'open',
    detected_at: incident?.detected_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    resolved_at: incident?.resolved_at?.split('T')[0] || ''
  });

  const handleSubmit = async () => {
    await onSave({
      ...formData,
      resolved_at: formData.resolved_at || null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{incident ? 'Edit Incident' : 'Report New Incident'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="Incident title"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the incident..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={v => setFormData({ ...formData, severity: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Detected Date</Label>
              <Input
                type="date"
                value={formData.detected_at}
                onChange={e => setFormData({ ...formData, detected_at: e.target.value })}
              />
            </div>
            <div>
              <Label>Resolved Date (optional)</Label>
              <Input
                type="date"
                value={formData.resolved_at}
                onChange={e => setFormData({ ...formData, resolved_at: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Incident</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
