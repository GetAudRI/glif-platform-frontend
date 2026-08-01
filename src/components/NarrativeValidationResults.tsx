import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  FileText,
  Calculator,
  Info,
  TrendingUp,
} from 'lucide-react';

interface Evidence {
  claim_fields_checked?: string[];
  claim_values?: Record<string, any>;
  policy_requirement?: string;
  calculated_value?: string;
}

interface Narrative {
  requirement?: string;
  findings?: string;
  calculation?: string;
  conclusion?: string;
}

interface RuleCheck {
  rule: string;
  rule_number?: number;
  category?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  status: 'PASS' | 'FAIL' | 'WARNING' | 'N/A';
  details?: string;
  confidence_score?: number;
  evidence?: Evidence;
  narrative?: Narrative;
}

interface ValidationResults {
  claim_id?: string;
  is_valid?: boolean;
  compliance_score?: number;
  errors?: any[];
  warnings?: any[];
  rule_checks: RuleCheck[];
}

interface NarrativeValidationResultsProps {
  results: ValidationResults;
  compact?: boolean;
}

const statusConfig = {
  PASS: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-800',
    label: 'Passed',
  },
  FAIL: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-800',
    label: 'Failed',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800',
    label: 'Warning',
  },
  'N/A': {
    icon: MinusCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    label: 'Skipped',
  },
};

const severityConfig = {
  critical: { color: 'text-red-700', bg: 'bg-red-100', label: 'Critical', emoji: '🔴' },
  high: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'High', emoji: '🟠' },
  medium: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Medium', emoji: '🟡' },
  low: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Low', emoji: '🔵' },
};

