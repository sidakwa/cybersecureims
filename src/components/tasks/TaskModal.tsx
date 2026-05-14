import { useState } from 'react';
import { X } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => void;
  task?: any;
}

const MODULES = ['Supplier QA', 'Health & Safety', 'Audit Master', 'Customer Complaints', 'Technical', 'Maintenance', 'Production', 'Logistics'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['pending', 'in_progress', 'completed', 'overdue', 'escalated'];

export function TaskModal({ isOpen, onClose, onSave, task }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    module: task?.module || MODULES[0],
    priority: task?.priority || 'medium',
    status: task?.status || 'pending',
    assignee: task?.assignee || '',
    deadline: task?.deadline || new Date().toISOString().split('T')[0],
    daysUntilDue: task?.daysUntilDue || 0,
    escalatedFrom: task?.escalatedFrom || '',
    escalatedTo: task?.escalatedTo || ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Calculate days until due
    const today = new Date();
    const deadlineDate = new Date(formData.deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    onSave({ ...formData, daysUntilDue: diffDays });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {task ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Task Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g., Complete HACCP Review"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Module *</label>
            <select
              required
              value={formData.module}
              onChange={(e) => setFormData({ ...formData, module: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assignee *</label>
            <input
              type="text"
              required
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="e.g., John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Deadline *</label>
            <input
              type="date"
              required
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full border rounded-lg px-3 py-2"
            >
              {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full border rounded-lg px-3 py-2"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
            </select>
          </div>

          {formData.status === 'escalated' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Escalated From</label>
                <input
                  type="text"
                  value={formData.escalatedFrom}
                  onChange={(e) => setFormData({ ...formData, escalatedFrom: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Who escalated this?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Escalated To</label>
                <input
                  type="text"
                  value={formData.escalatedTo}
                  onChange={(e) => setFormData({ ...formData, escalatedTo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Manager name"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {task ? 'Update' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
