import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: any) => void;
  supplier?: any;
}

const CATEGORIES = ['Raw Materials', 'Packaging', 'Logistics', 'Services', 'Equipment', 'Chemicals'];
const STATUSES = ['Active', 'Approved', 'Probation', 'Suspended', 'Rejected'];
const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export function SupplierModal({ isOpen, onClose, onSave, supplier }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    status: 'Active',
    risk_level: 'Medium',
    score: 0,
    last_audit_date: '',
    next_audit_date: '',
    certifications: '',
    contact_person: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Populate form when editing an existing supplier
  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        category: supplier.category || CATEGORIES[0],
        status: supplier.status || 'Active',
        risk_level: supplier.risk_level || 'Medium',
        score: supplier.score || 0,
        last_audit_date: supplier.last_audit_date || '',
        next_audit_date: supplier.next_audit_date || '',
        certifications: supplier.certifications?.join(', ') || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        notes: supplier.notes || ''
      });
    } else {
      // Reset form when adding new supplier
      setFormData({
        name: '',
        category: CATEGORIES[0],
        status: 'Active',
        risk_level: 'Medium',
        score: 0,
        last_audit_date: '',
        next_audit_date: '',
        certifications: '',
        contact_person: '',
        email: '',
        phone: '',
        notes: ''
      });
    }
  }, [supplier]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data for save - convert empty dates to null
    const saveData = {
      name: formData.name,
      category: formData.category,
      status: formData.status,
      risk_level: formData.risk_level,
      score: Number(formData.score) || 0,
      last_audit_date: formData.last_audit_date || null,
      next_audit_date: formData.next_audit_date || null,
      certifications: formData.certifications.split(',').map(c => c.trim()).filter(c => c),
      contact_person: formData.contact_person || null,
      email: formData.email || null,
      phone: formData.phone || null,
      notes: formData.notes || null
    };
    
    onSave(saveData);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Approved: 'text-green-600',
      Active: 'text-blue-600',
      Probation: 'text-orange-600',
      Suspended: 'text-red-600',
      Rejected: 'text-gray-600'
    };
    return colors[status as keyof typeof colors] || '';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supplier Name *</label>
              <input 
                type="text" 
                required 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                className="w-full border rounded-lg px-3 py-2" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select 
                value={formData.category} 
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                className="w-full border rounded-lg px-3 py-2"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} 
                className={`w-full border rounded-lg px-3 py-2 ${getStatusColor(formData.status)}`}
              >
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Risk Level</label>
              <select 
                value={formData.risk_level} 
                onChange={(e) => setFormData({ ...formData, risk_level: e.target.value as any })} 
                className="w-full border rounded-lg px-3 py-2"
              >
                {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Supplier Score (%)</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={formData.score} 
              onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })} 
              className="w-full border rounded-lg px-3 py-2" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Last Audit Date</label>
              <input 
                type="date" 
                value={formData.last_audit_date} 
                onChange={(e) => setFormData({ ...formData, last_audit_date: e.target.value })} 
                className="w-full border rounded-lg px-3 py-2" 
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty if not applicable</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Next Audit Date</label>
              <input 
                type="date" 
                value={formData.next_audit_date} 
                onChange={(e) => setFormData({ ...formData, next_audit_date: e.target.value })} 
                className="w-full border rounded-lg px-3 py-2" 
              />
              <p className="text-xs text-gray-400 mt-1">Leave empty if not applicable</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Certifications (comma-separated)</label>
            <input 
              type="text" 
              value={formData.certifications} 
              onChange={(e) => setFormData({ ...formData, certifications: e.target.value })} 
              className="w-full border rounded-lg px-3 py-2" 
              placeholder="ISO 9001, BRCGS, GlobalG.A.P." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Contact Person</label>
              <input 
                type="text" 
                value={formData.contact_person} 
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} 
                className="w-full border rounded-lg px-3 py-2" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                className="w-full border rounded-lg px-3 py-2" 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input 
              type="tel" 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              className="w-full border rounded-lg px-3 py-2" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea 
              rows={3} 
              value={formData.notes} 
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
              className="w-full border rounded-lg px-3 py-2" 
              placeholder="Additional notes about the supplier..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {supplier ? 'Update Supplier' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
