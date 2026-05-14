import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Clock, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

export default function AuditCalendar() {
  const { profile, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    audit_type: 'internal',
    location: '',
    status: 'scheduled'
  });

  const organizationId = profile?.organization_id;

  useEffect(() => {
    if (authLoading) return;
    if (organizationId) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [organizationId, authLoading]);

  const fetchEvents = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_calendar')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async () => {
    if (!organizationId) return;

    const payload = {
      ...formData,
      organization_id: organizationId
    };

    try {
      const { error } = await supabase.from('audit_calendar').insert([payload]);
      if (error) throw error;
      await fetchEvents();
      setModalOpen(false);
      setFormData({ title: '', start_date: '', end_date: '', audit_type: 'internal', location: '', status: 'scheduled' });
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Calendar</h1>
        <p className="text-gray-500 mt-1">Schedule and track upcoming audits</p>
      </div>

      <AuditNavigation />

      <div className="flex justify-end">
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Audit
        </Button>
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No scheduled audits.</CardContent></Card>
        ) : (
          events.map((event) => (
            <Card key={event.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'} - {event.end_date ? new Date(event.end_date).toLocaleDateString() : 'TBD'}</span>
                      </div>
                      <div>Type: {event.audit_type}</div>
                      {event.location && <div>Location: {event.location}</div>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Audit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Audit Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Audit Type</Label>
                <Select value={formData.audit_type} onValueChange={(v) => setFormData({...formData, audit_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="surveillance">Surveillance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveEvent}>Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
