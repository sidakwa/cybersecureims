import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FrameworkControl, ControlStatus, Framework } from '@/lib/cybersecure-types';

interface ControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<FrameworkControl>) => void;
  control?: FrameworkControl | null;
}

const STATUS_OPTIONS: { value: ControlStatus; label: string; color: string }[] = [
  { value: 'not_started',    label: 'Not Started',    color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress',    label: 'In Progress',    color: 'bg-blue-100 text-blue-700' },
  { value: 'implemented',    label: 'Implemented',    color: 'bg-green-100 text-green-700' },
  { value: 'not_applicable', label: 'Not Applicable', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'deferred',       label: 'Deferred',       color: 'bg-orange-100 text-orange-700' },
];

export function ControlModal({ isOpen, onClose, onSave, control }: ControlModalProps) {
  const [form, setForm] = useState<Partial<FrameworkControl>>({
    status: 'not_started',
    implementation_notes: '',
    owner: '',
    due_date: '',
    maturity_level: 0,
  });

  useEffect(() => {
    if (control) {
      setForm({
        status: control.status,
        implementation_notes: control.implementation_notes || '',
        owner: control.owner || '',
        due_date: control.due_date || '',
        maturity_level: control.maturity_level || 0,
        control_type: control.control_type,
      });
    } else {
      setForm({ status: 'not_started', implementation_notes: '', owner: '', due_date: '', maturity_level: 0 });
    }
  }, [control, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Update Control Status</h2>
            {control && (
              <p className="text-sm text-gray-500 mt-0.5">
                <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{control.control_id}</span>
                {' '}{control.control_title}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {control && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">Control Description</p>
              <p className="text-sm text-blue-800">{control.control_description}</p>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Implementation Status *</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    form.status === opt.value
                      ? 'border-blue-500 ' + opt.color
                      : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Maturity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maturity Level: <span className="font-bold text-blue-600">{form.maturity_level}/5</span>
            </label>
            <input
              type="range" min={0} max={5} step={1}
              value={form.maturity_level || 0}
              onChange={e => setForm(f => ({ ...f, maturity_level: parseInt(e.target.value) }))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 - None</span><span>1 - Initial</span><span>2 - Managed</span>
              <span>3 - Defined</span><span>4 - Quantified</span><span>5 - Optimized</span>
            </div>
          </div>

          {/* Owner */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Control Owner</label>
            <input
              type="text"
              value={form.owner || ''}
              onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
              placeholder="e.g. CISO, IT Manager, Security Team"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Implementation Date</label>
            <input
              type="date"
              value={form.due_date || ''}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value || undefined }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Implementation Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Notes</label>
            <textarea
              rows={4}
              value={form.implementation_notes || ''}
              onChange={e => setForm(f => ({ ...f, implementation_notes: e.target.value }))}
              placeholder="Describe how this control is implemented, any gaps, or reasons for exclusion..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save Changes</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
