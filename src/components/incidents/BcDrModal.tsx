import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BcDrPlan } from '@/lib/cybersecure-types';

interface BcDrModalProps { isOpen: boolean; onClose: () => void; onSave: (d: Partial<BcDrPlan>) => void; plan?: BcDrPlan | null; }

export function BcDrModal({ isOpen, onClose, onSave, plan }: BcDrModalProps) {
  const empty: Partial<BcDrPlan> = { plan_name:'', plan_type:'BCP', status:'draft', version:'1.0', owner:'', department:'', scope:'', rto_hours:undefined, rpo_hours:undefined, test_result:'not_tested', test_notes:'' };
  const [form, setForm] = useState<Partial<BcDrPlan>>(empty);
  useEffect(() => { setForm(plan ? {...plan} : empty); }, [plan, isOpen]);
  const set = (f: keyof BcDrPlan, v: any) => setForm(p => ({...p, [f]: v}));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{plan ? 'Edit Plan' : 'Add BC/DR Plan'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Plan Name *</label>
              <input required type="text" value={form.plan_name||''} onChange={e=>set('plan_name',e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" placeholder="e.g. IT Disaster Recovery Plan" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plan Type</label>
              <select value={form.plan_type||'BCP'} onChange={e=>set('plan_type',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="BCP">BCP – Business Continuity Plan</option>
                <option value="DRP">DRP – Disaster Recovery Plan</option>
                <option value="IRP">IRP – Incident Response Plan</option>
                <option value="COOP">COOP – Continuity of Operations</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select value={form.status||'draft'} onChange={e=>set('status',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="under_review">Under Review</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Version</label>
              <input type="text" value={form.version||''} onChange={e=>set('version',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 1.0, 2.3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Owner</label>
              <input type="text" value={form.owner||''} onChange={e=>set('owner',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Plan owner / responsible person" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RTO (hours)</label>
              <input type="number" min={0} value={form.rto_hours||''} onChange={e=>set('rto_hours',e.target.value?parseInt(e.target.value):undefined)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Recovery Time Objective" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">RPO (hours)</label>
              <input type="number" min={0} value={form.rpo_hours||''} onChange={e=>set('rpo_hours',e.target.value?parseInt(e.target.value):undefined)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Recovery Point Objective" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Tested</label>
              <input type="date" value={form.last_tested||''} onChange={e=>set('last_tested',e.target.value||undefined)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Next Test Date</label>
              <input type="date" value={form.next_test_date||''} onChange={e=>set('next_test_date',e.target.value||undefined)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Test Result</label>
              <select value={form.test_result||'not_tested'} onChange={e=>set('test_result',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="not_tested">Not Tested</option>
                <option value="passed">Passed</option>
                <option value="partial">Partial Pass</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Approved By</label>
              <input type="text" value={form.approved_by||''} onChange={e=>set('approved_by',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Scope</label>
              <textarea rows={2} value={form.scope||''} onChange={e=>set('scope',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="What systems / processes / locations does this plan cover?" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Test Notes</label>
              <textarea rows={2} value={form.test_notes||''} onChange={e=>set('test_notes',e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Observations from the last test exercise..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{plan?'Update Plan':'Add Plan'}</Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
