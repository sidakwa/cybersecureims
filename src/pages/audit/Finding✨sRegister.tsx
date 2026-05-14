import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

const ORG_ID = "` + organizationId + `";

export default function FindingsRegister() {
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFindings();
  }, []);

  const fetchFindings = async () => {
    try {
      const { data } = await supabase
        .from('audit_findings')
        .select('*, audit_engagements(audit_ref, title)')
        .eq('organization_id', ORG_ID);
      setFindings(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-2">Findings Register</h1>
      <p className="text-gray-600 mb-6">Cross-audit findings tracking and remediation</p>
      
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr><th className="text-left p-3">Finding</th><th className="text-left p-3">Audit</th><th className="text-left p-3">Severity</th><th className="text-left p-3">Owner</th><th className="text-left p-3">Status</th><th className="text-left p-3">Due</th></tr>
              </thead>
              <tbody>
                {findings.map((f) => (
                  <tr key={f.id} className="border-b">
                    <td className="p-3">{f.finding_title}</td>
                    <td className="p-3">{f.audit_engagements?.audit_ref}</td>
                    <td className="p-3">{f.severity}</td>
                    <td className="p-3">{f.owner}</td>
                    <td className="p-3"><Badge className={f.finding_status === 'Open' ? 'bg-red-500' : 'bg-green-500'}>{f.finding_status}</Badge></td>
                    <td className="p-3">{f.due_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
