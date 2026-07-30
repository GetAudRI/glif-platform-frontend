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
  { risk: 'Critical', count: 3, color: 'bg-red-600' },
  { risk: 'High', count: 4, color: 'bg-orange-600' },
  { risk: 'Moderate', count: 3, color: 'bg-yellow-600' },
  { risk: 'Low', count: 2, color: 'bg-green-600' }
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

  const getRiskClass = (risk: string) => {
    if (risk === 'Critical') return 'sev-critical';
    if (risk === 'High') return 'sev-major';
    if (risk === 'Moderate') return 'sev-minor';
    return 'sev-observation';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="overline mb-2">Portfolio Risk</div>
        <h2 className="heading text-2xl text-gray-900 mb-2">Portfolio Dashboard</h2>
        <p className="text-gray-600">Overview of vendor risk, compliance, and audit schedule</p>
      </div>

      {/* Info Banner */}
      <div className="bg-white border border-hair rounded-sm p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rust flex-shrink-0 mt-0.5" strokeWidth={1.75} />
          <div>
            <h4 className="overline mb-1">Demo Mode</h4>
            <p className="text-sm text-neutral-600">
              This dashboard shows mock data for demonstration purposes. In production, all metrics would be calculated from your actual vendor portfolio and audit history.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 border-l border-t border-hair bg-white">
        {/* Total Vendors */}
        <div className="p-6 border-r border-b border-hair">
          <div className="flex items-start justify-between">
            <div>
              <p className="overline mb-3">Total Vendors</p>
              <p className="heading text-4xl tracking-tighter leading-none num text-neutral-950">{MOCK_METRICS.totalVendors}</p>
            </div>
            <Factory className="w-6 h-6 text-rust" strokeWidth={1.75} />
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-neutral-600">
            <TrendingUp className="w-4 h-4" />
            <span>+2 this quarter</span>
          </div>
        </div>

        {/* Avg Compliance Score */}
        <div className="p-6 border-r border-b border-hair">
          <div className="flex items-start justify-between">
            <div>
              <p className="overline mb-3">Avg Compliance</p>
              <p className="heading text-4xl tracking-tighter leading-none num text-green-700">{MOCK_METRICS.avgComplianceScore}%</p>
            </div>
            <Shield className="w-6 h-6 text-rust" strokeWidth={1.75} />
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-neutral-600">
            <TrendingUp className="w-4 h-4" />
            <span>+3% from last month</span>
          </div>
        </div>

        {/* Audits This Month */}
        <div className="p-6 border-r border-b border-hair">
          <div className="flex items-start justify-between">
            <div>
              <p className="overline mb-3">Audits This Month</p>
              <p className="heading text-4xl tracking-tighter leading-none num text-neutral-950">{MOCK_METRICS.auditsThisMonth}</p>
            </div>
            <FileText className="w-6 h-6 text-rust" strokeWidth={1.75} />
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-neutral-600">
            <Calendar className="w-4 h-4" />
            <span>6 completed, 2 in progress</span>
          </div>
        </div>

        {/* Overdue Audits */}
        <div className="p-6 border-r border-b border-hair">
          <div className="flex items-start justify-between">
            <div>
              <p className="overline mb-3">Overdue Audits</p>
              <p className="heading text-4xl tracking-tighter leading-none num text-red-700">{MOCK_METRICS.overdueAudits}</p>
            </div>
            <AlertCircle className="w-6 h-6 text-rust" strokeWidth={1.75} />
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-neutral-600">
            <Clock className="w-4 h-4" />
            <span>Requires immediate action</span>
          </div>
        </div>
      </div>

      {/* Risk Distribution Chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-rust" strokeWidth={1.75} />
          <h3 className="heading text-lg text-gray-900">Vendor Risk Distribution</h3>
        </div>
        <div className="space-y-4">
          {MOCK_RISK_DISTRIBUTION.map((item) => (
            <div key={item.risk} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium text-gray-700">{item.risk}</div>
              <div className="flex-1 h-8 bg-neutral-100 rounded-sm overflow-hidden relative border border-hair">
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
        <div className="card p-6">
          <h3 className="heading text-lg text-gray-900 mb-4">Vendor Risk Heatmap</h3>
          <div className="space-y-3">
            {MOCK_VENDORS.map((vendor) => (
              <div
                key={vendor.id}
                className="p-4 border border-hair rounded-sm hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{vendor.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`pill ${getRiskClass(vendor.risk)}`}>
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
        <div className="card p-6">
          <h3 className="heading text-lg text-gray-900 mb-4">Upcoming Audits</h3>
          <div className="space-y-3">
            {MOCK_UPCOMING_AUDITS.map((audit) => (
              <div
                key={audit.id}
                className="p-4 border border-hair bg-white rounded-sm hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{audit.vendor}</h4>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(audit.dueDate).toLocaleDateString()}
                      </span>
                      <span className="text-rust font-medium">
                        {audit.daysUntil} days
                      </span>
                    </div>
                  </div>
                  <span className={`pill ${getRiskClass(audit.risk)}`}>
                    {audit.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-hair">
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
