import PageHeader from '@/components/PageHeader';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Grid3X3 } from 'lucide-react';
import RiskHeatMap from '../components/RiskHeatMap';

export default function RiskHeatmapPage() {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { fetchRisks(); }, [user]);

  const fetchRisks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cyber_risks')
        .select('id, risk_title, likelihood, impact, risk_score, status')
        .order('risk_score', { ascending: false });
      if (error) throw error;
      setRisks(data || []);
    } catch (err) {
      console.error('Error fetching risks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Map cyber_risks shape → RiskHeatMap component shape
  const mappedRisks = risks.map(r => ({
    id: r.id,
    risk_name: r.risk_title,
    likelihood: r.likelihood ?? 1,
    severity: r.impact ?? 1,
    risk_score: r.risk_score ?? (r.likelihood * r.impact),
    status: r.status,
  }));

  const critical = risks.filter(r => (r.risk_score ?? 0) >= 20).length;
  const high = risks.filter(r => { const s = r.risk_score ?? 0; return s >= 12 && s < 20; }).length;
  const medium = risks.filter(r => { const s = r.risk_score ?? 0; return s >= 5 && s < 12; }).length;
  const low = risks.filter(r => (r.risk_score ?? 0) < 5).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#0057B8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0057B8] -mt-6 -mx-6 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <PageHeader title="Risk Heatmap" description="Visual risk distribution across likelihood and impact" icon={<Grid3X3 className="h-6 w-6" />} />
          <p className="text-[#00D9FF] mt-1">Executive view of the organisation's risk landscape</p>
          <div className="flex justify-between items-center mt-2">
            <div className="w-32 h-1 bg-[#00D9FF] rounded-full"></div>
            <Badge className="bg-white/20 text-white">{risks.length} Risks Mapped</Badge>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Critical (20–25)</p>
            <p className="text-xl font-bold text-red-700">{critical}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">High (12–19)</p>
            <p className="text-xl font-bold text-orange-600">{high}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Medium (5–11)</p>
            <p className="text-xl font-bold text-yellow-600">{medium}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <p className="text-gray-500 text-xs">Low (1–4)</p>
            <p className="text-xl font-bold text-green-600">{low}</p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <RiskHeatMap risks={mappedRisks} />

      {/* Risk list sorted by score */}
      {risks.length > 0 && (
        <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-[#0D2240] text-sm">All Risks — Highest Score First</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Risk</th>
                  <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Likelihood</th>
                  <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Impact</th>
                  <th className="text-center p-3 text-sm font-medium text-[#0D2240]">Score</th>
                  <th className="text-left p-3 text-sm font-medium text-[#0D2240]">Status</th>
                </tr>
              </thead>
              <tbody>
                {risks.map(r => {
                  const score = r.risk_score ?? (r.likelihood * r.impact);
                  const scoreColor = score >= 20 ? 'bg-red-700 text-white' : score >= 12 ? 'bg-orange-500 text-white' : score >= 5 ? 'bg-yellow-500 text-black' : 'bg-green-200 text-gray-800';
                  return (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-[#0D2240]">{r.risk_title}</td>
                      <td className="p-3 text-center text-sm text-gray-600">{r.likelihood}</td>
                      <td className="p-3 text-center text-sm text-gray-600">{r.impact}</td>
                      <td className="p-3 text-center">
                        <Badge className={scoreColor}>{score}</Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs capitalize">{r.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
