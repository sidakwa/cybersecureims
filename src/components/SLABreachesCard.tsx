import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export function SLABreachesCard() {
  const [breaches, setBreaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreaches();
  }, []);

  const fetchBreaches = async () => {
    try {
      // Get overdue findings
      const today = new Date().toISOString().split('T')[0];
      const { data: findings } = await supabase
        .from('audit_findings')
        .select('id, finding_title, due_date, owner')
        .lt('due_date', today)
        .neq('finding_status', 'Resolved')
        .limit(5);
      
      const breachesWithData = (findings || []).map(f => {
        const daysOverdue = Math.ceil((new Date().getTime() - new Date(f.due_date).getTime()) / (1000 * 3600 * 24));
        let level = 1;
        if (daysOverdue > 45) level = 4;
        else if (daysOverdue > 30) level = 3;
        else if (daysOverdue > 14) level = 2;
        
        return {
          id: f.id,
          title: f.finding_title,
          days_overdue: daysOverdue,
          owner: f.owner,
          escalation_level: level
        };
      });
      
      setBreaches(breachesWithData);
    } catch (error) {
      console.error('Error fetching SLA breaches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || breaches.length === 0) return null;

  return (
    <Card className="border-l-4 border-l-red-500 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          SLA Breaches ({breaches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {breaches.map((breach) => (
            <div key={breach.id} className="flex justify-between items-center p-3 bg-white rounded-lg">
              <div>
                <p className="text-sm font-medium">{breach.title}</p>
                <p className="text-xs text-gray-500">Overdue by {breach.days_overdue} days • Owner: {breach.owner || 'Unassigned'}</p>
              </div>
              <Badge className={
                breach.escalation_level >= 3 ? 'bg-purple-500' :
                breach.escalation_level >= 2 ? 'bg-white0' : 'bg-yellow-500'
              }>
                Level {breach.escalation_level}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
