import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Risk {
  id: string;
  risk_name: string;
  likelihood: number;
  severity: number;
  risk_score: number;
  status: string;
}

interface RiskHeatMapProps {
  risks: Risk[];
}

export default function RiskHeatMap({ risks }: RiskHeatMapProps) {
  // Create 5x5 matrix for likelihood (1-5) vs severity (1-5)
  const matrix: { score: number; risks: Risk[]; color: string }[][] = Array(5).fill(null).map(() => Array(5).fill(null));
  
  // Initialize matrix
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const score = (i + 1) * (j + 1);
      let color = '';
      if (score >= 20) color = 'bg-red-700';
      else if (score >= 15) color = 'bg-red-600';
      else if (score >= 12) color = 'bg-red-500';
      else if (score >= 8) color = 'bg-orange-500';
      else if (score >= 5) color = 'bg-yellow-500';
      else if (score >= 3) color = 'bg-yellow-300';
      else color = 'bg-green-200';
      
      matrix[i][j] = { score, risks: [], color };
    }
  }
  
  // Populate risks into matrix
  risks.forEach(risk => {
    const l = risk.likelihood - 1;
    const s = risk.severity - 1;
    if (l >= 0 && l < 5 && s >= 0 && s < 5) {
      matrix[l][s].risks.push(risk);
    }
  });
  
  return (
    <Card className="bg-white border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-[#0D2240] flex items-center gap-2">
          <span className="text-lg">🔥</span>
          Risk Heat Map - Likelihood vs Severity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-gray-300 bg-gray-50"></th>
                {[1, 2, 3, 4, 5].map(s => (
                  <th key={s} className="p-2 border border-gray-300 text-center bg-gray-50">
                    Severity: {s}
                  </th>
                ))}
               </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map(l => (
                <tr key={l}>
                  <th className="p-2 border border-gray-300 bg-gray-50">
                    Likelihood: {l}
                  </th>
                  {[1, 2, 3, 4, 5].map(s => {
                    const cell = matrix[l-1][s-1];
                    return (
                      <td 
                        key={s} 
                        className={`p-2 border border-gray-300 text-center ${cell.color} transition-all hover:opacity-80`}
                      >
                        <div className="cursor-pointer">
                          <div className="font-bold text-white">{cell.score}</div>
                          {cell.risks.length > 0 && (
                            <div className="text-xs text-white mt-1">
                              {cell.risks.length}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-700 rounded"></div>
            <span className="text-sm">Critical (20-25)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-sm">Critical (15-19)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm">High (8-14)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm">Medium (5-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span className="text-sm">Low (1-4)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
