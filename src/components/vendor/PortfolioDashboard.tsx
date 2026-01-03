/**
 * Portfolio Dashboard
 * Overview of all vendors and audit metrics
 */

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  AlertCircle,
  Factory,
  Shield,
  FileText,
  Clock
} from 'lucide-react';

// Mock data for demo
const MOCK_METRICS = {
  totalVendors: 12,
  avgComplianceScore: 87,
  auditsThisMonth: 8,
  overdueAudits: 2
};

const MOCK_RISK_DISTRIBUTION = [
  { risk: 'Critical', count: 3, color: 'bg-red-500' },
  { risk: 'High', count: 4, color: 'bg-orange-500' },
  { risk: 'Moderate', count: 3, color: 'bg-yellow-500' },
  { risk: 'Low', count: 2, color: 'bg-green-500' }
];

const MOCK_VENDORS = [
  { id: 1, name: 'CloudLIMS Inc.', risk: 'High', score: 85, findings: 5, riskColor: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 2, name: 'Bio-Analytics Lab', risk: 'Critical', score: 68, findings: 12, riskColor: 'bg-red-100 text-red-800 border-red-200' },
  { id: 3, name: 'DataFlow Solutions', risk: 'Critical', score: 72, findings: 10, riskColor: 'bg-red-100 text-red-800 border-red-200' },
  { id: 4, name: 'API Supplier Co.', risk: 'Moderate', score: 88, findings: 3, riskColor: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 5, name: 'MedEquip Systems', risk: 'Low', score: 95, findings: 1, riskColor: 'bg-green-100 text-green-800 border-green-200' },
  { id: 6, name: 'QualityTest Labs', risk: 'High', score: 79, findings: 7, riskColor: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 7, name: 'PharmaSupply Inc.', risk: 'Moderate', score: 90, findings: 2, riskColor: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
];

const MOCK_UPCOMING_AUDITS = [
  { id: 1, vendor: 'Bio-Analytics Lab', dueDate: '2026-01-15', daysUntil: 12, risk: 'Critical', riskColor: 'bg-red-100 text-red-800 border-red-200' },
  { id: 2, vendor: 'CloudLIMS Inc.', dueDate: '2026-02-01', daysUntil: 29, risk: 'High', riskColor: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 3, vendor: 'API Supplier Co.', dueDate: '2026-02-20', daysUntil: 48, risk: 'Moderate', riskColor: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 4, vendor: 'PharmaSupply Inc.', dueDate: '2026-04-01', daysUntil: 88, risk: 'Moderate', riskColor: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
];

const PortfolioDashboard: React.FC = () => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const maxCount = Math.max(...MOCK_RISK_DISTRIBUTION.map(r => r.count));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Portfolio Dashboard</h2>
        <p className="text-gray-600">Overview of vendor risk, compliance, and audit schedule</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Demo Mode</h4>
            <p className="text-sm text-blue-800 mt-1">
              This dashboard shows mock data for demonstration purposes. In production, all metrics would be calculated from your actual vendor portfolio and audit history.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Vendors */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">Total Vendors</p>
              <p className="text-3xl font-bold text-blue-600">{MOCK_METRICS.totalVendors}</p>
            </div>
            <Factory className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-blue-700">
            <TrendingUp className="w-4 h-4" />
            <span>+2 this quarter</span>
          </div>
        </div>

        {/* Avg Compliance Score */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 mb-1">Avg Compliance</p>
              <p className="text-3xl font-bold text-green-600">{MOCK_METRICS.avgComplianceScore}%</p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-green-700">
            <TrendingUp className="w-4 h-4" />
            <span>+3% from last month</span>
          </div>
        </div>

        {/* Audits This Month */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">Audits This Month</p>
              <p className="text-3xl font-bold text-purple-600">{MOCK_METRICS.auditsThisMonth}</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-purple-700">
            <Calendar className="w-4 h-4" />
            <span>6 completed, 2 in progress</span>
          </div>
        </div>

        {/* Overdue Audits */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-900 mb-1">Overdue Audits</p>
              <p className="text-3xl font-bold text-red-600">{MOCK_METRICS.overdueAudits}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-red-700">
            <Clock className="w-4 h-4" />
            <span>Requires immediate action</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-cyan-600" />
          <h3 className="text-lg font-semibold text-gray-900">Vendor Risk Distribution</h3>
        </div>
        <div className="space-y-4">
          {MOCK_RISK_DISTRIBUTION.map((item) => (
            <div key={item.risk} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-700">{item.risk}</div>
              <div className="flex-1 h-10 bg-gray-100 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${item.color} transition-all duration-500 flex items-center justify-end px-3`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                >
                  <span className="text-sm font-semibold text-white">{item.count}</span>
                </div>
              </div>
              <div className="w-12 text-sm text-gray-600 text-right">{item.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Risk Heatmap & Upcoming Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendor Risk Heatmap */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendor Risk Heatmap</h3>
          <div className="space-y-3">
            {MOCK_VENDORS.map((vendor) => (
              <div
                key={vendor.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${vendor.riskColor}`}>
                        {vendor.risk} Risk
                      </span>
                      <span className={`text-sm font-semibold ${getScoreColor(vendor.score)}`}>
                        {vendor.score}% Compliant
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{vendor.findings}</div>
                    <div className="text-xs text-gray-500">Findings</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Audits */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Audits</h3>
          <div className="space-y-3">
            {MOCK_UPCOMING_AUDITS.map((audit) => (
              <div
                key={audit.id}
                className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{audit.vendor}</h4>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(audit.dueDate).toLocaleDateString()}
                      </span>
                      <span className="text-blue-600 font-medium">
                        {audit.daysUntil} days
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${audit.riskColor}`}>
                    {audit.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {MOCK_UPCOMING_AUDITS.length} audits scheduled in next 120 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDashboard;
