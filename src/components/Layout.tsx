import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserMenu } from "./UserMenu";
import {
  LayoutDashboard,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Users,
  Settings,
  Building2,
  ChevronDown,
  Menu,
  X,
  Target,
  FileCheck,
  TrendingUp,
  BookOpen,
  Calendar,
  Database,
  Package,
  Bug,
  Search,
  Truck,
  Zap,
  HardDrive,
  Upload,
  BarChart,
  FileBarChart,
  ClipboardList,
  Map,
  Layers,
  GitBranch,
  ClipboardCheck,
  Inbox,
  Archive,
  Wrench,
  Monitor,
  FolderOpen,
  Grid3X3,
  ShieldAlert,
  Skull,
  Plug,
  Network,
  UserCheck,
  Scale,
  Workflow,
} from 'lucide-react';

function CustomDropdown({ trigger, children, width = 'w-56' }: { trigger: React.ReactNode; children: React.ReactNode; width?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div className={`absolute left-0 mt-2 ${width} rounded-lg shadow-lg z-50 seacom-dropdown`}>
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({ icon, label, path, onClick }: { icon: React.ReactNode; label: string; path: string; onClick?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Link
      to={path}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
        isActive ? 'bg-seacom-active text-seacom-link seacom-nav-link-active' : 'text-gray-700 hover:bg-gray-50 seacom-nav-link'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function Layout() {
  const { isAdmin, organization } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. REPORTING
  const reportingNav = [
    { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'CSI Programme', path: '/programme-dashboard', icon: Target },
    { name: 'Compliance Scorecard', path: '/scorecard', icon: CheckCircle },
    { name: 'Regulatory Dashboard', path: '/regulatory-dashboard', icon: Scale },
    { name: 'Risk Heatmap', path: '/risk-heatmap', icon: Grid3X3 },
    { name: 'Priority Actions', path: '/priority-actions', icon: Zap },
    { name: 'Report Portal', path: '/reports', icon: FileBarChart },
  ];

  // 2. STRATEGY & ARCHITECTURE
  const strategyNav = [
    { name: 'Information Security Strategy', path: '/strategy', icon: Map },
    { name: 'Security Architecture', path: '/security-architecture', icon: Layers },
    { name: 'ISMS Authority Chain', path: '/isms-authority', icon: GitBranch },
    { name: 'Statement of Applicability', path: '/soa', icon: FileCheck },
    { name: 'Security Objectives', path: '/security-objectives', icon: Target },
  ];

  // 3. INVENTORY
  const inventoryNav = [
    { name: 'UCI Controls', path: '/uci-controls', icon: BarChart },
    { name: 'Control Library', path: '/controls', icon: Shield },
    { name: 'Asset Inventory', path: '/assets', icon: HardDrive },
    { name: 'Application Register', path: '/applications', icon: Monitor },
    { name: 'Data Asset Register', path: '/data-assets', icon: Database },
    { name: 'Business Process Register', path: '/business-processes', icon: Network },
    { name: 'Exception Register', path: '/exceptions', icon: ShieldAlert },
    { name: 'Policy Library', path: '/documents', icon: FileText },
    { name: 'Vendor Register', path: '/vendors', icon: Truck },
    { name: 'Compliance Obligations', path: '/legal', icon: BookOpen },
    { name: 'Security Training', path: '/hr', icon: Users },
  ];

  // 4. ASSESSMENT
  const assessmentNav = [
    { name: 'Audit Portfolio', path: '/audits/portfolio', icon: ClipboardList },
    { name: 'Control Testing', path: '/control-testing', icon: ClipboardCheck },
    { name: 'Pen Tests', path: '/pen-tests', icon: Search },
    { name: 'Vulnerability Scans', path: '/vulnerabilities', icon: Bug },
    { name: 'Risk Assessments', path: '/risk-assessment', icon: AlertTriangle },
    { name: 'TPRM Questionnaires', path: '/tprm', icon: ClipboardCheck },
    { name: 'Audit Calendar', path: '/audits/calendar', icon: Calendar },
  ];

  // 5. FINDINGS & RISKS
  const findingsNav = [
    { name: 'Findings Register', path: '/audits/findings', icon: AlertTriangle },
    { name: 'Cyber Risk Register', path: '/risk-assessment', icon: TrendingUp },
    { name: 'Threat Register', path: '/threat-register', icon: Skull },
    { name: 'Risk Mapping', path: '/risk-mapping', icon: GitBranch },
    { name: 'Vulnerability Tracker', path: '/vulnerability-tracker', icon: Bug },
    { name: 'Incident Register', path: '/incidents', icon: Zap },
  ];

  // 6. REMEDIATION
  const remediationNav = [
    { name: 'Remediation Programmes', path: '/remediation-programmes', icon: Wrench },
    { name: 'CSI Items', path: '/csi-items', icon: Target },
    { name: 'Work Packages', path: '/work-packages', icon: Package },
    { name: 'Action Tracker', path: '/audits/actions', icon: CheckCircle },
  ];

  // 7. ASSURANCE & RESPONSE
  const assuranceNav = [
    { name: 'Evidence Repository', path: '/evidence', icon: FolderOpen },
    { name: 'Evidence Requests', path: '/evidence-requests', icon: ClipboardList },
    { name: 'Management Attestations', path: '/attestations', icon: UserCheck },
    { name: 'SARE Inbox', path: '/sare/inbox', icon: Inbox },
    { name: 'SARE Templates', path: '/sare/templates', icon: FileText },
    { name: 'SARE Archive', path: '/sare/archive', icon: Archive },
    { name: 'Policy Approval Workflow', path: '/policy-approval', icon: FileCheck },
  ];

  // 8. ADMIN
  const adminNav = [
    { name: 'User Management', path: '/admin/roles', icon: Users },
    { name: 'Workflow Engine', path: '/workflows', icon: Workflow },
    { name: 'Integration Manager', path: '/integrations', icon: Plug },
    { name: 'Bulk Import', path: '/bulk-import', icon: Upload },
    { name: 'System Settings', path: '/settings', icon: Settings },
    { name: 'Reference Data', path: '/admin/reference-data', icon: Database },
  ];

  const navButtonClass = "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors";

  const ReportingDropdown = () => (
    <CustomDropdown trigger={
      <button className={navButtonClass}>
        <FileBarChart className="h-4 w-4" />
        <span>Reporting</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {reportingNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const StrategyDropdown = () => (
    <CustomDropdown width="w-64" trigger={
      <button className={navButtonClass}>
        <Map className="h-4 w-4" />
        <span>Strategy & Architecture</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {strategyNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const InventoryDropdown = () => (
    <CustomDropdown trigger={
      <button className={navButtonClass}>
        <Database className="h-4 w-4" />
        <span>Inventory</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {inventoryNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const AssessmentDropdown = () => (
    <CustomDropdown trigger={
      <button className={navButtonClass}>
        <ClipboardList className="h-4 w-4" />
        <span>Assessment</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {assessmentNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const FindingsDropdown = () => (
    <CustomDropdown trigger={
      <button className={navButtonClass}>
        <AlertTriangle className="h-4 w-4" />
        <span>Findings & Risks</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {findingsNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const RemediationDropdown = () => (
    <CustomDropdown trigger={
      <button className={navButtonClass}>
        <Wrench className="h-4 w-4" />
        <span>Remediation</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {remediationNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const AssuranceDropdown = () => (
    <CustomDropdown width="w-64" trigger={
      <button className={navButtonClass}>
        <Shield className="h-4 w-4" />
        <span>Assurance & Response</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {assuranceNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const AdminDropdown = () => (
    <CustomDropdown trigger={
      <button className={navButtonClass}>
        <Settings className="h-4 w-4" />
        <span>Admin</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {adminNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const orgDisplayName = organization?.name || 'Seacom';

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white seacom-header border-b border-gray-200 fixed top-0 w-full z-50 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden mr-4 text-gray-500 hover:text-gray-700"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <Link to="/dashboard" className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="font-bold text-xl text-gray-900 seacom-logo">CyberSecureIMS</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              <ReportingDropdown />
              <StrategyDropdown />
              <InventoryDropdown />
              <AssessmentDropdown />
              <FindingsDropdown />
              <RemediationDropdown />
              <AssuranceDropdown />
              {isAdmin && <AdminDropdown />}

              {/* Organization Badge */}
              <div className="ml-4 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                <span>{orgDisplayName}</span>
              </div>
            </div>

            {/* User Menu */}
            <UserMenu />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-2 pt-2 pb-3 space-y-1">

              <div className="font-semibold text-xs text-gray-400 px-3 pt-2 pb-1">REPORTING</div>
              {reportingNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">STRATEGY & ARCHITECTURE</div>
              {strategyNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">INVENTORY</div>
              {inventoryNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">ASSESSMENT</div>
              {assessmentNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">FINDINGS & RISKS</div>
              {findingsNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">REMEDIATION</div>
              {remediationNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">ASSURANCE & RESPONSE</div>
              {assuranceNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {isAdmin && (
                <>
                  <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">ADMIN</div>
                  {adminNav.map((item) => (
                    <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </>
              )}

            </div>
          </div>
        )}
      </nav>

      {/* IMPORTANT: This Outlet renders the child routes (Dashboard, etc.) */}
      <main className="pt-16">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
