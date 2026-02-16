import { useState, useEffect, useMemo } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Zap, Shield, ChevronDown, ChevronUp, DollarSign, BarChart3 } from 'lucide-react';

interface AuditActivity {
  id: string;
  claimId: string;
  type: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  duration: number;
  timestamp: Date;
  details?: string;
}

interface LiveAuditMonitorProps {
  className?: string;
}

const RULE_CATEGORIES = [
  { name: 'SOP Compliance Rules', count: 6, description: 'Policy and procedure adherence' },
  { name: 'State Regulatory Rules', count: 5, description: 'State-specific requirements' },
  { name: 'Payment Accuracy Rules', count: 7, description: 'Deductible, limits, overpayments' },
  { name: 'Documentation Completeness Rules', count: 6, description: 'Required docs and approvals' },
];

export default function LiveAuditMonitor({ className = '' }: LiveAuditMonitorProps) {
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [completedLastHour, setCompletedLastHour] = useState(1247);
  const [activeAudits, setActiveAudits] = useState(42);
  const [rulesPanelExpanded, setRulesPanelExpanded] = useState(true);
  const [potentialLeakage, setPotentialLeakage] = useState(47200);
  const [comparisonView, setComparisonView] = useState<'visual' | 'math'>('visual');
  const [viewBy, setViewBy] = useState<'lineOfBusiness' | 'client' | 'region'>('lineOfBusiness');

  // Q1 comparison math - resonates in demos
  const TRADITIONAL_Q1_FILES = 320;
  const GLIF_Q1_FILES = 1284;

  // Claim prefixes suggest diverse intake (carriers, TPAs, brokers)
  const claimPrefixes = [
    { prefix: 'CLM', type: 'Commercial Auto' },
    { prefix: 'WC', type: "Workers' Compensation" },
    { prefix: 'GL', type: 'General Liability' },
    { prefix: 'CP', type: 'Commercial Property' },
    { prefix: 'PL', type: 'Professional Liability' },
    { prefix: 'PA', type: 'Personal Auto' },
  ];

  const issueTypes = [
    'Missing Approval',
    'Incomplete Documentation',
    'Payment Limit Exceeded',
    'Coverage Exclusion',
    'Policy Lapsed',
    'Deductible Not Applied'
  ];

  // Generate new audit activity
  const generateActivity = (): AuditActivity => {
    const statuses: Array<'PASSED' | 'WARNING' | 'FAILED'> = ['PASSED', 'PASSED', 'PASSED', 'PASSED', 'PASSED', 'WARNING', 'FAILED'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const claimNum = Math.floor(Math.random() * 9000) + 1000;
    const { prefix, type } = claimPrefixes[Math.floor(Math.random() * claimPrefixes.length)];
    
    let details = '';
    if (status === 'FAILED') {
      details = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    } else if (status === 'WARNING') {
      details = 'Minor discrepancy detected';
    }

    return {
      id: `audit-${Date.now()}-${Math.random()}`,
      claimId: `${prefix}-2025-${claimNum}`,
      type,
      status,
      duration: Number((Math.random() * 3 + 1.5).toFixed(1)),
      timestamp: new Date(),
      details
    };
  };

  // Initialize with some activities
  useEffect(() => {
    const initial = Array.from({ length: 8 }, generateActivity);
    setActivities(initial);
  }, []);

  // Add new activities periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
      setCompletedLastHour(prev => prev + 1);

      // When an issue is flagged, add to cumulative leakage (ROI story for CFO)
      if (newActivity.status === 'WARNING' || newActivity.status === 'FAILED') {
        const amount = Math.floor(Math.random() * 800) + 200; // $200–$1,000 per issue
        setPotentialLeakage(prev => prev + amount);
      }

      // Occasionally adjust active audits
      if (Math.random() > 0.7) {
        setActiveAudits(prev => Math.max(20, Math.min(60, prev + (Math.random() > 0.5 ? 1 : -1))));
      }
    }, 2000); // New activity every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate stats from activities
  const stats = useMemo(() => {
    const total = activities.length;
    const passed = activities.filter(a => a.status === 'PASSED').length;
    const warnings = activities.filter(a => a.status === 'WARNING').length;
    const failed = activities.filter(a => a.status === 'FAILED').length;
    const routed = warnings + failed;
    
    return {
      total,
      passed,
      warnings,
      failed,
      routed,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0',
      routedRate: total > 0 ? ((routed / total) * 100).toFixed(1) : '0.0'
    };
  }, [activities]);

  // Lines of business - industry-neutral for carriers, TPAs, brokers
  const linesOfBusiness = [
    { name: 'Commercial Auto', count: 14, color: 'bg-blue-500' },
    { name: "Workers' Compensation", count: 11, color: 'bg-green-500' },
    { name: 'General Liability', count: 8, color: 'bg-purple-500' },
    { name: 'Commercial Property', count: 5, color: 'bg-orange-500' },
    { name: 'Professional Liability', count: 3, color: 'bg-pink-500' },
    { name: 'Personal Auto', count: 1, color: 'bg-teal-500' },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active Audits */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <Activity className="w-8 h-8 opacity-80" />
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                <span className="text-xs font-bold">LIVE</span>
              </div>
            </div>
            <div className="text-4xl font-bold mb-1 animate-pulse">
              {activeAudits}
            </div>
            <div className="text-orange-100 text-sm font-medium">
              Audits Running Now
            </div>
          </div>
        </div>

        {/* Completed Last Hour */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-8 h-8 opacity-80" />
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              1H
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            {completedLastHour.toLocaleString()}
          </div>
          <div className="text-blue-100 text-sm font-medium">
            Audits Completed
          </div>
        </div>

        {/* Auto-Validated vs Routed - Reframed for value prop */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="w-8 h-8 opacity-80" />
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              LIVE
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold">{stats.passRate}%</span>
            <span className="text-green-100 text-sm font-medium">auto-validated</span>
          </div>
          <div className="flex items-baseline gap-2 text-green-100 text-sm">
            <span className="font-semibold">{stats.routedRate}%</span>
            <span>routed for review</span>
          </div>
          <div className="mt-2 text-xs text-green-200/90">
            Previously undetectable in 2–5% sampling
          </div>
        </div>

        {/* Issues Flagged */}
        <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <AlertTriangle className="w-8 h-8 opacity-80" />
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              ROUTED
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            {stats.warnings + stats.failed}
          </div>
          <div className="text-amber-100 text-sm font-medium">
            Issues Flagged
          </div>
        </div>

        {/* Potential Leakage Identified - ROI for CFO / Chief Claims Officer */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-lg border-2 border-emerald-500/50">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 opacity-80" />
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              LIVE
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            ${potentialLeakage.toLocaleString()}
          </div>
          <div className="text-emerald-100 text-sm font-medium">
            Potential Leakage Identified
          </div>
          <div className="mt-2 text-xs text-emerald-200">
            Cumulative • Updates with each flagged issue
          </div>
        </div>
      </div>

      {/* Main Content: Activity Feed + Category Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Activity Feed */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                <h3 className="text-xl font-bold text-white">Live Activity Feed</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="font-mono font-semibold">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-2">
              Real-time audit results streaming • Every claim validated against 24+ business rules
            </p>
          </div>

          {/* Scrolling Activity List */}
          <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border transition-all duration-500
                  ${index === 0 ? 'animate-slideIn' : ''}
                  ${activity.status === 'PASSED' 
                    ? 'bg-green-900/20 border-green-700/50 hover:bg-green-900/30' 
                    : activity.status === 'WARNING'
                    ? 'bg-yellow-900/20 border-yellow-700/50 hover:bg-yellow-900/30'
                    : 'bg-red-900/20 border-red-700/50 hover:bg-red-900/30'
                  }
                `}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {activity.status === 'PASSED' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : activity.status === 'WARNING' ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-white text-sm">
                      {activity.claimId}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-300 text-xs font-medium">
                      {activity.type}
                    </span>
                  </div>
                  {activity.details && (
                    <p className="text-xs text-slate-400 truncate">
                      {activity.details}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-bold
                    ${activity.status === 'PASSED' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                      : activity.status === 'WARNING'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      : 'bg-red-500/20 text-red-400 border border-red-500/50'
                    }
                  `}>
                    {activity.status}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    {activity.duration}m
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Activity Category Grid */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active by Line of Business */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-2 h-8 bg-blue-500 rounded"></div>
              Active by Line of Business
            </h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-500">View by:</span>
              <div className="flex rounded-md overflow-hidden border border-gray-200 text-xs">
                <button
                  onClick={() => setViewBy('lineOfBusiness')}
                  className={`px-2.5 py-1.5 font-medium transition-colors ${
                    viewBy === 'lineOfBusiness' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Line of Business
                </button>
                <button
                  onClick={() => setViewBy('client')}
                  className={`px-2.5 py-1.5 font-medium transition-colors ${
                    viewBy === 'client' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Client
                </button>
                <button
                  onClick={() => setViewBy('region')}
                  className={`px-2.5 py-1.5 font-medium transition-colors ${
                    viewBy === 'region' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Region
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {linesOfBusiness.map((line) => (
                <div key={line.name} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {line.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {line.count}
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${line.color} rounded-full animate-pulse`}
                      style={{ width: `${(line.count / 14) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Frequency - Full-width prominent section with toggle */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Audit Frequency
              </h3>
              <div className="flex rounded-lg overflow-hidden border border-blue-200 bg-white">
                <button
                  onClick={() => setComparisonView('visual')}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    comparisonView === 'visual' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  Visual
                </button>
                <button
                  onClick={() => setComparisonView('math')}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    comparisonView === 'math' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
                  }`}
                >
                  Q1 Math
                </button>
              </div>
            </div>

            {comparisonView === 'visual' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Traditional */}
                <div className="bg-white rounded-lg p-6 border-2 border-red-200">
                  <div className="text-center mb-3">
                    <div className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold mb-2">
                      TRADITIONAL
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Quarterly Sampling</div>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded bg-red-200 mb-1"></div>
                        <div className="text-[10px] text-gray-500">Q{i+1}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-3 text-xs text-red-600 font-semibold">
                    4 times per year • Weeks between audits
                  </div>
                </div>

                {/* AudRI */}
                <div className="bg-white rounded-lg p-6 border-2 border-green-200">
                  <div className="text-center mb-3">
                    <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-2">
                      AudRI REAL-TIME
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Continuous Monitoring</div>
                  </div>
                  <div className="relative h-12 bg-green-100 rounded overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-1 bg-green-500 animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-700">24/7 LIVE</span>
                    </div>
                  </div>
                  <div className="text-center mt-3 text-xs text-green-600 font-semibold">
                    Always on • Instant validation
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 border-2 border-blue-200">
                <p className="text-gray-700 text-center mb-6 leading-relaxed">
                  In Q1, traditional sampling would have reviewed{' '}
                  <span className="font-bold text-red-600 text-lg">~{TRADITIONAL_Q1_FILES.toLocaleString()} files</span>.
                  <br />
                  <span className="font-bold text-green-600 text-lg">GLIF reviewed {GLIF_Q1_FILES.toLocaleString()}.</span>
                </p>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600">{TRADITIONAL_Q1_FILES}</div>
                    <div className="text-xs text-red-600 font-semibold mt-1">Traditional</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">vs</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">{GLIF_Q1_FILES.toLocaleString()}</div>
                    <div className="text-xs text-green-600 font-semibold mt-1">GLIF</div>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">
                  Same period • 100% coverage vs 2–5% sample
                </p>
              </div>
            )}
      </div>

      {/* Business Rules Panel - Key Differentiator */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-xl border-2 border-indigo-500 shadow-xl overflow-hidden">
        <button
          onClick={() => setRulesPanelExpanded(!rulesPanelExpanded)}
          className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                24 Business Rules Executed Per Claim
              </h3>
              <p className="text-indigo-200 text-sm mt-1">
                {24} rules × {completedLastHour.toLocaleString()} claims = {(24 * completedLastHour).toLocaleString()} rule validations this hour
              </p>
            </div>
          </div>
          <div className="text-white/80">
            {rulesPanelExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
          </div>
        </button>

        {rulesPanelExpanded && (
          <div className="px-6 pb-6 pt-0">
            <div className="border-t border-indigo-500/50 pt-6">
              <p className="text-indigo-200 text-sm mb-4">
                Every claim validated against comprehensive rule categories — the math that makes the 95% audit gap tangible vs. traditional sampling.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {RULE_CATEGORIES.map((cat) => (
                  <div
                    key={cat.name}
                    className="bg-white/10 rounded-lg p-4 border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-white text-sm">{cat.name}</span>
                      <span className="text-indigo-200 font-bold text-lg">{cat.count}</span>
                    </div>
                    <p className="text-indigo-200/90 text-xs">{cat.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
