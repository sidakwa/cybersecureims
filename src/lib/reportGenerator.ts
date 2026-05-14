import * as XLSX from 'xlsx';

interface Risk {
  id: string;
  risk_name: string;
  category: string;
  likelihood: number;
  severity: number;
  risk_score: number;
  threat_actor: string;
  mitigation_controls: string;
  owner: string;
  status: string;
  created_at: string;
}

export const exportToExcel = (risks: Risk[], title: string = 'Risk Assessment Report') => {
  const excelData = risks.map(risk => ({
    'Risk Name': risk.risk_name,
    'Category': risk.category,
    'Likelihood': risk.likelihood,
    'Severity': risk.severity,
    'Risk Score': risk.risk_score,
    'Risk Level': risk.risk_score >= 15 ? 'Critical' : risk.risk_score >= 8 ? 'High' : risk.risk_score >= 4 ? 'Medium' : 'Low',
    'Threat Actor': risk.threat_actor,
    'Mitigation Controls': risk.mitigation_controls,
    'Owner': risk.owner,
    'Status': risk.status,
    'Created': new Date(risk.created_at).toLocaleDateString()
  }));
  
  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Risks');
  
  const summaryData = [
    { Metric: 'Total Risks', Value: risks.length },
    { Metric: 'Critical Risks', Value: risks.filter(r => r.risk_score >= 15).length },
    { Metric: 'High Risks', Value: risks.filter(r => r.risk_score >= 8 && r.risk_score < 15).length },
    { Metric: 'Medium Risks', Value: risks.filter(r => r.risk_score >= 4 && r.risk_score < 8).length },
    { Metric: 'Low Risks', Value: risks.filter(r => r.risk_score < 4).length },
    { Metric: 'Generated', Value: new Date().toLocaleString() }
  ];
  
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
  
  XLSX.writeFile(wb, `risk-report-${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportToCSV = (risks: Risk[]) => {
  const headers = ['Risk Name', 'Category', 'Likelihood', 'Severity', 'Risk Score', 'Risk Level', 'Status', 'Owner'];
  const csvData = risks.map(risk => [
    risk.risk_name,
    risk.category,
    risk.likelihood,
    risk.severity,
    risk.risk_score,
    risk.risk_score >= 15 ? 'Critical' : risk.risk_score >= 8 ? 'High' : risk.risk_score >= 4 ? 'Medium' : 'Low',
    risk.status,
    risk.owner
  ]);
  
  const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `risk-report-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (risks: Risk[], title: string) => {
  // Simple alert for now - PDF generation requires more setup
  alert(`PDF Export: ${title}\nTotal Risks: ${risks.length}\nCritical: ${risks.filter(r => r.risk_score >= 15).length}\nHigh: ${risks.filter(r => r.risk_score >= 8 && r.risk_score < 15).length}\nMedium: ${risks.filter(r => r.risk_score >= 4 && r.risk_score < 8).length}\nLow: ${risks.filter(r => r.risk_score < 4).length}\n\nFor full PDF export with jspdf, additional configuration is needed. The CSV and Excel exports are fully functional.`);
};
