import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (doc: any) => void;
  document?: any;
}

const DOC_TYPES = ['Policy', 'Procedure', 'Work Instruction', 'Form', 'Certificate', 'Report'];
const STATUSES = ['Draft', 'Under Review', 'Approved', 'Archived', 'Expired'];

export function DocumentModal({ isOpen, onClose, onSave, document }: DocumentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: DOC_TYPES[0],
    category: '',
    version: '1.0',
    status: 'Draft',
    owner: '',
    approved_by: '',
    approval_date: '',
    expiry_date: '',
    tags: '',
    description: ''
  });

  // Populate form when editing an existing document
  useEffect(() => {
    if (document) {
      setFormData({
        name: document.name || '',
        type: document.type || DOC_TYPES[0],
        category: document.category || '',
        version: document.version || '1.0',
        status: document.status || 'Draft',
        owner: document.owner || '',
        approved_by: document.approved_by || '',
        approval_date: document.approval_date || '',
        expiry_date: document.expiry_date || '',
        tags: document.tags?.join(', ') || '',
        description: document.description || ''
      });
    } else {
      // Reset form when adding new document
      setFormData({
        name: '',
        type: DOC_TYPES[0],
        category: '',
        version: '1.0',
        status: 'Draft',
        owner: '',
        approved_by: '',
        approval_date: '',
        expiry_date: '',
        tags: '',
        description: ''
      });
    }
  }, [document]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {document ? 'Edit Document' : 'Add Document'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Document Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., Food Safety, Quality, HACCP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Version *</label>
              <input
                type="text"
                required
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="1.0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Owner *</label>
              <input
                type="text"
                required
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Approved By</label>
              <input
                type="text"
                value={formData.approved_by}
                onChange={(e) => setFormData({ ...formData, approved_by: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Approval Date</label>
              <input
                type="date"
                value={formData.approval_date}
                onChange={(e) => setFormData({ ...formData, approval_date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date</label>
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="haccp, quality, sop"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {document ? 'Update Document' : 'Add Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
