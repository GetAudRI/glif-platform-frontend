import { useState, useEffect, useMemo } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';

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

export default function LiveAuditMonitor({ className = '' }: LiveAuditMonitorProps) {
  const [activities, setActivities] = useState<AuditActivity[]>([]);
  const [completedLastHour, setCompletedLastHour] = useState(1247);
  const [activeAudits, setActiveAudits] = useState(42);

  // Mock claim types focused on Auto Claims
  const claimTypes = [
    'Auto Collision',
    'Auto Liability', 
    'Auto Comprehensive',
    'Auto Bodily Injury',
    'Auto Property Damage',
    'Auto Uninsured Motorist',
    'Auto Glass/Windshield',
    'Auto Theft'
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
    
    let details = '';
    if (status === 'FAILED') {
      details = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    } else if (status === 'WARNING') {
      details = 'Minor discrepancy detected';
    }

    return {
      id: `audit-${Date.now()}-${Math.random()}`,
      claimId: `CLM-2025-${claimNum}`,
      type: claimTypes[Math.floor(Math.random() * claimTypes.length)],
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
    
    return {
      total,
      passed,
      warnings,
      failed,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'
    };
  }, [activities]);

  // Activity grid categories
  const activityCategories = [
    { name: 'Collision', count: 14, color: 'bg-blue-500' },
    { name: 'Liability', count: 11, color: 'bg-green-500' },
    { name: 'Comprehensive', count: 8, color: 'bg-purple-500' },
    { name: 'Bodily Injury', count: 5, color: 'bg-orange-500' },
    { name: 'Property', count: 3, color: 'bg-pink-500' },
    { name: 'Uninsured', count: 1, color: 'bg-teal-500' }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        {/* Pass Rate */}
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="w-8 h-8 opacity-80" />
            <div className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              LIVE
            </div>
          </div>
          <div className="text-4xl font-bold mb-1">
            {stats.passRate}%
          </div>
          <div className="text-green-100 text-sm font-medium">
            Current Pass Rate
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

          {/* Rules Applied Indicator */}
          <div className="p-4 border-t border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Each audit validates against:</span>
              <span className="text-white font-bold">24 Business Rules</span>
            </div>
          </div>
        </div>

        {/* Activity Category Grid */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active by Category */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-2 h-8 bg-blue-500 rounded"></div>
              Active by Category
            </h3>

            <div className="space-y-3">
              {activityCategories.map((category) => (
                <div key={category.name} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {category.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {category.count}
                    </span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full ${category.color} rounded-full animate-pulse`}
                      style={{ width: `${(category.count / 42) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison: Traditional vs GLIF */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
              Audit Frequency
            </h3>

            <div className="space-y-4">
              {/* Traditional */}
              <div className="bg-white rounded-lg p-4 border border-red-200">
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

              {/* GLIF */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="text-center mb-3">
                  <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-2">
                    GLIF REAL-TIME
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
          </div>
        </div>
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
