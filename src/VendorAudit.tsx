/**
 * GLIF Vendor Audit
 * Main component for vendor compliance auditing
 * Supports GxP compliance checking for Life Sciences vendors
 */

import React, { useState } from 'react';
import { ArrowLeft, BarChart3, Factory, FileSearch, History, BookOpen, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  textColor: string;
}

const MODULE_CARDS: ModuleCard[] = [
  {
    id: 'dashboard',
    label: 'Portfolio Dashboard',
    description: 'Vendor risk overview and audit schedule',
    icon: BarChart3,
    gradient: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-600'
  },
  {
    id: 'management',
    label: 'Vendor Management',
    description: 'Manage vendor profiles and details',
    icon: Factory,
    gradient: 'from-cyan-500 to-cyan-600',
    textColor: 'text-cyan-600'
  },
  {
    id: 'single-audit',
    label: 'Single Vendor Audit',
    description: 'Run compliance check for a vendor',
    icon: FileSearch,
    gradient: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-600'
  },
  {
    id: 'audit-history',
    label: 'Audit History',
    description: 'View all completed audits and findings',
    icon: History,
    gradient: 'from-indigo-500 to-indigo-600',
    textColor: 'text-indigo-600'
  },
  {
    id: 'rules',
    label: 'GxP Rules Library',
    description: 'Browse FDA/EMA compliance rules',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-emerald-600',
    textColor: 'text-emerald-600'
  },
  {
    id: 'capa',
    label: 'CAPA Tracking',
    description: 'Track corrective and preventive actions',
    icon: CheckSquare,
    gradient: 'from-orange-500 to-orange-600',
    textColor: 'text-orange-600'
  }
];

const VendorAudit: React.FC = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<ViewType>('home');

  const renderContent = () => {
    if (activeView === 'home') {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">🏭</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              GLIF Vendor Audit
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              GxP Compliance for Life Sciences - Automate vendor audits with AI-powered document review
            </p>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {MODULE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => setActiveView(card.id)}
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-transparent hover:-translate-y-1"
                >
                  {/* Gradient Header */}
                  <div className={`h-32 bg-gradient-to-br ${card.gradient} p-6 flex items-center justify-center`}>
                    <Icon className="w-16 h-16 text-white" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700">
                      {card.label}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  {/* Hover Indicator */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <ArrowLeft className="w-4 h-4 text-gray-700 rotate-180" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Vendor Audit Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-2">49 GxP Rules</h3>
                <p className="text-sm text-gray-600">
                  Comprehensive compliance checks across 4 regulatory standards
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-2">Automated Audits</h3>
                <p className="text-sm text-gray-600">
                  Complete vendor audits in minutes, not weeks
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="font-semibold text-gray-900 mb-2">Portfolio View</h3>
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back/Home Button */}
            <button
              onClick={() => activeView === 'home' ? navigate('/') : setActiveView('home')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">
                {activeView === 'home' ? 'Back to Home' : 'Back to Modules'}
              </span>
            </button>

            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏭</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {activeView === 'home' 
                    ? 'GLIF Vendor Audit'
                    : MODULE_CARDS.find(m => m.id === activeView)?.label || 'GLIF Vendor Audit'
                  }
                </h1>
                <p className="text-sm text-gray-500">
                  GxP Compliance for Life Sciences
                </p>
              </div>
            </div>

            {/* Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                MVP v1.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-[calc(100vh-4rem)]">
        {renderContent()}
      </div>
    </div>
  );
};

export default VendorAudit;
