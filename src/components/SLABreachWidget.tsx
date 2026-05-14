import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface SLABreach {
  entity_type: string;
  id: string;
  title: string;
  days_overdue: number;
  owner: string;
  escalation_level: number;
  next_escalation_to: string;
  priority: string;
  status: string;
}

export function SLABreachWidget() {
  const [breaches, setBreaches] = useState<SLABreach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreaches();
    const interval = setInterval(fetchBreaches, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBreaches = async () => {
    try {
      const { data, error } = await supabase
        .from('v_sla_breaches')
        .select('*')
        .eq('entity_type', 'finding')
        .order('days_overdue', { ascending: false });
      
      if (error) throw error;
      setBreaches(data || []);
    } catch (error) {
      console.error('Error fetching SLA breaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEscalationBadge = (level: number) => {
    const colors = {
      1: 'bg-yellow-500',
      2: 'bg-orange-500',
      3: 'bg-red-500',
      4: 'bg-red-700'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      High: 'text-red-600',
      Medium: 'text-yellow-600',
      Low: 'text-green-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Loading SLA breaches...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            SLA Breach Monitor
          </div>
          <Badge className={breaches.length > 0 ? 'bg-red-500' : 'bg-green-500'}>
            {breaches.length} Breach{breaches.length !== 1 ? 'es' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {breaches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
            <p>No active SLA breaches</p>
            <p className="text-sm">All findings are on track</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {breaches.slice(0, 5).map((breach) => (
              <div key={breach.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{breach.title}</p>
                    <p className="text-xs text-gray-500">Owner: {breach.owner || 'Unassigned'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getEscalationBadge(breach.escalation_level)}>
                      Level {breach.escalation_level}
                    </Badge>
                    <span className={`text-xs font-medium ${getPriorityColor(breach.priority)}`}>
                      {breach.priority || 'Medium'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium text-red-600">
                      {Math.floor(breach.days_overdue)} days overdue
                    </span>
                  </div>
                  
                  {breach.next_escalation_to && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-orange-500" />
                      <span className="text-xs text-orange-600">
                        Escalate to {breach.next_escalation_to}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {breaches.length > 5 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                +{breaches.length - 5} more breaches
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add missing import
import { CheckCircle } from 'lucide-react';
