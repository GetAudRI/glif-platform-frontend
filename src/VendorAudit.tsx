/**
 * AudRI Vendor Audit
 * Main component for vendor compliance auditing
 * Supports GxP compliance checking for Life Sciences vendors
 */

import React, { useState } from 'react';
import { ArrowLeft, BarChart3, Factory, FileSearch, History, BookOpen, CheckSquare, Target, Zap } from 'lucide-react';

// Tab components
import VendorManagementPage from './components/vendor/VendorManagementPage';
import SingleVendorAuditWorkflow from './components/vendor/SingleVendorAuditWorkflow';
import GxPRulesLibrary from './components/vendor/GxPRulesLibrary';
import PortfolioDashboard from './components/vendor/PortfolioDashboard';
import CAPAManagement from './components/vendor/CAPAManagement';
import AuditHistory from './components/vendor/AuditHistory';

type ViewType = 'home' | 'management' | 'single-audit' | 'rules' | 'dashboard' | 'capa' | 'audit-history';

interface ModuleCard {
  id: ViewType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    id: 'dashboard',
    label: 'Portfolio Dashboard',
    description: 'Vendor risk overview and audit schedule',
    icon: BarChart3
  },
  {
    id: 'management',
    label: 'Vendor Management',
    description: 'Manage vendor profiles and details',
    icon: Factory
  },
  {
    id: 'single-audit',
    label: 'Single Vendor Audit',
    description: 'Run compliance check for a vendor',
    icon: FileSearch
  },
  {
    id: 'audit-history',
    label: 'Audit History',
    description: 'View all completed audits and findings',
    icon: History
  },
  {
    id: 'rules',
    label: 'GxP Rules Library',
    description: 'Browse FDA/EMA compliance rules',
    icon: BookOpen
  },
  {
    id: 'capa',
    label: 'CAPA Tracking',
    description: 'Track corrective and preventive actions',
    icon: CheckSquare
  }
];

const VendorAudit: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('home');

  const renderContent = () => {
    if (activeView === 'home') {
      return (
        <div className="py-10">
          {/* Hero Section */}
          <div className="mb-10 max-w-5xl">
            <div className="overline mb-4">Vendor Compliance · GxP</div>
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <h1 className="heading text-4xl md:text-6xl tracking-tighter text-neutral-950">
                  AudRI Vendor Audit
                </h1>
                <p className="text-base md:text-lg text-neutral-600 max-w-3xl mt-4 leading-relaxed">
                  Automate life-sciences vendor audits with inspection-grade document review, risk scoring, and CAPA tracking.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2 border border-hair bg-white px-4 py-3 rounded-sm">
                <Factory className="w-4 h-4 text-rust" strokeWidth={1.75} />
                <span className="mono text-xs text-neutral-600">49 GxP rules ready</span>
              </div>
            </div>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-hair bg-white mb-12">
            {MODULE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => setActiveView(card.id)}
                  className="group relative p-6 text-left border-r border-b border-hair hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div className="w-11 h-11 border border-hair rounded-sm flex items-center justify-center bg-white text-neutral-900">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <ArrowLeft className="w-4 h-4 text-neutral-400 rotate-180 transition-transform group-hover:translate-x-1" strokeWidth={1.75} />
                  </div>

                  {/* Content */}
                  <div>
                    <div className="overline mb-3">{card.id.replace(/-/g, ' ')}</div>
                    <h3 className="heading text-2xl text-neutral-950 mb-3">
                      {card.label}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="card p-8">
            <div className="overline mb-3">Capability Map</div>
            <h2 className="heading text-2xl text-gray-900 mb-6">
              Vendor Audit Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-hair">
              <div className="p-6 border-r border-b border-hair">
                <Target className="w-6 h-6 text-rust mb-4" strokeWidth={1.75} />
                <h3 className="heading text-lg text-gray-900 mb-2">49 GxP Rules</h3>
                <p className="text-sm text-gray-600">
                  Comprehensive compliance checks across 4 regulatory standards
                </p>
              </div>
              <div className="p-6 border-r border-b border-hair">
                <Zap className="w-6 h-6 text-rust mb-4" strokeWidth={1.75} />
                <h3 className="heading text-lg text-gray-900 mb-2">Automated Audits</h3>
                <p className="text-sm text-gray-600">
                  Complete vendor audits in minutes, not weeks
                </p>
              </div>
              <div className="p-6 border-r border-b border-hair">
                <BarChart3 className="w-6 h-6 text-rust mb-4" strokeWidth={1.75} />
                <h3 className="heading text-lg text-gray-900 mb-2">Portfolio View</h3>
                <p className="text-sm text-gray-600">
                  Manage risk across your entire vendor portfolio
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Render the selected module
    switch (activeView) {
      case 'dashboard':
        return <PortfolioDashboard />;
      case 'management':
        return <VendorManagementPage />;
      case 'single-audit':
        return <SingleVendorAuditWorkflow />;
      case 'audit-history':
        return <AuditHistory />;
      case 'rules':
        return <GxPRulesLibrary />;
      case 'capa':
        return <CAPAManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-page">
      {/* Page Header */}
      <div className="bg-white border-b border-hair px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back Button for sub-views */}
            {activeView !== 'home' && (
              <button
                onClick={() => setActiveView('home')}
                className="btn-secondary px-3"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
              </button>
            )}
            <div>
              <div className="overline mb-2">AudRI Compliance</div>
              <h1 className="heading text-3xl text-neutral-950">
                {activeView === 'home' 
                  ? 'Vendor Audit'
                  : MODULE_CARDS.find(m => m.id === activeView)?.label || 'Vendor Audit'
                }
              </h1>
              <p className="text-sm text-neutral-600 mt-2">
                GxP Compliance for Life Sciences
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-badge status-pass">
              MVP v1.0
            </span>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default VendorAudit;
