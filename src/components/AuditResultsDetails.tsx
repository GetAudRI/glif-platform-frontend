import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Settings, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp 
} from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

interface RuleCheck {
  category: string;
  confidence_score: number;
  details: string;
  evidence: string;
  narrative: string;
  rule: string;
  rule_number: number;
  severity: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'N/A';
}

interface Validation {
  id: number;
  validated_at: string;
  document_name: string;
  playbook_name: string;
  compliance_score: number;
  results: {
    rule_checks: RuleCheck[];
  };
}

interface Props {
  validationId: number;
}

export default function AuditResultsDetails({ validationId }: Props) {
  const [validation, setValidation] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set([1])); // Expand first rule by default

  useEffect(() => {
    if (validationId) {
      loadValidation();
    }
  }, [validationId]);

  async function loadValidation() {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiFetch(`/api/audit-oversight/validations/${validationId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch validation');
      }
      
      setValidation(data.validation);
    } catch (err: any) {
      setError(err.message || 'Error loading validation');
      console.error('Error loading validation:', err);
    } finally {
      setLoading(false);
    }
  }

  const toggleRule = (ruleNumber: number) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleNumber)) {
      newExpanded.delete(ruleNumber);
    } else {
      newExpanded.add(ruleNumber);
    }
    setExpandedRules(newExpanded);
  };

  const expandAll = () => {
    if (validation?.results?.rule_checks) {
      setExpandedRules(new Set(validation.results.rule_checks.map(r => r.rule_number)));
    }
  };

  const collapseAll = () => {
    setExpandedRules(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Error Loading Details</h3>
        </div>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!validation || !validation.results || !validation.results.rule_checks || validation.results.rule_checks.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-amber-900 mb-2">No Details Available</h3>
        <p className="text-sm text-amber-700">No detailed audit information available for this validation.</p>
      </div>
    );
  }

  const ruleChecks = validation.results.rule_checks;

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase();
    if (upperStatus === 'PASS') return 'bg-green-50 border-green-200 text-green-700';
    if (upperStatus === 'WARNING' || upperStatus === 'WARN') return 'bg-amber-50 border-amber-200 text-amber-700';
    if (upperStatus === 'FAIL') return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    const upperStatus = status?.toUpperCase();
    if (upperStatus === 'PASS') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (upperStatus === 'WARNING' || upperStatus === 'WARN') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    if (upperStatus === 'FAIL') return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-gray-500" />;
  };

  const getSeverityBadge = (severity: string) => {
    if (severity?.toLowerCase() === 'critical') {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">Critical</span>;
    }
    if (severity?.toLowerCase() === 'high') {
      return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded">High</span>;
    }
    if (severity?.toLowerCase() === 'medium') {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">Medium</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">Low</span>;
  };

  // Parse details and evidence fields (they may be JSON strings or plain text)
  const parseField = (field: string | undefined) => {
    if (!field) return null;
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Expand/Collapse Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Audit Results Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Collapse All
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Showing {ruleChecks.length} rule{ruleChecks.length !== 1 ? 's' : ''} with detailed policy requirements, 
          claim data, validation logic, and results
        </p>
      </div>

      {/* Rule Cards */}
      {ruleChecks.map((check) => {
        const isExpanded = expandedRules.has(check.rule_number);
        const detailsData = parseField(check.details);
        const evidenceData = parseField(check.evidence);
        
        return (
          <div
            key={check.rule_number}
            className={`bg-white rounded-lg border-2 shadow-sm overflow-hidden transition-all ${getStatusColor(check.status)}`}
          >
            {/* Rule Header - Always Visible */}
            <button
              onClick={() => toggleRule(check.rule_number)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-opacity-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-700 bg-white px-2 py-1 rounded border border-gray-300">
                    #{check.rule_number}
                  </span>
                  {getStatusIcon(check.status)}
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900">
                    {check.rule}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-600">{check.category}</span>
                    <span className="text-gray-400">•</span>
                    {getSeverityBadge(check.severity)}
                    <span className="text-gray-400">•</span>
                    <span className={`text-xs font-semibold ${
                      check.status?.toUpperCase() === 'PASS' ? 'text-green-700' :
                      check.status?.toUpperCase() === 'FAIL' ? 'text-red-700' :
                      check.status?.toUpperCase() === 'WARNING' || check.status?.toUpperCase() === 'WARN' ? 'text-amber-700' :
                      'text-gray-700'
                    }`}>
                      {check.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-gray-600">Confidence</div>
                  <div className="text-sm font-bold text-gray-900">{check.confidence_score}%</div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* Rule Details - Expandable */}
            {isExpanded && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-200 bg-white">
                {/* Policy Requirement Section */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Policy Requirement</h4>
                  </div>
                  <div className="bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg p-4">
                    {typeof check.narrative === 'object' && check.narrative !== null ? (
                      <div className="space-y-2">
                        {check.narrative.requirement && (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-semibold">Requirement: </span>
                            {check.narrative.requirement}
                          </p>
                        )}
                        {check.narrative.findings && (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-semibold">Findings: </span>
                            {check.narrative.findings}
                          </p>
                        )}
                        {check.narrative.calculation && (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-semibold">Calculation: </span>
                            {check.narrative.calculation}
                          </p>
                        )}
                        {check.narrative.conclusion && (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-semibold">Conclusion: </span>
                            {check.narrative.conclusion}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {check.narrative || 'Policy requirement text not available'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Claim Data Found Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Claim Data Found</h4>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
                    {typeof evidenceData === 'object' && evidenceData !== null ? (
                      <div className="space-y-2">
                        {Object.entries(evidenceData).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-700">{key}:</span>{' '}
                            <span className="text-gray-600">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {evidenceData || check.evidence || 'No claim data extracted'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Validation Logic Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="w-5 h-5 text-purple-600" />
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Validation Logic</h4>
                  </div>
                  <div className="bg-purple-50 border-l-4 border-purple-500 rounded-r-lg p-4">
                    {typeof detailsData === 'object' && detailsData !== null ? (
                      <div className="space-y-2">
                        {Object.entries(detailsData).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-700">{key}:</span>{' '}
                            <span className="text-gray-600">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">
                        {detailsData || check.details || 'Validation logic applied per policy requirements'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Result Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Result</h4>
                  </div>
                  <div className={`border-l-4 rounded-r-lg p-4 ${
                    check.status?.toUpperCase() === 'PASS' ? 'bg-green-50 border-green-500' :
                    check.status?.toUpperCase() === 'FAIL' ? 'bg-red-50 border-red-500' :
                    check.status?.toUpperCase() === 'WARNING' || check.status?.toUpperCase() === 'WARN' ? 'bg-amber-50 border-amber-500' :
                    'bg-gray-50 border-gray-500'
                  }`}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">
                          {check.status?.toUpperCase() === 'PASS' ? 'Compliant - All Requirements Met' :
                           check.status?.toUpperCase() === 'FAIL' ? 'Non-Compliant - Requirements Not Met' :
                           check.status?.toUpperCase() === 'WARNING' || check.status?.toUpperCase() === 'WARN' ? 'Warning - Review Required' :
                           'Not Applicable - Rule Does Not Apply'}
                        </div>
                        {typeof check.narrative === 'object' && check.narrative !== null ? (
                          <div className="text-sm text-gray-700 leading-relaxed space-y-1">
                            {check.narrative.conclusion && <p>{check.narrative.conclusion}</p>}
                            {check.narrative.findings && <p className="text-gray-600">{check.narrative.findings}</p>}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {check.narrative || 'Result explanation not available'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence Score Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">AI Confidence Score</span>
                    <span className="text-xs font-bold text-gray-900">{check.confidence_score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        check.confidence_score >= 90 ? 'bg-green-500' :
                        check.confidence_score >= 70 ? 'bg-blue-500' :
                        check.confidence_score >= 50 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${check.confidence_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
