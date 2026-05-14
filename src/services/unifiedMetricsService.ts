import { supabase } from '@/lib/supabase';

export interface UnifiedMetrics {
  totalAudits: number;
  passedAudits: number;
  failedAudits: number;
  scheduledAudits: number;
  inProgressAudits: number;
  auditPassRate: number;
  averageAuditScore: number;
  totalFindings: number;
  totalDocuments: number;
  approvedDocuments: number;
  draftDocuments: number;
  archivedDocuments: number;
  documentCompliance: number;
  totalEmployees: number;
  activeEmployees: number;
  trainedEmployees: number;
  inductionCompleted: number;
  trainingCompliance: number;
  medicalCompliance: number;
  totalSuppliers: number;
  approvedSuppliers: number;
  probationSuppliers: number;
  suspendedSuppliers: number;
  supplierCompliance: number;
  averageSupplierScore: number;
  totalRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  mitigatedRisks: number;
  riskExposure: number;
  riskMitigationRate: number;
  totalNCRs: number;
  openNCRs: number;
  closedNCRs: number;
  ncrClosureRate: number;
  criticalNCRs: number;
  averageResolutionDays: number;
  totalComplaints: number;
  resolvedComplaints: number;
  openComplaints: number;
  complaintResolutionRate: number;
  criticalComplaints: number;
  totalSightings: number;
  closedSightings: number;
  openSightings: number;
  pestCompliance: number;
  totalProductionOrders: number;
  completedOrders: number;
  qualityHoldOrders: number;
  productionEfficiency: number;
  totalMaintenanceJobs: number;
  openJobs: number;
  completedJobs: number;
  maintenanceCompliance: number;
  clauseScores: Record<string, number>;
  overallCompliance: number;
  overallRiskScore: number;
  overallSafetyScore: number;
  qcpCompliance?: number;
  cleaningCompliance?: number;
}

let cachedMetrics: UnifiedMetrics | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60000;

