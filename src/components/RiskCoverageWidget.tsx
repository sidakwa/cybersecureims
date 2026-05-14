import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';

export function RiskCoverageWidget() {
  const [coverage, setCoverage] = useState({
    total_risks: 0,
    covered_risks: 0,
    uncovered_risks: 0,
    coverage_percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoverage();
  }, []);

  const fetchCoverage = async () => {
    try {
      const { data, error } = await supabase
        .from('v_risk_coverage_dashboard')
        .select('*')
        .single();
      
      if (error) throw error;
      setCoverage(data);
    } catch (error) {
      console.error('Error fetching risk coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">Loading risk coverage...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          Risk Traceability Coverage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Coverage Rate</span>
            <span className="text-2xl font-bold text-blue-600">
              {coverage.coverage_percentage}%
            </span>
          </div>
          <Progress value={coverage.coverage_percentage} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{coverage.total_risks}</div>
            <div className="text-xs text-gray-600">Total Risks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {coverage.covered_risks}
            </div>
            <div className="text-xs text-gray-600">Mapped to Controls</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {coverage.uncovered_risks}
            </div>
            <div className="text-xs text-gray-600">Unmapped Risks</div>
          </div>
        </div>

        {coverage.uncovered_risks > 0 && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⚠️ {coverage.uncovered_risks} risk(s) not mapped to any control. 
              Go to Risk Mapping to improve coverage.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
