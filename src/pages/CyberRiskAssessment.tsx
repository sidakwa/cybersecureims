import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus, Edit, Trash2, Search, Save, RefreshCw, AlertTriangle, Target, Calendar, User, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Risk {
  id: string;
  risk_title: string;
  risk_description: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  status: string;
  risk_level: string;
  owner: string;
  mitigation_plan: string;
  detection_methods: string;
  response_plan: string;
  created_at: string;
  organization_id: string;
}

export default function CyberRiskAssessment() {
  const { organizationId } = useAuth();
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    risk_title: '',
    risk_description: '',
    likelihood: 3,
    impact: 3,
    status: 'Open',
    owner: '',
    mitigation_plan: '',
    detection_methods: '',
    response_plan: ''
  });

  const fetchRisks = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cyber_risks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('risk_score', { ascending: false });
      if (error) throw error;
      setRisks(data || []);
    } catch (error) {
      console.error('Error fetching risks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [organizationId]);

  const calculateRiskScore = (likelihood: number, impact: number) => {
    return likelihood * impact;
  };

  const getRiskLevel = (score: number) => {
    if (score >= 20) return 'Critical';
    if (score >= 12) return 'High';
    if (score >= 6) return 'Medium';
    return 'Low';
  };

  const saveRisk = async () => {
    if (!organizationId || !formData.risk_title.trim()) {
      alert('Risk title is required');
      return;
    }

    setSaving(true);
    const riskScore = calculateRiskScore(formData.likelihood, formData.impact);
    const riskLevel = getRiskLevel(riskScore);

    const riskData = {
      organization_id: organizationId,
      risk_title: formData.risk_title,
      risk_description: formData.risk_description,
      likelihood: formData.likelihood,
      impact: formData.impact,
      risk_score: riskScore,
      risk_level: riskLevel,
      status: formData.status,
      owner: formData.owner || null,
      mitigation_plan: formData.mitigation_plan || null,
      detection_methods: formData.detection_methods || null,
      response_plan: formData.response_plan || null
    };

    try {
      if (editingRisk) {
        const { error } = await supabase
          .from('cyber_risks')
          .update(riskData)
          .eq('id', editingRisk.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cyber_risks')
          .insert([riskData]);
        if (error) throw error;
      }
      await fetchRisks();
      setModalOpen(false);
      resetForm();
      alert(editingRisk ? 'Risk updated successfully!' : 'Risk created successfully!');
    } catch (error: any) {
      console.error('Error saving risk:', error);
      alert(error.message || 'Failed to save risk');
    } finally {
      setSaving(false);
    }
  };

  const deleteRisk = async (id: string) => {
    if (!confirm('Delete this risk? This action cannot be undone.')) return;
    const { error } = await supabase.from('cyber_risks').delete().eq('id', id);
    if (!error) fetchRisks();
  };

  const resetForm = () => {
    setEditingRisk(null);
    setFormData({
      risk_title: '',
      risk_description: '',
      likelihood: 3,
      impact: 3,
      status: 'Open',
      owner: '',
      mitigation_plan: '',
      detection_methods: '',
      response_plan: ''
    });
  };

  const getRiskLevelBadge = (level: string, score: number) => {
    const config = {
      Critical: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      High: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      Medium: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      Low: { color: 'bg-green-100 text-green-800', icon: Target }
    };
    const cfg = config[level as keyof typeof config] || config.Medium;
    const Icon = cfg.icon;
    return <Badge className={cfg.color}><Icon className="h-3 w-3 mr-1" />{level} (Score: {score})</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      'Mitigated': 'bg-green-100 text-green-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Open': 'bg-red-100 text-red-800',
      'Accepted': 'bg-yellow-100 text-yellow-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  const getTrendIcon = (risk: Risk) => {
    // For demo purposes - would need historical data for real trend
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const filteredRisks = risks.filter(risk => {
    const matchesSearch = risk.risk_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (risk.risk_description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || risk.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || risk.risk_level === levelFilter;
    const matchesTab = activeTab === 'all' || risk.risk_level === activeTab;
    return matchesSearch && matchesStatus && matchesLevel && matchesTab;
  });

  const stats = {
    total: risks.length,
    critical: risks.filter(r => r.risk_level === 'Critical').length,
    high: risks.filter(r => r.risk_level === 'High').length,
    medium: risks.filter(r => r.risk_level === 'Medium').length,
    low: risks.filter(r => r.risk_level === 'Low').length,
    open: risks.filter(r => r.status === 'Open').length,
    avgScore: risks.length ? Math.round(risks.reduce((sum, r) => sum + (r.risk_score || 0), 0) / risks.length) : 0
  };

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cyber Risk Register"
        description="Identify, assess, and manage cybersecurity risks"
        icon={<AlertTriangle className="h-6 w-6" />}
        actions={
          <Button onClick={() => { resetForm(); setModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Risk
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-gray-500">Total Risks</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="bg-red-50"><CardContent className="pt-4"><p className="text-sm text-red-600">Critical</p><p className="text-2xl font-bold text-red-600">{stats.critical}</p></CardContent></Card>
        <Card className="bg-orange-50"><CardContent className="pt-4"><p className="text-sm text-orange-600">High</p><p className="text-2xl font-bold text-orange-600">{stats.high}</p></CardContent></Card>
        <Card className="bg-yellow-50"><CardContent className="pt-4"><p className="text-sm text-yellow-600">Medium</p><p className="text-2xl font-bold text-yellow-600">{stats.medium}</p></CardContent></Card>
        <Card className="bg-green-50"><CardContent className="pt-4"><p className="text-sm text-green-600">Low</p><p className="text-2xl font-bold text-green-600">{stats.low}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-gray-500">Avg Score</p><p className="text-2xl font-bold text-purple-600">{stats.avgScore}</p></CardContent></Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search risks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Mitigated">Mitigated</SelectItem>
              <SelectItem value="Accepted">Accepted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Risk Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap gap-2 bg-transparent">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="Critical">Critical ({stats.critical})</TabsTrigger>
          <TabsTrigger value="High">High ({stats.high})</TabsTrigger>
          <TabsTrigger value="Medium">Medium ({stats.medium})</TabsTrigger>
          <TabsTrigger value="Low">Low ({stats.low})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredRisks.length === 0 ? (
            <Card><CardContent className="pt-12 pb-12 text-center"><AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" /><p className="text-gray-500">No risks found</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRisks.map((risk) => (
                <Card key={risk.id} className="hover:shadow-lg transition-all overflow-hidden">
                  <div className={`h-1 ${risk.risk_level === 'Critical' ? 'bg-red-500' : risk.risk_level === 'High' ? 'bg-orange-500' : risk.risk_level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{risk.risk_title}</h3>
                          {getRiskLevelBadge(risk.risk_level, risk.risk_score)}
                          {getStatusBadge(risk.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{risk.risk_description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                          <div className="flex items-center gap-2"><Target className="h-3 w-3 text-gray-400" />Likelihood: {risk.likelihood}/5</div>
                          <div className="flex items-center gap-2"><Target className="h-3 w-3 text-gray-400" />Impact: {risk.impact}/5</div>
                          <div className="flex items-center gap-2"><User className="h-3 w-3 text-gray-400" />Owner: {risk.owner || 'Unassigned'}</div>
                          <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-gray-400" />Created: {new Date(risk.created_at).toLocaleDateString()}</div>
                        </div>
                        {risk.mitigation_plan && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700"><strong>Mitigation:</strong> {risk.mitigation_plan.substring(0, 100)}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditingRisk(risk);
                          setFormData({
                            risk_title: risk.risk_title,
                            risk_description: risk.risk_description || '',
                            likelihood: risk.likelihood,
                            impact: risk.impact,
                            status: risk.status,
                            owner: risk.owner || '',
                            mitigation_plan: risk.mitigation_plan || '',
                            detection_methods: risk.detection_methods || '',
                            response_plan: risk.response_plan || ''
                          });
                          setModalOpen(true);
                        }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteRisk(risk.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRisk ? 'Edit Risk' : 'Add New Risk'}</DialogTitle>
            <DialogDescription>
              {editingRisk ? 'Update the risk details below.' : 'Fill in the details to create a new risk assessment.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Risk Title *</Label>
              <Input value={formData.risk_title} onChange={(e) => setFormData({...formData, risk_title: e.target.value})} placeholder="e.g., Data Breach Risk" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={formData.risk_description} onChange={(e) => setFormData({...formData, risk_description: e.target.value})} placeholder="Describe the risk..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Likelihood (1-5)</Label>
                <Select value={String(formData.likelihood)} onValueChange={(v) => setFormData({...formData, likelihood: parseInt(v)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} - {n === 1 ? 'Very Low' : n === 2 ? 'Low' : n === 3 ? 'Medium' : n === 4 ? 'High' : 'Very High'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Impact (1-5)</Label>
                <Select value={String(formData.impact)} onValueChange={(v) => setFormData({...formData, impact: parseInt(v)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} - {n === 1 ? 'Very Low' : n === 2 ? 'Low' : n === 3 ? 'Medium' : n === 4 ? 'High' : 'Very High'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Risk Score (Auto-calculated)</Label>
                <Input value={calculateRiskScore(formData.likelihood, formData.impact)} disabled className="bg-gray-100" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Mitigated">Mitigated</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Owner</Label>
              <Input value={formData.owner} onChange={(e) => setFormData({...formData, owner: e.target.value})} placeholder="Risk owner" />
            </div>
            <div>
              <Label>Mitigation Plan</Label>
              <Textarea rows={2} value={formData.mitigation_plan} onChange={(e) => setFormData({...formData, mitigation_plan: e.target.value})} placeholder="How will this risk be mitigated?" />
            </div>
            <div>
              <Label>Detection Methods</Label>
              <Textarea rows={2} value={formData.detection_methods} onChange={(e) => setFormData({...formData, detection_methods: e.target.value})} placeholder="How will this risk be detected?" />
            </div>
            <div>
              <Label>Response Plan</Label>
              <Textarea rows={2} value={formData.response_plan} onChange={(e) => setFormData({...formData, response_plan: e.target.value})} placeholder="Incident response plan for this risk" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveRisk} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingRisk ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