export default function NarrativeValidationResults({ results, compact = false }: NarrativeValidationResultsProps) {
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set([0])); // First rule expanded by default
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Calculate summary statistics
  const summary = useMemo(() => {
    const checks = results.rule_checks || [];
    return {
      total: checks.length,
      passed: checks.filter((c) => c.status === 'PASS').length,
      failed: checks.filter((c) => c.status === 'FAIL').length,
      warnings: checks.filter((c) => c.status === 'WARNING').length,
      skipped: checks.filter((c) => c.status === 'N/A').length,
    };
  }, [results.rule_checks]);

  // Filter rule checks
  const filteredChecks = useMemo(() => {
    let checks = results.rule_checks || [];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      checks = checks.filter(
        (c) =>
          c.rule?.toLowerCase().includes(query) ||
          c.category?.toLowerCase().includes(query) ||
          c.details?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      checks = checks.filter((c) => c.status === statusFilter);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      checks = checks.filter((c) => c.severity === severityFilter);
    }

    return checks;
  }, [results.rule_checks, searchQuery, statusFilter, severityFilter]);

  const toggleRule = (index: number) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRules(newExpanded);
  };

  const expandAll = () => {
    setExpandedRules(new Set(filteredChecks.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedRules(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Validation Summary</h3>
          {results.claim_id && (
            <span className="text-sm text-gray-600">Claim: {results.claim_id}</span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-xs text-gray-600 mt-1">Total Rules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">✅ {summary.passed}</div>
            <div className="text-xs text-gray-600 mt-1">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">❌ {summary.failed}</div>
            <div className="text-xs text-gray-600 mt-1">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">⚠️ {summary.warnings}</div>
            <div className="text-xs text-gray-600 mt-1">Warnings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-500">⊘ {summary.skipped}</div>
            <div className="text-xs text-gray-600 mt-1">Skipped</div>
          </div>
        </div>
        {results.compliance_score !== undefined && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-700">Rule pass rate</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  passed ÷ (passed + failed + warnings); N/A excluded
                </p>
              </div>
              <span className={`text-xl font-bold ${results.compliance_score >= 80 ? 'text-green-600' : results.compliance_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {results.rule_pass_rate ?? results.compliance_score}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="PASS">✅ Passed</option>
            <option value="FAIL">❌ Failed</option>
            <option value="WARNING">⚠️ Warnings</option>
            <option value="N/A">⊘ Skipped</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">🔴 Critical</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🔵 Low</option>
          </select>

          {/* Expand/Collapse */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Showing {filteredChecks.length} of {summary.total} rules
        </div>
      </div>

      {/* Rule Checks - Timeline Style */}
      <div className="space-y-3">
        {filteredChecks.map((check, index) => {
          const config = statusConfig[check.status] || statusConfig['N/A'];
          const StatusIcon = config.icon;
          const isExpanded = expandedRules.has(index);
          const severityInfo = check.severity ? severityConfig[check.severity] : null;

          return (
            <div
              key={index}
              className={`bg-white rounded-lg border-2 ${config.border} overflow-hidden transition-all hover:shadow-md`}
            >
              {/* Header - Always Visible */}
              <button
                onClick={() => toggleRule(index)}
                className={`w-full px-5 py-4 ${config.bg} hover:opacity-80 transition-opacity text-left`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Status Icon */}
                    <StatusIcon className={`w-5 h-5 ${config.color} flex-shrink-0 mt-0.5`} />

                    {/* Rule Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {check.rule_number && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                            #{check.rule_number}
                          </span>
                        )}
                        {severityInfo && (
                          <span className={`px-2 py-0.5 ${severityInfo.bg} ${severityInfo.color} rounded text-xs font-semibold`}>
                            {severityInfo.emoji} {severityInfo.label}
                          </span>
                        )}
                        {check.category && (
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {check.category}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 ${config.badge} rounded text-xs font-semibold ml-auto`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 leading-snug">
                        {check.rule}
                      </div>
                      {check.details && !isExpanded && (
                        <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                          {check.details}
                        </div>
                      )}
                    </div>

                    {/* Expand/Collapse Icon */}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Content - Narrative Details */}
              {isExpanded && (
                <div className="px-5 py-4 bg-white border-t border-gray-200 space-y-4">
                  {/* Policy Requirement */}
                  {check.narrative?.requirement && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <FileText className="w-4 h-4" />
                        Policy Requirement
                      </div>
                      <div className="pl-6 text-sm text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                        {check.narrative.requirement}
                      </div>
                    </div>
                  )}

                  {/* Claim Data Found */}
                  {check.narrative?.findings && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <Search className="w-4 h-4" />
                        Claim Data Found
                      </div>
                      <div className="pl-6 text-sm text-gray-700">
                        {check.narrative.findings}
                      </div>
                      {check.evidence?.claim_values && Object.keys(check.evidence.claim_values).length > 0 && (
                        <div className="pl-6 mt-2 space-y-1">
                          {Object.entries(check.evidence.claim_values).map(([key, value]) => (
                            <div key={key} className="flex items-start gap-2 text-xs">
                              <span className="text-gray-500 font-medium min-w-[120px]">{key}:</span>
                              <span className="text-gray-900 font-mono bg-gray-50 px-2 py-0.5 rounded">
                                {String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Validation Logic / Calculation */}
                  {check.narrative?.calculation && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <Calculator className="w-4 h-4" />
                        Validation Logic
                      </div>
                      <div className="pl-6 text-sm text-gray-700 bg-purple-50 p-3 rounded border-l-4 border-purple-500 font-mono">
                        {check.narrative.calculation}
                      </div>
                    </div>
                  )}

                  {/* Conclusion */}
                  {check.narrative?.conclusion && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4" />
                        Result
                      </div>
                      <div className={`pl-6 text-sm font-medium p-3 rounded border-l-4 ${
                        check.status === 'PASS' ? 'bg-green-50 border-green-500 text-green-800' :
                        check.status === 'FAIL' ? 'bg-red-50 border-red-500 text-red-800' :
                        check.status === 'WARNING' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                        'bg-gray-50 border-gray-500 text-gray-700'
                      }`}>
                        {check.narrative.conclusion}
                      </div>
                    </div>
                  )}

                  {/* Basic Details (fallback if no narrative) */}
                  {!check.narrative?.requirement && check.details && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                        <Info className="w-4 h-4" />
                        Details
                      </div>
                      <div className="pl-6 text-sm text-gray-700">
                        {check.details}
                      </div>
                    </div>
                  )}

                  {/* Confidence Score */}
                  {check.confidence_score !== undefined && (
                    <div className="pl-6 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Confidence Score</span>
                        <span className={`font-semibold ${
                          check.confidence_score >= 90 ? 'text-green-600' :
                          check.confidence_score >= 70 ? 'text-blue-600' :
                          check.confidence_score >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {check.confidence_score}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredChecks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No rules match your filters</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

