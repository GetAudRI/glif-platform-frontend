/**
 * GLIF Vendor Audit
 * Main component for vendor compliance auditing
 * Supports GxP compliance checking for Life Sciences vendors
 */

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Tab components (to be implemented)
import VendorManagementPage from './components/vendor/VendorManagementPage';
import SingleVendorAuditWorkflow from './components/vendor/SingleVendorAuditWorkflow';
import GxPRulesLibrary from './components/vendor/GxPRulesLibrary';
import PortfolioDashboard from './components/vendor/PortfolioDashboard';
import CAPAManagement from './components/vendor/CAPAManagement';
import AuditHistory from './components/vendor/AuditHistory';

type TabType = 'management' | 'single-audit' | 'rules' | 'dashboard' | 'capa' | 'audit-history';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'dashboard',
    label: 'Portfolio Dashboard',
    icon: '📊',
    description: 'Vendor risk overview and audit schedule'
  },
  {
    id: 'management',
    label: 'Vendor Management',
    icon: '🏭',
    description: 'Manage vendor profiles and details'
  },
  {
    id: 'single-audit',
    label: 'Single Vendor Audit',
    icon: '🔍',
    description: 'Run compliance check for a vendor'
  },
  {
    id: 'audit-history',
    label: 'Audit History',
    icon: '📜',
    description: 'View all completed audits and findings'
  },
  {
    id: 'rules',
    label: 'GxP Rules Library',
    icon: '📋',
    description: 'Browse FDA/EMA compliance rules'
  },
  {
    id: 'capa',
    label: 'CAPA Tracking',
    icon: '✅',
    description: 'Track corrective and preventive actions'
  }
];

const VendorAudit: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
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
        return <PortfolioDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </button>

            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏭</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  GLIF Vendor Audit
                </h1>
                <p className="text-sm text-gray-500">
                  GxP Compliance for Life Sciences
                </p>
              </div>
            </div>

            {/* Help Badge */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                MVP v1.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-cyan-500 text-cyan-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="ml-2 px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded-full text-xs font-medium">
                    Active
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Description */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm">
            {TABS.find(t => t.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">About Vendor Audit</h3>
                <p className="text-sm text-gray-600">
                  Automate GxP compliance auditing for pharmaceutical vendors using AI-powered
                  document review and FDA/EMA regulation checking.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Supported Standards</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 21 CFR Part 11 (FDA)</li>
                  <li>• EU GMP Annex 11 (EMA)</li>
                  <li>• ICH Q7 (API Manufacturing)</li>
                  <li>• ALCOA+ Data Integrity</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">
                    <div className="font-medium text-cyan-600 text-lg">49</div>
                    <div>GxP Rules</div>
                  </div>
                  <div className="text-gray-600">
                    <div className="font-medium text-cyan-600 text-lg">5</div>
                    <div>Vendor Types</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAudit;
