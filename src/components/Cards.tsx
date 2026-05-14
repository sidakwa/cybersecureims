import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { KPIMetric, ModuleStatus, TaskStatus, TaskPriority, RiskLevel } from "@/lib/index";
import { STATUS_COLORS, TASK_STATUS_COLORS, PRIORITY_COLORS, RISK_COLORS } from "@/lib/index";

// ─── KPI Card ────────────────────────────────────────────────────────────────
export function KPICard({ metric, index }: { metric: KPIMetric; index: number }) {
  const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;
  const trendColor = metric.positive
    ? (metric.trend === "up" ? "text-emerald-600" : metric.trend === "down" ? "text-emerald-600" : "text-muted-foreground")
    : (metric.trend === "up" ? "text-red-500" : metric.trend === "down" ? "text-red-500" : "text-muted-foreground");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35, ease: "easeOut" }}
      className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="text-sm font-medium text-muted-foreground mb-2">{metric.label}</div>
      <div className="text-3xl font-bold text-foreground mb-3">{metric.value}</div>
      <div className={`flex items-center gap-1.5 text-sm font-medium ${trendColor}`}>
        <TrendIcon className="h-4 w-4" />
        <span>{metric.change > 0 ? "+" : ""}{metric.change}{typeof metric.change === "number" && !String(metric.change).includes("%") && Math.abs(metric.change) < 20 ? "" : "pp"}</span>
        <span className="text-muted-foreground font-normal">{metric.changeLabel}</span>
      </div>
    </motion.div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: ModuleStatus }) {
  const labels: Record<ModuleStatus, string> = {
    compliant: "Compliant", warning: "Warning", overdue: "Overdue", pending: "Pending"
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full inline-block ${
        status === "compliant" ? "bg-emerald-500" :
        status === "warning" ? "bg-amber-500" :
        status === "overdue" ? "bg-red-500" : "bg-blue-500"
      }`} />
      {labels[status]}
    </span>
  );
}

// ─── Task Status Badge ───────────────────────────────────────────────────────
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const labels: Record<TaskStatus, string> = {
    pending: "Pending", in_progress: "In Progress", completed: "Completed",
    escalated: "Escalated", overdue: "Overdue"
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${TASK_STATUS_COLORS[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── Priority Badge ──────────────────────────────────────────────────────────
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const labels: Record<TaskPriority, string> = {
    critical: "Critical", high: "High", medium: "Medium", low: "Low"
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${PRIORITY_COLORS[priority]}`}>
      {labels[priority]}
    </span>
  );
}

// ─── Risk Level Indicator ────────────────────────────────────────────────────
export function RiskLevelDot({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${RISK_COLORS[level]}`} />
  );
}

// ─── Module Card ─────────────────────────────────────────────────────────────
import type { Module } from "@/lib/index";
import {
  MessageSquareWarning, ClipboardCheck, AlertTriangle, Users, FileText,
  FlaskConical, Truck, BadgeCheck, Bug, ShieldCheck, BookOpen, Factory,
  BarChart3, Gauge, PackageCheck, HeartPulse, Wrench, Sparkles, Layers
} from "lucide-react";
import { Link } from "react-router-dom";

const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquareWarning, ClipboardCheck, AlertTriangle, Users, FileText,
  FlaskConical, Truck, BadgeCheck, Bug, ShieldCheck, BookOpen, Factory,
  BarChart3, Gauge, PackageCheck, HeartPulse, Wrench, Sparkles, Layers
};

export function ModuleCard({ module, index }: { module: Module; index: number }) {
  const Icon = MODULE_ICONS[module.icon] || Layers;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Link
        to={module.path}
        className="block bg-card border border-border rounded-xl p-5 hover:shadow-lg transition-all duration-200 group"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <StatusBadge status={module.status} />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1 leading-tight">{module.name}</h3>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{module.description}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Compliance</span>
            <span className="font-semibold text-foreground">{module.completionRate}%</span>
          </div>
          <Progress value={module.completionRate} className="h-1.5" />
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{module.tasksCount} tasks</span>
          {module.openIssues > 0 && (
            <span className="text-xs text-destructive font-medium">{module.openIssues} issue{module.openIssues > 1 ? "s" : ""}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
