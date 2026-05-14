import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Asset } from '@/lib/cybersecure-types';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Asset>) => void;
  asset?: Asset | null;
}

export function AssetModal({ isOpen, onClose, onSave, asset }: AssetModalProps) {
  const empty: Partial<Asset> = {
    asset_name: '', asset_type: 'server', criticality: 'medium',
    data_classification: 'internal', environment: 'production', status: 'active',
    owner: '', department: '', location: '', ip_address: '', operating_system: '',
    vendor: '', notes: '',
  };
  const [form, setForm] = useState<Partial<Asset>>(empty);

  useEffect(() => {
    setForm(asset ? { ...asset } : empty);
  }, [asset, isOpen]);

  const set = (field: keyof Asset, val: any) => setForm(f => ({ ...f, [field]: val }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{asset ? 'Edit Asset' : 'Add Asset'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name *</label>
              <input required type="text" value={form.asset_name || ''} onChange={e => set('asset_name', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Production Web Server 01" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select value={form.asset_type || ''} onChange={e => set('asset_type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                {['server','endpoint','application','database','network_device','cloud_service','data_store','mobile_device','iot_device','people','process','other'].map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Tag / ID</label>
              <input type="text" value={form.asset_tag || ''} onChange={e => set('asset_tag', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. SRV-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criticality *</label>
              <select value={form.criticality || 'medium'} onChange={e => set('criticality', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Classification *</label>
              <select value={form.data_classification || 'internal'} onChange={e => set('data_classification', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
                <option value="top_secret">Top Secret</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
              <select value={form.environment || 'production'} onChange={e => set('environment', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
                <option value="dr">DR</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <input type="text" value={form.owner || ''} onChange={e => set('owner', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="Asset owner name / team" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input type="text" value={form.department || ''} onChange={e => set('department', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. IT, Finance, HR" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
              <input type="text" value={form.ip_address || ''} onChange={e => set('ip_address', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 10.0.1.25" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operating System</label>
              <input type="text" value={form.operating_system || ''} onChange={e => set('operating_system', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Ubuntu 22.04, Windows Server 2022" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor / Manufacturer</label>
              <input type="text" value={form.vendor || ''} onChange={e => set('vendor', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. AWS, Dell, Microsoft" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={form.location || ''} onChange={e => set('location', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. AWS us-east-1, DC Rack A-3" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End of Life Date</label>
              <input type="date" value={form.end_of_life_date || ''} onChange={e => set('end_of_life_date', e.target.value || undefined)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status || 'active'} onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="active">Active</option>
                <option value="decommissioned">Decommissioned</option>
                <option value="under_review">Under Review</option>
                <option value="disposed">Disposed</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea rows={3} value={form.notes || ''} onChange={e => set('notes', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Additional notes about this asset..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{asset ? 'Update Asset' : 'Add Asset'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
