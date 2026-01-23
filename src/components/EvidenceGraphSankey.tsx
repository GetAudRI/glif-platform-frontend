import { useState, useEffect } from 'react';
import { Activity, AlertCircle, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Chart } from 'react-google-charts';

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

export default function EvidenceGraphSankey({ validationId }: Props) {
  const [validation, setValidation] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (validationId) {
      loadValidation();
    }
  }, [validationId]);

  async function loadValidation() {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://localhost:5002/api/audit-oversight/validations/${validationId}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading evidence graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Error Loading Graph</h3>
        </div>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!validation || !validation.results || !validation.results.rule_checks || validation.results.rule_checks.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
        <Activity className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-amber-900 mb-2">No Graph Data</h3>
        <p className="text-sm text-amber-700">No evidence graph data available for this validation.</p>
      </div>
    );
  }

  const ruleChecks = validation.results.rule_checks;
  
  // Calculate statistics (case-insensitive to handle backend variations)
  const claimCategories = new Set(ruleChecks.map(c => c.category));
  const rules = new Set(ruleChecks.map(c => `Rule ${c.rule_number}`));
  const passCount = ruleChecks.filter(c => c.status?.toUpperCase() === 'PASS').length;
  const warnCount = ruleChecks.filter(c => c.status?.toUpperCase() === 'WARNING' || c.status?.toUpperCase() === 'WARN').length;
  const failCount = ruleChecks.filter(c => c.status?.toUpperCase() === 'FAIL').length;
  const naCount = ruleChecks.filter(c => c.status?.toUpperCase() === 'N/A').length;
  
  // Debug logging
  console.log('📊 Validation Stats:', {
    total: ruleChecks.length,
    passed: passCount,
    warnings: warnCount,
    failed: failCount,
    na: naCount,
    statuses: ruleChecks.map(c => ({ rule: c.rule_number, status: c.status }))
  });

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 rounded-lg border-2 border-indigo-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              ⚙️ Claim Validation Journey
            </h2>
            <p className="text-gray-600">
              Track how we analyze claims against policy rules and reach decisions
            </p>
          </div>
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-6 shadow-lg">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold">{claimCategories.size}</div>
                <div className="text-sm opacity-90">Claim Groups</div>
                <div className="text-xs opacity-75 mt-1">Data extracted</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{rules.size}</div>
                <div className="text-sm opacity-90">Rules Applied</div>
                <div className="text-xs opacity-75 mt-1">From SOP doc</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{ruleChecks.length}</div>
                <div className="text-sm opacity-90">Decisions Made</div>
                <div className="text-xs opacity-75 mt-1">Pass/Fail/N/A</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Indicator */}
        <div className="flex items-center justify-center gap-4 text-sm font-medium">
          <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg flex items-center gap-2">
            <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">1</span>
            Claim Data
          </span>
          <span className="text-gray-400">→</span>
          <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span>
            Rules
          </span>
          <span className="text-gray-400">→</span>
          <span className="px-4 py-2 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
            <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span>
            Results
          </span>
        </div>
      </div>

      {/* Sankey Diagram - Beautiful Curved Flows! */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Linear Validation Journey</h3>
        
        <SankeyVisualization ruleChecks={ruleChecks} />

        {/* Summary Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">{passCount}</div>
              <div className="text-sm text-green-700">Passed</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-amber-900">{warnCount}</div>
              <div className="text-sm text-amber-700">Warnings</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-900">{failCount}</div>
              <div className="text-sm text-red-700">Failed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-700">{naCount}</div>
              <div className="text-sm text-gray-600">N/A</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <p className="text-sm text-gray-700 mb-2">
          <span className="font-semibold">💡 How to Read:</span> Claim data flows left to right through policy rules.
        </p>
        <p className="text-xs text-gray-600">
          <span className="font-semibold">Color Key:</span> Purple=Categories | Blue=Rules | Green=Pass | Amber=Warning | Gray=N/A | Red=Fail
        </p>
      </div>
    </div>
  );
}

// Sankey Visualization Component
function SankeyVisualization({ ruleChecks }: { ruleChecks: RuleCheck[] }) {
  // Build Sankey data: Claim Data → Rules → Results
  const sankeyData: any[] = [
    ['From', 'To', 'Weight', { role: 'tooltip' }]
  ];

  ruleChecks.forEach((check, index) => {
    // Column 1: Claim Data
    const claimData = check.category?.substring(0, 35) || `Check ${index + 1}`;
    
    // Column 2: Rule
    const ruleName = `Rule ${check.rule_number}: ${check.rule}`.substring(0, 45);
    
    // Column 3: Result (case-insensitive)
    let resultNode = '';
    const status = check.status?.toUpperCase();
    if (status === 'PASS') {
      resultNode = '✓ PASS';
    } else if (status === 'WARNING' || status === 'WARN') {
      resultNode = '⚠ WARNING';
    } else if (status === 'N/A') {
      resultNode = '⊘ N/A';
    } else {
      resultNode = '✗ FAIL';
    }
    
    // Weight based on confidence
    const weight = check.confidence_score || 5;
    
    // Column 1 → Column 2
    sankeyData.push([
      claimData,
      ruleName,
      weight,
      `${claimData} → Checked against: ${check.rule}`
    ]);
    
    // Column 2 → Column 3
    sankeyData.push([
      ruleName,
      resultNode,
      weight,
      `${check.rule} → Result: ${check.status}${check.narrative ? `\n${check.narrative}` : ''}`
    ]);
  });

  const options = {
    height: 600,
    sankey: {
      node: {
        colors: [
          '#8b5cf6',  // Claim Data - purple
          '#3b82f6',  // Rules - blue
          '#22c55e',  // PASS - green
          '#f59e0b',  // WARNING - amber
          '#9ca3af',  // N/A - gray
          '#ef4444',  // FAIL - red
        ],
        label: {
          fontName: 'Inter, system-ui, sans-serif',
          fontSize: 12,
          bold: true,
        },
        nodePadding: 20,
        width: 20,
      },
      link: {
        colorMode: 'gradient',
        colors: ['#c4b5fd', '#93c5fd', '#86efac', '#fcd34d', '#d1d5db', '#fca5a5']
      }
    },
    tooltip: {
      textStyle: {
        fontName: 'Inter, system-ui, sans-serif',
        fontSize: 13
      }
    }
  };

  return (
    <div className="min-h-[600px]">
      <Chart
        chartType="Sankey"
        width="100%"
        height="600px"
        data={sankeyData}
        options={options}
      />
      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 border border-indigo-200 rounded-lg">
        <div className="text-sm text-gray-700 text-center">
          <strong>💡 Linear Journey View:</strong> Follow each piece of claim data as it flows through relevant rules and reaches a final decision.
          This view shows the <strong>complete validation path</strong> from extraction to outcome.
        </div>
        <div className="text-xs text-gray-500 text-center mt-2">
          Flow width = confidence | Hover to see details | Purple = Claim Data | Blue = Rules | Green/Amber/Red = Results
        </div>
      </div>
    </div>
  );
}

