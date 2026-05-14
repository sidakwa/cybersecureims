import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SecurityIncident } from '@/lib/cybersecure-types';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<SecurityIncident>) => void;
  incident?: SecurityIncident | null;
}

export function IncidentModal({ isOpen, onClose, onSave, incident }: IncidentModalProps) {
  const empty: Partial<SecurityIncident> = {
    title: '', incident_type: 'Unauthorized Access', severity: 'P3',
    description: '', status: 'open', affected_systems: [],
    containment_actions: '', eradication_steps: '', lessons_learned: '',
    regulatory_notification_required: false, assigned_to: '',
  };
  const [form, setForm] = useState<Partial<SecurityIncident>>(empty);

  useEffect(() => { setForm(incident ? { ...incident } : empty); }, [incident, isOpen]);

  const set = (field: keyof SecurityIncident, val: any) => setForm(f => ({ ...f, [field]: val }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{incident ? 'Edit Incident' : 'Report Security Incident'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Incident Title *</label>
              <input required type="text" value={form.title || ''} onChange={e => set('title', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                placeholder="e.g. Phishing Attack on Finance Team" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Incident Type *</label>
              <select value={form.incident_type || ''} onChange={e => set('incident_type', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500">
                {['Data Breach','Ransomware','Phishing','Unauthorized Access','DDoS','Insider Threat',
                  'Malware','Physical Security','Business Email Compromise','Supply Chain Attack',
                  'Credential Stuffing','Zero Day Exploit','Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select value={form.severity || 'P3'} onChange={e => set('severity', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500">
                <option value="P1">P1 – Critical (Business-wide impact)</option>
                <option value="P2">P2 – High (Major system/data affected)</option>
                <option value="P3">P3 – Medium (Limited impact)</option>
                <option value="P4">P4 – Low (Minimal impact)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={form.status || 'open'} onChange={e => set('status', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500">
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="contained">Contained</option>
                <option value="eradicated">Eradicated</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Assigned To</label>
              <input type="text" value={form.assigned_to || ''} onChange={e => set('assigned_to', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                placeholder="Incident handler / CIRT member" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mean Time to Detect (hours)</label>
              <input type="number" min={0} value={form.mean_time_to_detect_hours || ''} onChange={e => set('mean_time_to_detect_hours', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500" placeholder="Hours" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mean Time to Respond (hours)</label>
              <input type="number" min={0} value={form.mean_time_to_respond_hours || ''} onChange={e => set('mean_time_to_respond_hours', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500" placeholder="Hours" />
            </div>
            <div className="col-span-2 flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
              <input type="checkbox" id="reg_notif" checked={form.regulatory_notification_required || false}
                onChange={e => set('regulatory_notification_required', e.target.checked)}
                className="h-4 w-4 accent-orange-500" />
              <label htmlFor="reg_notif" className="text-sm font-medium text-orange-800">
                Regulatory notification required (e.g. GDPR 72-hour rule, HIPAA breach notification)
              </label>
            </div>
            {form.regulatory_notification_required && (
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Notification Deadline</label>
                <input type="datetime-local" value={form.notification_deadline || ''} onChange={e => set('notification_deadline', e.target.value)}
                  className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500" />
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea rows={3} value={form.description || ''} onChange={e => set('description', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="Describe what happened, when, and initial findings..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Containment Actions Taken</label>
              <textarea rows={2} value={form.containment_actions || ''} onChange={e => set('containment_actions', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="e.g. Isolated affected systems, revoked credentials..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Eradication Steps</label>
              <textarea rows={2} value={form.eradication_steps || ''} onChange={e => set('eradication_steps', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="e.g. Removed malware, patched vulnerability, re-imaged systems..." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Lessons Learned</label>
              <textarea rows={2} value={form.lessons_learned || ''} onChange={e => set('lessons_learned', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="What can be improved to prevent recurrence?" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">{incident ? 'Update Incident' : 'Report Incident'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
