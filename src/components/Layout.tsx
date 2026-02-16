import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileSearch, BarChart3, DollarSign, BookOpen, Database,
  Settings, LogOut, FileText, Shield,
  ClipboardCheck, TrendingUp, GitBranch, CheckCircle2,
  FileCheck, Receipt, FileSignature, Building2
} from 'lucide-react';
import { isAuthenticated, getUsername, clearAuth } from '../utils/auth';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  route: string;
  section: 'modules' | 'audit-tools' | 'analytics' | 'configuration';
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
  
  // Analytics & Testing
  { id: 'audit-oversight?tab=testd', label: 'TestD', icon: CheckCircle2, route: '/audit-oversight?tab=testd', section: 'analytics' },
  { id: 'audit-oversight?tab=cost-analytics', label: 'Cost Analytics', icon: TrendingUp, route: '/audit-oversight?tab=cost-analytics', section: 'analytics' },
  { id: 'audit-oversight?tab=portfolio', label: 'Portfolio', icon: DollarSign, route: '/audit-oversight?tab=portfolio', section: 'analytics' },
  
  // Configuration
  { id: 'audit-oversight?tab=connect', label: 'Connectors', icon: Database, route: '/audit-oversight?tab=connect', section: 'configuration' },
  { id: 'audit-oversight?tab=corpus', label: 'Corpus', icon: BookOpen, route: '/audit-oversight?tab=corpus', section: 'configuration' },
  { id: 'audit-oversight?tab=rules', label: 'Rules Engine', icon: Settings, route: '/audit-oversight?tab=rules', section: 'configuration' },
];

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const username = getUsername() || 'User';
  const initials = username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const isActive = (route: string) => location.pathname === route;

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  const groupedItems = {
    modules: navItems.filter(item => item.section === 'modules'),
    auditTools: navItems.filter(item => item.section === 'audit-tools'),
    analytics: navItems.filter(item => item.section === 'analytics'),
    configuration: navItems.filter(item => item.section === 'configuration'),
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Static Sidebar - Fixed position, always visible */}
      <aside className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Logo - Fixed at top */}
        <div className="px-6 py-5 border-b border-slate-200 flex-shrink-0">
          <button 
            onClick={() => navigate('/')}
            className="text-left w-full hover:opacity-80 transition-opacity"
          >
            <h1 className="text-xl font-semibold text-neutral-900">AudRI Platform</h1>
            <p className="text-xs text-neutral-500 mt-1">Enterprise Oversight</p>
          </button>
        </div>

        {/* Navigation - Scrollable if needed */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {/* Modules Section */}
          <div className="mb-6">
            <div className="px-3 mb-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Modules</span>
            </div>
            {groupedItems.modules.map(item => (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg mb-1 transition-colors ${
                  isActive(item.route)
                    ? 'text-white bg-primary-600 shadow-sm'
                    : 'text-slate-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Audit Tools Section */}
          {groupedItems.auditTools.length > 0 && (
            <div className="mb-6">
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Audit Tools</span>
              </div>
              {groupedItems.auditTools.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg mb-1 transition-colors ${
                    location.pathname + location.search === item.route
                      ? 'text-white bg-primary-600'
                      : 'text-slate-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Analytics & Testing Section */}
          {groupedItems.analytics.length > 0 && (
            <div className="mb-6">
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Analytics & Testing</span>
              </div>
              {groupedItems.analytics.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg mb-1 transition-colors ${
                    location.pathname + location.search === item.route
                      ? 'text-white bg-primary-600'
                      : 'text-slate-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Configuration Section */}
          {groupedItems.configuration.length > 0 && (
            <div>
              <div className="px-3 mb-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Configuration</span>
              </div>
              {groupedItems.configuration.map(item => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg mb-1 transition-colors ${
                    location.pathname + location.search === item.route
                      ? 'text-white bg-primary-600'
                      : 'text-slate-700 hover:bg-white hover:shadow-sm'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* User Profile - Fixed at bottom */}
        <div className="px-3 py-4 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer group transition-all">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary-600">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-900 truncate">{username}</div>
              <div className="text-xs text-neutral-500 truncate">Auditor</div>
            </div>
            <button
              onClick={handleLogout}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
