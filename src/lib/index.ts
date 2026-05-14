// ─── Route Paths ───────────────────────────────────────────────────────────
export const ROUTE_PATHS = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  MODULES: "/modules",
  // General
  CUSTOMER_COMPLAINTS: "/modules/customer-complaints",
  AUDIT_MASTER: "/modules/audit-master",
  RISK_ASSESSMENT: "/modules/risk-assessment",
  HUMAN_RESOURCES: "/modules/human-resources",
  DOCUMENT_MANAGEMENT: "/modules/document-management",
  // Technical
  TECHNICAL: "/modules/technical",
  SUPPLIER_QA: "/modules/supplier-qa",
  QUALITY: "/modules/quality",
  PEST_CONTROL: "/modules/pest-control",
  FOOD_SAFETY: "/modules/food-safety",
  // Operations
  LEGAL_REGISTERS: "/modules/legal-registers",
  PRODUCTION: "/modules/production",
  REPORT_PORTAL: "/modules/report-portal",
  OEE: "/modules/oee",
  LOGISTICS: "/modules/logistics",
  HEALTH_SAFETY: "/modules/health-safety",
  MAINTENANCE: "/modules/maintenance",
  CLEANING: "/modules/cleaning",
  // Auth
  LOGIN: "/login",
};

// ─── Types ──────────────────────────────────────────────────────────────────
export type ModuleStatus = "compliant" | "warning" | "overdue" | "pending";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed" | "escalated" | "overdue";
export type AuditStatus = "passed" | "failed" | "in_progress" | "scheduled";
export type RiskLevel = "critical" | "high" | "medium" | "low";

export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "general" | "technical" | "operations";
  status: ModuleStatus;
  completionRate: number;
  path: string;
  tasksCount: number;
  openIssues: number;
}

export interface WorkTask {
  id: string;
  title: string;
  module: string;
  moduleId: string;
  assignee: string;
  deadline: string;
  status: TaskStatus;
  priority: TaskPriority;
  escalatedFrom?: string;
  escalatedTo?: string;
  daysUntilDue: number;
}

export interface KPIMetric {
  label: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "neutral";
  positive: boolean;
}

export interface AuditItem {
  id: string;
  name: string;
  auditor: string;
  date: string;
  status: AuditStatus;
  score: number;
  findings: number;
  standard: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  status: ModuleStatus;
  complianceScore: number;
  certExpiry: string;
  lastAudit: string;
  country: string;
}

export interface Complaint {
  id: string;
  ref: string;
  customer: string;
  product: string;
  category: string;
  date: string;
  status: "open" | "investigating" | "resolved" | "closed";
  priority: TaskPriority;
  assignee: string;
}

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  category?: string;
  badge?: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────
export const STATUS_COLORS: Record<ModuleStatus, string> = {
  compliant: "text-emerald-600 bg-emerald-50 border-emerald-200",
  warning: "text-amber-600 bg-amber-50 border-amber-200",
  overdue: "text-red-600 bg-red-50 border-red-200",
  pending: "text-blue-600 bg-blue-50 border-blue-200",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "text-blue-600 bg-blue-50 border-blue-200",
  in_progress: "text-amber-600 bg-amber-50 border-amber-200",
  completed: "text-emerald-600 bg-emerald-50 border-emerald-200",
  escalated: "text-purple-600 bg-purple-50 border-purple-200",
  overdue: "text-red-600 bg-red-50 border-red-200",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: "text-red-700 bg-red-100",
  high: "text-orange-700 bg-orange-100",
  medium: "text-amber-700 bg-amber-100",
  low: "text-green-700 bg-green-100",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-green-500",
};
