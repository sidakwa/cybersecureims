import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calendar, Clock, Users, FileText } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { AuditNavigation } from '../../components/audit/AuditNavigation';

interface AuditEvent {
  id: string;
  title: string;
  audit_type: string;
  start_date: string;
  end_date: string;
  location: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  team_members: string[];
  description: string;
}

export default function AuditCalendar() {
  const { organizationId, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AuditEvent | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    audit_type: 'internal',
    start_date: '',
    end_date: '',
    location: '',
    status: 'planned',
    team_members: [] as string[],
    description: ''
  });
  const [teamMemberInput, setTeamMemberInput] = useState('');

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
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async () => {
    if (!organizationId) return;
    const eventData = { organization_id: organizationId, ...formData };
    try {
      if (editingEvent) {
        const { error } = await supabase.from('audit_calendar').update(eventData).eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('audit_calendar').insert([eventData]);
        if (error) throw error;
      }
      await fetchEvents();
      setModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this calendar event?')) return;
    try {
      const { error } = await supabase.from('audit_calendar').delete().eq('id', id);
      if (error) throw error;
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const addTeamMember = () => {
    if (teamMemberInput.trim() && !formData.team_members.includes(teamMemberInput.trim())) {
      setFormData({ ...formData, team_members: [...formData.team_members, teamMemberInput.trim()] });
      setTeamMemberInput('');
    }
  };

  const removeTeamMember = (member: string) => {
    setFormData({ ...formData, team_members: formData.team_members.filter(m => m !== member) });
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      audit_type: 'internal',
      start_date: '',
      end_date: '',
      location: '',
      status: 'planned',
      team_members: [],
      description: ''
    });
    setTeamMemberInput('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in_progress': return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default: return <Badge className="bg-blue-100 text-blue-800">Planned</Badge>;
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
        <Button onClick={() => { resetForm(); setModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Schedule Audit
        </Button>
      </div>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <Card><CardContent className="pt-6 text-center text-gray-500">No scheduled audits.</CardContent></Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span>
                          {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'TBD'}
                          {' – '}
                          {event.end_date ? new Date(event.end_date).toLocaleDateString() : 'TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="capitalize">{event.audit_type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-gray-400" />
                        <span>{event.location || 'TBD'}</span>
                      </div>
                    </div>
                    {event.team_members?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {event.team_members.map((member) => (
                          <Badge key={member} variant="outline">{member}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingEvent(event);
                      setFormData({
                        title: event.title,
                        audit_type: event.audit_type,
                        start_date: event.start_date || '',
                        end_date: event.end_date || '',
                        location: event.location || '',
                        status: event.status,
                        team_members: event.team_members || [],
                        description: event.description || ''
                      });
                      setModalOpen(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteEvent(event.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Schedule Audit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} /></div>
              <div><Label>End Date</Label><Input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Online / Room / Site" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Team Members</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={teamMemberInput}
                  onChange={(e) => setTeamMemberInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTeamMember()}
                  placeholder="Add team member email"
                />
                <Button type="button" variant="outline" onClick={addTeamMember}>Add</Button>
              </div>
              {formData.team_members.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.team_members.map((member) => (
                    <Badge
                      key={member}
                      variant="outline"
                      className="cursor-pointer hover:bg-red-50 hover:text-red-600"
                      onClick={() => removeTeamMember(member)}
                    >
                      {member} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Description</Label>
              <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveEvent}>{editingEvent ? 'Update' : 'Schedule'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
