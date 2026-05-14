import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface RiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (risk: any) => void;
  risk?: any;
}

const CATEGORIES = ['Biological', 'Chemical', 'Physical', 'Environmental', 'Operational', 'Supply Chain'];
const STATUSES = ['active', 'mitigated', 'review', 'in_progress'];

export function RiskModal({ isOpen, onClose, onSave, risk }: RiskModalProps) {
  const [formData, setFormData] = useState({
    category: CATEGORIES[0],
    hazard: '',
    risk_level: 'medium',
    likelihood: 3,
    severity: 3,
    mitigation: '',
    status: 'active',
    assigned_to: '',
    review_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (risk) {
      setFormData({
        category: risk.category || CATEGORIES[0],
        hazard: risk.hazard || '',
        risk_level: risk.risk_level || 'medium',
        likelihood: risk.likelihood || 3,
        severity: risk.severity || 3,
        mitigation: risk.mitigation || '',
        status: risk.status || 'active',
        assigned_to: risk.assigned_to || '',
        review_date: risk.review_date || new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        category: CATEGORIES[0],
        hazard: '',
        risk_level: 'medium',
        likelihood: 3,
        severity: 3,
        mitigation: '',
        status: 'active',
        assigned_to: '',
        review_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [risk]);

  const riskScore = formData.likelihood * formData.severity;
  
  const getRiskLevelFromScore = (score: number) => {
    if (score >= 16) return 'critical';
    if (score >= 10) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
  };

  const handleLikelihoodChange = (value: number) => {
    const newScore = value * formData.severity;
    setFormData({
      ...formData,
      likelihood: value,
      risk_level: getRiskLevelFromScore(newScore)
    });
  };

  const handleSeverityChange = (value: number) => {
    const newScore = formData.likelihood * value;
    setFormData({
      ...formData,
      severity: value,
      risk_level: getRiskLevelFromScore(newScore)
    });
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      risk_score: riskScore,
      risk_level: getRiskLevelFromScore(riskScore)
    });
    onClose();
  };

  const getRiskColor = (level: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{risk ? 'Edit Risk Assessment' : 'Add New Risk Assessment'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Category *</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded-lg px-3 py-2">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Hazard Description *</label><textarea rows={2} required value={formData.hazard} onChange={(e) => setFormData({ ...formData, hazard: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="Describe the hazard in detail..." /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Likelihood (1-5): {formData.likelihood}</label><input type="range" min="1" max="5" value={formData.likelihood} onChange={(e) => handleLikelihoodChange(parseInt(e.target.value))} className="w-full" /></div>
            <div><label className="block text-sm font-medium mb-1">Severity (1-5): {formData.severity}</label><input type="range" min="1" max="5" value={formData.severity} onChange={(e) => handleSeverityChange(parseInt(e.target.value))} className="w-full" /></div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg"><div className="flex justify-between items-center"><span className="text-sm font-medium">Risk Score:</span><span className={`text-2xl font-bold px-3 py-1 rounded ${getRiskColor(getRiskLevelFromScore(riskScore))}`}>{riskScore}</span></div></div>
          <div><label className="block text-sm font-medium mb-1">Mitigation Actions *</label><textarea rows={2} required value={formData.mitigation} onChange={(e) => setFormData({ ...formData, mitigation: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Assigned To</label><input type="text" value={formData.assigned_to} onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Review Date</label><input type="date" value={formData.review_date} onChange={(e) => setFormData({ ...formData, review_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded-lg px-3 py-2">{STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{risk ? 'Update' : 'Add Risk'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
