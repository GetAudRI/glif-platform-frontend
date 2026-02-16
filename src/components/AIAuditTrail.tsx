import { useState } from 'react';
import { 
  Activity, 
  Brain, 
  Shield, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Zap,
  FileText,
  Database,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';

interface Props {
  validationId: number;
}

interface AuditEvent {
  id: string;
  timestamp: string;
  event_type: 'model_init' | 'document_ingestion' | 'rule_extraction' | 'rule_evaluation' | 'human_review' | 'compliance_check' | 'final_determination';
  title: string;
  description: string;
  status: 'success' | 'warning' | 'info' | 'error';
  details: {
    model?: string;
    provider?: string;
    input_tokens?: number;
    output_tokens?: number;
    cost?: number;
    confidence?: number;
    duration_ms?: number;
    reviewer?: string;
    rule_number?: number;
    rule_name?: string;
    result?: string;
    [key: string]: any;
  };
}

export default function AIAuditTrail({ validationId }: Props) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set(['evt-1']));
  const [showLedger, setShowLedger] = useState(true);

  // Generate mock audit trail data
  const auditEvents: AuditEvent[] = [
    {
      id: 'evt-1',
      timestamp: '2025-02-06T10:23:15.234Z',
      event_type: 'document_ingestion',
      title: 'Document Ingestion Started',
      description: 'Claim document uploaded and validated',
      status: 'success',
      details: {
        file_name: 'Claim_C1234.pdf',
        file_size: '2.4 MB',
        file_hash: 'sha256:a3f5b8c9d2e1...',
        pages: 12,
        duration_ms: 1250
      }
    },
    {
      id: 'evt-2',
      timestamp: '2025-02-06T10:23:17.891Z',
      event_type: 'model_init',
      title: 'AI Model Initialized',
      description: 'Claude 3.5 Sonnet model loaded via OpenRouter',
      status: 'success',
      details: {
        model: 'Claude 3.5 Sonnet',
        provider: 'OpenRouter',
        model_version: 'claude-3-5-sonnet-20241022',
        temperature: 0.1,
        max_tokens: 4096,
        duration_ms: 450
      }
    },
    {
      id: 'evt-3',
      timestamp: '2025-02-06T10:23:19.123Z',
      event_type: 'rule_extraction',
      title: 'SOP Rules Extraction',
      description: 'Extracted compliance rules from Standard Operating Procedure',
      status: 'success',
      details: {
        sop_name: 'Auto_Claims_SOP_v2.3.pdf',
        rules_extracted: 47,
        input_tokens: 2450,
        output_tokens: 890,
        cost: 0.0234,
        confidence: 0.94,
        duration_ms: 8750
      }
    },
    {
      id: 'evt-4',
      timestamp: '2025-02-06T10:23:28.456Z',
      event_type: 'rule_evaluation',
      title: 'Rule #1: Age Verification',
      description: 'Evaluated claimant age against policy requirements',
      status: 'success',
      details: {
        rule_number: 1,
        rule_name: 'Claimant must be 18+ years old',
        result: 'PASS',
        confidence: 0.98,
        input_tokens: 156,
        output_tokens: 89,
        cost: 0.0012,
        evidence: 'Date of Birth: 1985-03-15 (Age: 39)',
        duration_ms: 1200
      }
    },
    {
      id: 'evt-5',
      timestamp: '2025-02-06T10:23:30.234Z',
      event_type: 'rule_evaluation',
      title: 'Rule #2: Policy Active Status',
      description: 'Verified policy was active at time of incident',
      status: 'success',
      details: {
        rule_number: 2,
        rule_name: 'Policy must be active on incident date',
        result: 'PASS',
        confidence: 0.96,
        input_tokens: 142,
        output_tokens: 76,
        cost: 0.0011,
        evidence: 'Policy Active: 2024-01-01 to 2025-12-31',
        duration_ms: 980
      }
    },
    {
      id: 'evt-6',
      timestamp: '2025-02-06T10:23:32.567Z',
      event_type: 'rule_evaluation',
      title: 'Rule #3: Claim Amount Validation',
      description: 'Verified claim amount within policy limits',
      status: 'warning',
      details: {
        rule_number: 3,
        rule_name: 'Claim amount must not exceed policy limit',
        result: 'WARNING',
        confidence: 0.89,
        input_tokens: 178,
        output_tokens: 134,
        cost: 0.0015,
        evidence: 'Claim: $4,500 | Policy Limit: $5,000 (90% utilized)',
        duration_ms: 1450
      }
    },
    {
      id: 'evt-7',
      timestamp: '2025-02-06T10:23:35.123Z',
      event_type: 'human_review',
      title: 'Human Oversight Checkpoint',
      description: 'Senior auditor reviewed high-value claim threshold',
      status: 'info',
      details: {
        reviewer: 'Sarah Johnson (Senior Auditor)',
        action: 'Approved for continued processing',
        notes: 'Claim amount justified by repair estimates',
        duration_ms: 2500
      }
    },
    {
      id: 'evt-8',
      timestamp: '2025-02-06T10:23:38.789Z',
      event_type: 'rule_evaluation',
      title: 'Rule #4: Documentation Completeness',
      description: 'Verified all required documents are present',
      status: 'success',
      details: {
        rule_number: 4,
        rule_name: 'All required supporting documents must be attached',
        result: 'PASS',
        confidence: 0.92,
        input_tokens: 234,
        output_tokens: 112,
        cost: 0.0017,
        evidence: 'Found: Police Report, Repair Estimate, Photos (3)',
        duration_ms: 1680
      }
    },
    {
      id: 'evt-9',
      timestamp: '2025-02-06T10:23:42.456Z',
      event_type: 'compliance_check',
      title: 'Regulatory Compliance Verification',
      description: 'Verified audit process meets regulatory requirements',
      status: 'success',
      details: {
        framework: 'SOC 2 Type II',
        checks_performed: 8,
        checks_passed: 8,
        audit_trail_complete: true,
        data_retention_compliant: true,
        access_controls_verified: true,
        duration_ms: 890
      }
    },
    {
      id: 'evt-10',
      timestamp: '2025-02-06T10:23:45.234Z',
      event_type: 'human_review',
      title: 'Final Human Review',
      description: 'Audit manager reviewed complete audit trail',
      status: 'info',
      details: {
        reviewer: 'Michael Chen (Audit Manager)',
        action: 'Audit trail approved',
        notes: 'All AI decisions properly documented and justified',
        duration_ms: 3200
      }
    },
    {
      id: 'evt-11',
      timestamp: '2025-02-06T10:23:50.567Z',
      event_type: 'final_determination',
      title: 'Final Compliance Determination',
      description: 'Overall audit result calculated and finalized',
      status: 'success',
      details: {
        overall_result: 'COMPLIANT',
        compliance_score: 94,
        rules_evaluated: 47,
        rules_passed: 45,
        rules_warning: 2,
        rules_failed: 0,
        total_input_tokens: 8456,
        total_output_tokens: 3234,
        total_cost: 0.0567,
        total_duration_ms: 35317,
        confidence: 0.93
      }
    }
  ];

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const expandAll = () => {
    setExpandedEvents(new Set(auditEvents.map(e => e.id)));
  };

  const collapseAll = () => {
    setExpandedEvents(new Set());
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'model_init':
        return <Brain className="w-5 h-5" />;
      case 'document_ingestion':
        return <FileText className="w-5 h-5" />;
      case 'rule_extraction':
        return <Database className="w-5 h-5" />;
      case 'rule_evaluation':
        return <Zap className="w-5 h-5" />;
      case 'human_review':
        return <Eye className="w-5 h-5" />;
      case 'compliance_check':
        return <Shield className="w-5 h-5" />;
      case 'final_determination':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-amber-100 text-amber-800',
      info: 'bg-blue-100 text-blue-800',
      error: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const calculateDuration = (index: number) => {
    if (index === 0) return null;
    const current = new Date(auditEvents[index].timestamp).getTime();
    const previous = new Date(auditEvents[index - 1].timestamp).getTime();
    return current - previous;
  };

  // Immutable ledger entries
  const ledgerEntries = [
    { time: "10:23:15", event: "Document Ingestion", detail: "Claim_C1234.pdf validated and stored", icon: "📄", status: "success" },
    { time: "10:23:17", event: "AI Model Init", detail: "Claude 3.5 Sonnet loaded via OpenRouter", icon: "🤖", status: "info" },
    { time: "10:23:19", event: "Rule Extraction", detail: "47 rules extracted from Auto_Claims_SOP_v2.3", icon: "📋", status: "success" },
    { time: "10:23:28", event: "Rule Evaluation", detail: "Rule #1: Age Verification - PASS (98% confidence)", icon: "✅", status: "success" },
    { time: "10:23:30", event: "Rule Evaluation", detail: "Rule #2: Policy Active Status - PASS (96% confidence)", icon: "✅", status: "success" },
    { time: "10:23:32", event: "Rule Evaluation", detail: "Rule #3: Claim Amount - WARNING (89% confidence)", icon: "⚠️", status: "warning" },
    { time: "10:23:35", event: "Human Review", detail: "Sarah Johnson approved high-value claim threshold", icon: "👤", status: "info" },
    { time: "10:23:38", event: "Rule Evaluation", detail: "Rule #4: Documentation Complete - PASS (92% confidence)", icon: "✅", status: "success" },
    { time: "10:23:42", event: "Compliance Check", detail: "SOC 2 Type II verification - 8/8 checks passed", icon: "🛡️", status: "success" },
    { time: "10:23:45", event: "Human Review", detail: "Michael Chen approved final audit trail", icon: "👤", status: "info" },
    { time: "10:23:50", event: "Final Determination", detail: "Overall result: COMPLIANT (94% score)", icon: "🎯", status: "success" },
    { time: "10:23:51", event: "Ledger Sealed", detail: "Audit trail cryptographically sealed (hash: 0x7a3f...c2d1)", icon: "🔒", status: "success" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Content - Left/Center (2 columns) */}
      <div className="lg:col-span-2 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Audit Trail</h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete transparency log of AI model usage and decision-making process
              </p>
            </div>
          </div>
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
            <button
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 inline-flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Trail
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Total Events</div>
            <div className="text-2xl font-bold text-gray-900">{auditEvents.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs text-green-700 mb-1">AI Model Calls</div>
            <div className="text-2xl font-bold text-green-800">18</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs text-blue-700 mb-1">Human Reviews</div>
            <div className="text-2xl font-bold text-blue-800">2</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-xs text-purple-700 mb-1">Total Duration</div>
            <div className="text-2xl font-bold text-purple-800">35.3s</div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Timeline</h3>
        
        <div className="space-y-3">
          {auditEvents.map((event, index) => {
            const isExpanded = expandedEvents.has(event.id);
            const duration = calculateDuration(index);

            return (
              <div key={event.id} className="relative">
                {/* Timeline connector */}
                {index < auditEvents.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
                )}

                {/* Event Card */}
                <div className={`rounded-lg border-2 overflow-hidden ${getStatusColor(event.status)}`}>
                  <button
                    onClick={() => toggleEvent(event.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white border ${
                        event.status === 'success' ? 'border-green-300' :
                        event.status === 'warning' ? 'border-amber-300' :
                        event.status === 'info' ? 'border-blue-300' :
                        'border-gray-300'
                      }`}>
                        {getEventIcon(event.event_type)}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusBadge(event.status)}`}>
                            {event.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{event.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(event.timestamp)}
                        </div>
                        {duration && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            +{duration}ms
                          </div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-white bg-opacity-50">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(event.details).map(([key, value]) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="text-gray-500 font-medium min-w-[120px]">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span className="text-gray-900 font-mono text-xs">
                              {typeof value === 'number' ? value.toLocaleString() : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compliance Footer */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-green-600" />
          <div>
            <h4 className="text-sm font-semibold text-green-900">Audit Trail Complete & Compliant</h4>
            <p className="text-xs text-green-700 mt-1">
              All AI decisions documented • Human oversight verified • Regulatory requirements met • 
              Audit trail immutable and exportable
            </p>
          </div>
        </div>
      </div>

      {/* Regulatory Export */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Regulatory Export Ready</h4>
              <p className="text-xs text-gray-600 mt-1">
                DOI Market Conduct • SOX 404 • NAIC Model Audit Rule compliant format
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
              Export PDF
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Export JSON
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Right Sidebar - Immutable Ledger */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-4">
          <button
            onClick={() => setShowLedger(!showLedger)}
            className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Immutable Audit Ledger</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded">
                Sealed
              </span>
              {showLedger ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </button>

          {showLedger && (
            <div className="max-h-[600px] overflow-y-auto">
              <div className="p-3 bg-blue-50 border-b border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Cryptographic Hash:</strong> <span className="font-mono">0x7a3f...c2d1</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Blockchain-anchored • Tamper-proof • Regulatory compliant
                </p>
              </div>
              
              <div className="divide-y divide-gray-100">
                {ledgerEntries.map((entry, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">{entry.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-900 truncate">
                            {entry.event}
                          </span>
                          <span className="text-xs text-gray-500 font-mono flex-shrink-0">
                            {entry.time}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {entry.detail}
                        </p>
                        <div className="mt-1">
                          <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded ${
                            entry.status === 'success' ? 'bg-green-100 text-green-700' :
                            entry.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {entry.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>Ledger sealed at 10:23:51 UTC</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                  <span className="text-green-700 font-medium">Verified & Immutable</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
