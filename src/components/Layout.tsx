import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileSearch, BarChart3, DollarSign, BookOpen, Database,
  Settings, LogOut, Shield,
  ClipboardCheck, TrendingUp, GitBranch, CheckCircle2,
  FileCheck, Receipt, FileSignature, Building2, ShieldCheck
} from 'lucide-react';
import { getUsername, isViewer, clearAuth } from '../utils/auth';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  route: string;
  section: 'modules' | 'audit-tools' | 'trend-analytics' | 'testing-cost' | 'configuration';
}

const navItems: NavItem[] = [
  // Main Modules
  { id: 'audit-oversight', label: 'Audit Oversight', icon: ClipboardCheck, route: '/audit-oversight?tab=single-audit', section: 'modules' },
  { id: 'invoice-approval', label: 'Invoice Approval', icon: Receipt, route: '/invoice-approval', section: 'modules' },
  { id: 'contract-review', label: 'Contract Review', icon: FileSignature, route: '/contract-review', section: 'modules' },
  { id: 'vendor-audit', label: 'Vendor Audit', icon: Building2, route: '/vendor-audit', section: 'modules' },
  
  // Audit Tools (from Audit Oversight tabs)
  { id: 'audit-oversight?tab=single-audit', label: 'Single File Audit', icon: FileCheck, route: '/audit-oversight?tab=single-audit', section: 'audit-tools' },
  { id: 'audit-oversight?tab=single-audit-results', label: 'Audit Results', icon: BarChart3, route: '/audit-oversight?tab=single-audit-results', section: 'audit-tools' },
  { id: 'audit-oversight?tab=batch-audits', label: 'Batch Audits', icon: Shield, route: '/audit-oversight?tab=batch-audits', section: 'audit-tools' },
  { id: 'audit-oversight?tab=graph', label: 'Link Graph', icon: GitBranch, route: '/audit-oversight?tab=graph', section: 'audit-tools' },
  { id: 'audit-oversight?tab=claims', label: 'Claim Drilldown', icon: FileSearch, route: '/audit-oversight?tab=claims', section: 'audit-tools' },
  { id: 'audit-oversight?tab=audit-process', label: 'Audit Process', icon: Shield, route: '/audit-oversight?tab=audit-process', section: 'audit-tools' },
  
  // Trend Analytics Engine
  { id: 'audit-oversight?tab=portfolio', label: 'Portfolio', icon: DollarSign, route: '/audit-oversight?tab=portfolio', section: 'trend-analytics' },
  { id: 'audit-oversight?tab=market-conduct', label: 'Market Conduct', icon: ShieldCheck, route: '/audit-oversight?tab=market-conduct', section: 'trend-analytics' },
  
  // Testing and Cost
  { id: 'audit-oversight?tab=testd', label: 'TestD', icon: CheckCircle2, route: '/audit-oversight?tab=testd', section: 'testing-cost' },
  { id: 'audit-oversight?tab=golden-eval', label: 'Golden Eval', icon: BarChart3, route: '/audit-oversight?tab=golden-eval', section: 'testing-cost' },
  { id: 'audit-oversight?tab=cost-analytics', label: 'Cost Analytics', icon: TrendingUp, route: '/audit-oversight?tab=cost-analytics', section: 'testing-cost' },
  
  // Configuration
  { id: 'audit-oversight?tab=connect', label: 'Connectors', icon: Database, route: '/audit-oversight?tab=connect', section: 'configuration' },
  { id: 'audit-oversight?tab=corpus', label: 'Corpus', icon: BookOpen, route: '/audit-oversight?tab=corpus', section: 'configuration' },
  { id: 'audit-oversight?tab=rules', label: 'Rules Engine', icon: Settings, route: '/audit-oversight?tab=rules', section: 'configuration' },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const username = getUsername() || 'User';
  const roleLabel = isViewer() ? 'View only' : 'Presenter';
  const initials = username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (route: string) => {
    const currentRoute = `${location.pathname}${location.search}`;
    return route.includes('?') ? currentRoute === route : location.pathname === route;
  };

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const groupedItems = {
    modules: navItems.filter(item => item.section === 'modules'),
    auditTools: navItems.filter(item => item.section === 'audit-tools'),
    trendAnalytics: navItems.filter(item => item.section === 'trend-analytics'),
    testingCost: navItems.filter(item => {
      if (item.section !== 'testing-cost') return false;
      if (isViewer() && (item.id.includes('testd') || item.id.includes('golden-eval'))) return false;
      return true;
    }),
    configuration: navItems.filter(item => {
      if (item.section !== 'configuration') return false;
      if (isViewer() && item.id.includes('connect')) return false;
      return true;
    }),
  };

  const renderNavGroup = (label: string, items: NavItem[]) => {
    if (items.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="px-3 mb-2">
          <span className="overline text-[10px]">{label}</span>
        </div>
        {items.map(item => {
          const active = isActive(item.route);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm mb-1 border-l-2 transition-colors ${
                active
                  ? 'border-rust bg-neutral-50 text-neutral-950'
                  : 'border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950'
              }`}
            >
              <item.icon className="w-[15px] h-[15px]" strokeWidth={1.75} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-page overflow-hidden">
      {/* Static Sidebar - Fixed position, always visible */}
      <aside className="w-64 bg-white border-r border-hair flex flex-col flex-shrink-0">
        {/* Logo - Fixed at top */}
        <div className="px-6 py-5 border-b border-hair flex-shrink-0">
          <button 
            onClick={() => navigate('/')}
            className="text-left w-full hover:opacity-80 transition-opacity"
          >
            <div className="overline mb-2">Audri - Claims</div>
            <h1 className="heading text-xl text-neutral-950">AudRI</h1>
            <p className="mono text-xs text-neutral-500 mt-1">The Audit Platform</p>
          </button>
        </div>

        {/* Navigation - Scrollable if needed */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {renderNavGroup('Modules', groupedItems.modules)}
          {renderNavGroup('Audit Tools', groupedItems.auditTools)}
          {renderNavGroup('Trend Analytics', groupedItems.trendAnalytics)}
          {renderNavGroup('Testing Cost', groupedItems.testingCost)}
          {renderNavGroup('Configuration', groupedItems.configuration)}
        </nav>

        {/* User Profile - Fixed at bottom */}
        <div className="px-3 py-4 border-t border-hair flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-neutral-50 cursor-pointer group transition-colors">
            <div className="w-9 h-9 bg-rust-tint border border-rust-tint-bd rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="mono text-sm font-medium text-rust-deep">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-900 truncate">{username}</div>
              <div className="mono text-xs text-neutral-500 truncate">{roleLabel}</div>
            </div>
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-neutral-400" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {isViewer() && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-6 py-2">
            Demo account — view only. You can open existing audit results. Uploads and live validation are disabled.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
