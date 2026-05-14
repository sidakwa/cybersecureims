import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface RiskCoverageCardProps {
  totalRisks: number;
  mappedRisks: number;
  coveragePercentage: number;
  riskControlMappings: number;
  onViewDetails: () => void;
}

export function RiskCoverageCard({ totalRisks, mappedRisks, coveragePercentage, riskControlMappings, onViewDetails }: RiskCoverageCardProps) {
  const getColorClass = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onViewDetails}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          Risk-to-Control Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-2xl font-bold">{coveragePercentage}%</span>
              <span className="text-sm text-gray-500">{mappedRisks}/{totalRisks} risks mapped</span>
            </div>
            <Progress value={coveragePercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">{riskControlMappings}</div>
              <p className="text-xs text-gray-500">Total Mappings</p>
            </div>
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{totalRisks - mappedRisks}</div>
              <p className="text-xs text-gray-500">Unmapped Risks</p>
            </div>
          </div>
          
          {coveragePercentage < 50 && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>Urgent: Map remaining risks to controls</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
