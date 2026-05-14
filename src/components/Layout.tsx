import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
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
  LogOut,
  User,
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
  Cloud,
  Upload,
  BarChart,
  FileBarChart,
  ClipboardList,
} from 'lucide-react';

// Custom Dropdown component
function CustomDropdown({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
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
        <div className="absolute left-0 mt-2 w-56 rounded-lg shadow-lg z-50 seacom-dropdown">
          {children}
        </div>
      )}
    </div>
  );
}

// Dropdown menu item component
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
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, role, isAdmin, organization, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRoleBadgeColor = () => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[role || 'viewer'] || 'bg-gray-100';
  };

  // Navigation structure
  const executiveNav = [
    { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'CSI Programme', path: '/programme-dashboard', icon: Target },
    { name: 'Compliance Scorecard', path: '/scorecard', icon: CheckCircle },
    { name: 'Report Portal', path: '/reports', icon: FileBarChart },
  ];

  const grcNav = [
    { name: 'Statement of Applicability', path: '/soa', icon: FileCheck },
    { name: 'Policy & Evidence', path: '/documents', icon: FileText },
    { name: 'Regulatory Register', path: '/legal', icon: BookOpen },
    { name: 'Security Training', path: '/hr', icon: Users },
  ];

  const auditNav = [
    { name: 'Audit Portfolio', path: '/audits/portfolio', icon: ClipboardList },
    { name: 'Findings Register', path: '/audits/findings', icon: AlertTriangle },
    { name: 'Evidence Library', path: '/audits/evidence', icon: Database },
    { name: 'Action Tracker', path: '/audits/actions', icon: CheckCircle },
    { name: 'Audit Calendar', path: '/audits/calendar', icon: Calendar },
    { name: 'Metrics & Trends', path: '/audits/metrics', icon: TrendingUp },
  ];

  const controlNav = [
    { name: 'Control Library', path: '/controls', icon: Shield },
    { name: 'UCI Dashboard', path: '/uci-controls', icon: BarChart },
    { name: 'UCI Full Register', path: '/uci-controls-full', icon: Database },
    { name: 'CSI Items', path: '/csi-items', icon: Target },
    { name: 'Work Packages', path: '/work-packages', icon: Package },
  ];

  const riskNav = [
    { name: 'Cyber Risk Register', path: '/risk-assessment', icon: AlertTriangle },
    { name: 'Vulnerability Tracker', path: '/vulnerabilities', icon: Bug },
    { name: 'Pen Test Tracker', path: '/pen-tests', icon: Search },
    { name: 'Vendor Risk', path: '/vendors', icon: Truck },
  ];

  const securityOpsNav = [
    { name: 'Incident Management', path: '/incidents', icon: Zap },
    { name: 'Asset Inventory', path: '/assets', icon: HardDrive },
    { name: 'BC/DR Plans', path: '/bc-dr', icon: Cloud },
  ];

  const adminNav = [
    { name: 'User Management', path: '/admin/roles', icon: Users },
    { name: 'Bulk Import', path: '/bulk-import', icon: Upload },
    { name: 'System Settings', path: '/settings', icon: Settings },
  ];

  // Desktop Navigation Dropdowns
  const ExecutiveDropdown = () => (
    <CustomDropdown trigger={
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <LayoutDashboard className="h-4 w-4" />
        <span>Executive & Strategy</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {executiveNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const GRCDropdown = () => (
    <CustomDropdown trigger={
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <Shield className="h-4 w-4" />
        <span>GRC</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {grcNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const AuditDropdown = () => (
    <CustomDropdown trigger={
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <FileText className="h-4 w-4" />
        <span>Audit Manager</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {auditNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const ControlDropdown = () => (
    <CustomDropdown trigger={
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <Shield className="h-4 w-4" />
        <span>Control Assurance</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {controlNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const RiskDropdown = () => (
    <CustomDropdown trigger={
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <AlertTriangle className="h-4 w-4" />
        <span>Risk Management</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {riskNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const SecurityOpsDropdown = () => (
    <CustomDropdown trigger={
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <Shield className="h-4 w-4" />
        <span>Security Operations</span>
        <ChevronDown className="h-3 w-3" />
      </button>
    }>
      <div className="py-2">
        {securityOpsNav.map((item) => (
          <DropdownItem key={item.path} icon={<item.icon className="h-4 w-4" />} label={item.name} path={item.path} />
        ))}
      </div>
    </CustomDropdown>
  );

  const AdminDropdown = () => (
    <CustomDropdown trigger={
      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
        <Settings className="h-4 w-4" />
        <span>Platform Admin</span>
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
              <ExecutiveDropdown />
              <GRCDropdown />
              <AuditDropdown />
              <ControlDropdown />
              <RiskDropdown />
              <SecurityOpsDropdown />
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
              <div className="font-semibold text-xs text-gray-400 px-3 pt-2 pb-1">EXECUTIVE & STRATEGY</div>
              {executiveNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">GRC</div>
              {grcNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">AUDIT MANAGER</div>
              {auditNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">CONTROL ASSURANCE</div>
              {controlNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">RISK MANAGEMENT</div>
              {riskNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">SECURITY OPERATIONS</div>
              {securityOpsNav.map((item) => (
                <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}

              {isAdmin && (
                <>
                  <div className="font-semibold text-xs text-gray-400 px-3 pt-4 pb-1">PLATFORM ADMIN</div>
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
