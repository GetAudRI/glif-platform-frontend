/**
 * Live Activity Feed - Standalone React Component
 * 
 * Copy this file into your project. Requires: react, lucide-react (or replace icons)
 * 
 * Usage:
 *   <LiveActivityFeed />
 *   <LiveActivityFeed items={yourItems} intervalMs={3000} />
 *   <LiveActivityFeed onAddItem={(item) => console.log(item)} />
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export interface ActivityItem {
  id: string;
  label: string;
  type?: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  details?: string;
  duration?: string | number;
}

interface LiveActivityFeedProps {
  /** Initial/seed items. If not provided, uses demo generator */
  initialItems?: ActivityItem[];
  /** Add new item every N ms. Set to 0 to disable auto-add */
  intervalMs?: number;
  /** Max items to display (older removed) */
  maxItems?: number;
  /** Custom items to push (e.g. from WebSocket). Call pushItem() */
  className?: string;
  /** Optional: customize subtitle */
  subtitle?: string;
}

const STATUS_CONFIG = {
  PASSED: {
    bg: 'bg-green-900/20 border-green-700/50 hover:bg-green-900/30',
    Icon: CheckCircle2,
    iconClass: 'text-green-400',
    badge: 'bg-green-500/20 text-green-400 border-green-500/50',
  },
  WARNING: {
    bg: 'bg-yellow-900/20 border-yellow-700/50 hover:bg-yellow-900/30',
    Icon: AlertTriangle,
    iconClass: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  },
  FAILED: {
    bg: 'bg-red-900/20 border-red-700/50 hover:bg-red-900/30',
    Icon: XCircle,
    iconClass: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400 border-red-500/50',
  },
};

const DEMO_PREFIXES = [
  { prefix: 'CLM', type: 'Commercial Auto' },
  { prefix: 'WC', type: "Workers' Compensation" },
  { prefix: 'GL', type: 'General Liability' },
  { prefix: 'CP', type: 'Commercial Property' },
];
const DEMO_ISSUES = ['Missing Approval', 'Incomplete Documentation', 'Payment Limit Exceeded'];

function generateDemoItem(): ActivityItem {
  const statuses: Array<'PASSED' | 'WARNING' | 'FAILED'> = ['PASSED', 'PASSED', 'PASSED', 'WARNING', 'FAILED'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const { prefix, type } = DEMO_PREFIXES[Math.floor(Math.random() * DEMO_PREFIXES.length)];
  const claimNum = Math.floor(Math.random() * 9000) + 1000;
  let details = '';
  if (status === 'FAILED') details = DEMO_ISSUES[Math.floor(Math.random() * DEMO_ISSUES.length)];
  else if (status === 'WARNING') details = 'Minor discrepancy detected';

  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    label: `${prefix}-2025-${claimNum}`,
    type,
    status,
    details,
    duration: (Math.random() * 2 + 1).toFixed(1),
  };
}

export default function LiveActivityFeed({
  initialItems = [],
  intervalMs = 2000,
  maxItems = 10,
  className = '',
  subtitle = 'Real-time updates streaming • New items animate in from the top',
}: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>(() => {
    if (initialItems.length) return initialItems.slice(0, maxItems);
    return Array.from({ length: 5 }, () => ({ ...generateDemoItem(), id: `init-${Math.random()}` }));
  });

  const addItem = useCallback(
    (item: ActivityItem, animate = true) => {
      const withId = { ...item, id: item.id || `activity-${Date.now()}-${Math.random().toString(36).slice(2)}` };
      setActivities((prev) => [withId, ...prev.slice(0, maxItems - 1)]);
    },
    [maxItems]
  );

  useEffect(() => {
    if (intervalMs <= 0) return;
    const id = setInterval(() => {
      addItem(generateDemoItem());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, addItem]);

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
            <h3 className="text-xl font-bold text-white">Live Activity Feed</h3>
          </div>
          <span className="font-mono font-semibold text-slate-300 text-sm">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-2">{subtitle}</p>
      </div>

      {/* Activity List */}
      <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-800 [&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded">
        {activities.map((activity, index) => {
          const config = STATUS_CONFIG[activity.status];
          const Icon = config.Icon;
          return (
            <div
              key={activity.id}
              className={`
                flex items-center gap-4 p-4 rounded-lg border transition-all duration-500
                ${config.bg}
                ${index === 0 ? 'animate-[slideIn_0.5s_ease-out]' : ''}
              `}
            >
              <div className="flex-shrink-0">
                <Icon className={`w-6 h-6 ${config.iconClass}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-white text-sm">{activity.label}</span>
                  {activity.type && (
                    <>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-slate-300 text-xs font-medium">{activity.type}</span>
                    </>
                  )}
                </div>
                {activity.details && (
                  <p className="text-xs text-slate-400 truncate">{activity.details}</p>
                )}
              </div>
              <div className="flex-shrink-0 flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${config.badge}`}
                >
                  {activity.status}
                </span>
                {activity.duration != null && (
                  <span className="text-slate-400 text-xs font-mono">{activity.duration}m</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
