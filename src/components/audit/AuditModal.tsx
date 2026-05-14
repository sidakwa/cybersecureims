import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AuditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  audit?: any;
}

export function AuditModal({ open, onClose, onSave, audit }: AuditModalProps) {
  const [formData, setFormData] = React.useState({
    title: audit?.title || '',
    assessment_date: audit?.assessment_date || new Date().toISOString().split('T')[0],
    assessor: audit?.assessor || '',
    standard: audit?.standard || 'ISO27001',
    audit_type: audit?.audit_type || 'internal',
    status: audit?.status || 'planned'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white">
        <DialogHeader>
          <DialogTitle>{audit ? 'Edit Audit' : 'New Audit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-gray-800 border-gray-700"
              required
            />
          </div>
          <div>
            <Label>Assessment Date</Label>
            <Input
              type="date"
              value={formData.assessment_date}
              onChange={(e) => setFormData({ ...formData, assessment_date: e.target.value })}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <div>
            <Label>Assessor</Label>
            <Input
              value={formData.assessor}
              onChange={(e) => setFormData({ ...formData, assessor: e.target.value })}
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <div>
            <Label>Standard</Label>
            <Select value={formData.standard} onValueChange={(value) => setFormData({ ...formData, standard: value })}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ISO27001">ISO 27001</SelectItem>
                <SelectItem value="SOC2">SOC 2</SelectItem>
                <SelectItem value="NIST_CSF">NIST CSF</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Audit Type</Label>
            <Select value={formData.audit_type} onValueChange={(value) => setFormData({ ...formData, audit_type: value })}>
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="external">External</SelectItem>
                <SelectItem value="certification">Certification</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