export async function fetchUnifiedMetrics(organizationId: string, forceRefresh: boolean = false): Promise<UnifiedMetrics> {
  const now = Date.now();
  if (!forceRefresh && cachedMetrics && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedMetrics;
  }
  
  try {
    const [
      auditsResult,
      documentsResult,
      employeesResult,
      suppliersResult,
      risksResult,
      ncrsResult,
      complaintsResult,
      pestResult,
      productionResult,
      maintenanceResult
    ] = await Promise.all([
      supabase.from('audits').select('*').eq('organization_id', organizationId),
      supabase.from('documents').select('*').eq('organization_id', organizationId),
      supabase.from('employees').select('*').eq('organization_id', organizationId),
      supabase.from('suppliers').select('*').eq('organization_id', organizationId),
      supabase.from('risks').select('*').eq('organization_id', organizationId),
      supabase.from('quality_ncrs').select('*').eq('organization_id', organizationId),
      supabase.from('complaints').select('*').eq('organization_id', organizationId),
      supabase.from('pest_sightings').select('*').eq('organization_id', organizationId),
      supabase.from('production_orders').select('*').eq('organization_id', organizationId),
      supabase.from('maintenance_jobs').select('*').eq('organization_id', organizationId)
    ]);
    
    const audits = auditsResult.data || [];
    const documents = documentsResult.data || [];
    const employees = employeesResult.data || [];
    const suppliers = suppliersResult.data || [];
    const risks = risksResult.data || [];
    const ncrs = ncrsResult.data || [];
    const complaints = complaintsResult.data || [];
    const pest = pestResult.data || [];
    const production = productionResult.data || [];
    const maintenance = maintenanceResult.data || [];
    
    const totalAudits = audits.length;
    const passedAudits = audits.filter((a: any) => a.status === 'passed').length;
    const failedAudits = audits.filter((a: any) => a.status === 'failed').length;
    const scheduledAudits = audits.filter((a: any) => a.status === 'scheduled').length;
    const inProgressAudits = audits.filter((a: any) => a.status === 'in_progress').length;
    const auditPassRate = totalAudits > 0 ? Math.round((passedAudits / totalAudits) * 100) : 0;
    const averageAuditScore = audits.filter((a: any) => a.score > 0).reduce((sum: number, a: any) => sum + a.score, 0) / (audits.filter((a: any) => a.score > 0).length || 1);
    const totalFindings = audits.reduce((sum: number, a: any) => sum + (a.findings || 0), 0);
    
    const totalDocuments = documents.length;
    const approvedDocuments = documents.filter((d: any) => d.status === 'Approved').length;
    const draftDocuments = documents.filter((d: any) => d.status === 'Draft').length;
    const archivedDocuments = documents.filter((d: any) => d.status === 'Archived').length;
    const documentCompliance = totalDocuments > 0 ? Math.round((approvedDocuments / totalDocuments) * 100) : 0;
    
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e: any) => e.active === true).length;
    const trainedEmployees = employees.filter((e: any) => e.induction_completed === true).length;
    const inductionCompleted = trainedEmployees;
    const trainingCompliance = totalEmployees > 0 ? Math.round((trainedEmployees / totalEmployees) * 100) : 0;
    const medicalCompliance = totalEmployees > 0 ? Math.round(employees.filter((e: any) => e.medical_surveillance_expiry && new Date(e.medical_surveillance_expiry) > new Date()).length / totalEmployees * 100) : 0;
    
    const totalSuppliers = suppliers.length;
    const approvedSuppliers = suppliers.filter((s: any) => s.status === 'Approved').length;
    const probationSuppliers = suppliers.filter((s: any) => s.status === 'Probation').length;
    const suspendedSuppliers = suppliers.filter((s: any) => s.status === 'Suspended').length;
    const supplierCompliance = totalSuppliers > 0 ? Math.round((approvedSuppliers / totalSuppliers) * 100) : 0;
    const averageSupplierScore = suppliers.filter((s: any) => s.score > 0).reduce((sum: number, s: any) => sum + s.score, 0) / (suppliers.filter((s: any) => s.score > 0).length || 1);
    
    const totalRisks = risks.length;
    const criticalRisks = risks.filter((r: any) => r.risk_level === 'critical').length;
    const highRisks = risks.filter((r: any) => r.risk_level === 'high').length;
    const mediumRisks = risks.filter((r: any) => r.risk_level === 'medium').length;
    const lowRisks = risks.filter((r: any) => r.risk_level === 'low').length;
    const mitigatedRisks = risks.filter((r: any) => r.status === 'mitigated').length;
    const riskExposure = totalRisks > 0 ? Math.round(((criticalRisks * 100) + (highRisks * 70) + (mediumRisks * 40) + (lowRisks * 10)) / totalRisks) : 0;
    const riskMitigationRate = totalRisks > 0 ? Math.round((mitigatedRisks / totalRisks) * 100) : 100;
    
    const totalNCRs = ncrs.length;
    const openNCRs = ncrs.filter((n: any) => n.status !== 'Closed' && n.status !== 'Verified').length;
    const closedNCRs = ncrs.filter((n: any) => n.status === 'Closed' || n.status === 'Verified').length;
    const ncrClosureRate = totalNCRs > 0 ? Math.round((closedNCRs / totalNCRs) * 100) : 100;
    const criticalNCRs = ncrs.filter((n: any) => n.severity === 'Critical').length;
    
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter((c: any) => c.status === 'Resolved' || c.status === 'Closed').length;
    const openComplaints = complaints.filter((c: any) => c.status !== 'Resolved' && c.status !== 'Closed').length;
    const complaintResolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;
    const criticalComplaints = complaints.filter((c: any) => c.severity === 'Critical').length;
    
    const totalSightings = pest.length;
    const closedSightings = pest.filter((s: any) => s.status === 'Closed' || s.status === 'Verified').length;
    const openSightings = pest.filter((s: any) => s.status !== 'Closed' && s.status !== 'Verified').length;
    const pestCompliance = totalSightings > 0 ? Math.round((closedSightings / totalSightings) * 100) : 100;
    
    const totalProductionOrders = production.length;
    const completedOrders = production.filter((p: any) => p.status === 'completed').length;
    const qualityHoldOrders = production.filter((p: any) => p.quality_hold === true).length;
    const productionEfficiency = totalProductionOrders > 0 ? Math.round((completedOrders / totalProductionOrders) * 100) : 0;
    
    const totalMaintenanceJobs = maintenance.length;
    const openJobs = maintenance.filter((m: any) => m.status === 'open' || m.status === 'in_progress').length;
    const completedJobs = maintenance.filter((m: any) => m.status === 'completed').length;
    const maintenanceCompliance = totalMaintenanceJobs > 0 ? Math.round((completedJobs / totalMaintenanceJobs) * 100) : 0;
    
    const clauseScores: Record<string, number> = {
      '4': Math.round((documentCompliance * 0.3 + (totalDocuments > 0 ? 70 : 20) * 0.7)),
      '5': Math.round(((approvedDocuments > 0 ? 100 : 20) + (totalEmployees > 0 ? 60 : 20)) / 2),
      '6': Math.round((riskMitigationRate + (totalRisks > 0 ? 60 : 20) + (averageSupplierScore > 0 ? averageSupplierScore : 20)) / 3),
      '7': Math.round((trainingCompliance + medicalCompliance + documentCompliance) / 3),
      '8': Math.round((productionEfficiency + maintenanceCompliance + supplierCompliance) / 3),
      '9': Math.round((auditPassRate + complaintResolutionRate + ncrClosureRate) / 3),
      '10': Math.round((ncrClosureRate + riskMitigationRate) / 2)
    };
    
    const overallCompliance = Math.round((auditPassRate + documentCompliance + trainingCompliance + supplierCompliance + ncrClosureRate + complaintResolutionRate + pestCompliance) / 7);
    const overallRiskScore = riskExposure;
    const overallSafetyScore = Math.round((pestCompliance + maintenanceCompliance + (openNCRs === 0 ? 100 : Math.max(0, 100 - (openNCRs * 5)))) / 2);
    const qcpCompliance = 75;
    const cleaningCompliance = 85;
    
    const metrics: UnifiedMetrics = {
      totalAudits, passedAudits, failedAudits, scheduledAudits, inProgressAudits,
      auditPassRate, averageAuditScore, totalFindings,
      totalDocuments, approvedDocuments, draftDocuments, archivedDocuments, documentCompliance,
      totalEmployees, activeEmployees, trainedEmployees, inductionCompleted,
      trainingCompliance, medicalCompliance,
      totalSuppliers, approvedSuppliers, probationSuppliers, suspendedSuppliers,
      supplierCompliance, averageSupplierScore,
      totalRisks, criticalRisks, highRisks, mediumRisks, lowRisks, mitigatedRisks,
      riskExposure, riskMitigationRate,
      totalNCRs, openNCRs, closedNCRs, ncrClosureRate, criticalNCRs, averageResolutionDays: 0,
      totalComplaints, resolvedComplaints, openComplaints, complaintResolutionRate, criticalComplaints,
      totalSightings, closedSightings, openSightings, pestCompliance,
      totalProductionOrders, completedOrders, qualityHoldOrders, productionEfficiency,
      totalMaintenanceJobs, openJobs, completedJobs, maintenanceCompliance,
      clauseScores, overallCompliance, overallRiskScore, overallSafetyScore,
      qcpCompliance, cleaningCompliance
    };
    
    cachedMetrics = metrics;
    lastFetchTime = now;
    return metrics;
  } catch (error) {
    console.error('Error fetching unified metrics:', error);
    throw error;
  }
}

export function clearMetricsCache(): void {
  cachedMetrics = null;
  lastFetchTime = 0;
}

// Re-export UnifiedMetrics as a type
export type { UnifiedMetrics };
