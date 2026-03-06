import { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  TrendingUp,
  FolderOpen,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileOutput,
} from 'lucide-react';

interface Finding {
  id: number;
  name: string;
  desc: string;
  rate: number;
  trend: number;
  files: number;
  flags: number;
  severity: string;
}

interface StateData {
  state: string;
  name: string;
  score: number;
  docs: number;
  timely: number;
  reserves: number;
  notices: number;
  investigation: number;
  payment: number;
  files: number;
  status: 'green' | 'yellow' | 'red';
}

interface CarrierClient {
  name: string;
  score: number;
  files: number;
  states: number;
  topIssue: string;
}

interface TimelinePoint {
  month: string;
  score: number;
}

interface CorrectiveAction {
  date: string;
  action: string;
  impact: string;
}

interface NAICPractice {
  id: number;
  name: string;
  shortName: string;
}

interface CarrierNAICStatus {
  carrierName: string;
  practices: Record<number, 'pass' | 'warn' | 'fail'>;
}

const naicPractices: NAICPractice[] = [
  { id: 1, name: 'Misrepresenting policy provisions', shortName: 'Policy misrepresentation' },
  { id: 2, name: 'Failing to acknowledge claims promptly', shortName: 'Claim acknowledgment' },
  { id: 3, name: 'Failing to affirm/deny coverage within reasonable time', shortName: 'Coverage affirmation' },
  { id: 4, name: 'Failing to provide explanation for denials', shortName: 'Denial explanation' },
  { id: 5, name: 'Failing to provide claim forms', shortName: 'Claim forms' },
  { id: 6, name: 'Failing to adopt investigation standards', shortName: 'Investigation standards' },
  { id: 7, name: 'Refusing to pay without investigation', shortName: 'Payment without investigation' },
  { id: 8, name: 'Not attempting good-faith settlement', shortName: 'Good-faith settlement' },
  { id: 9, name: 'Compelling insureds to litigate', shortName: 'Litigation pressure' },
  { id: 10, name: 'Failing to provide settlement statement', shortName: 'Settlement statement' },
  { id: 11, name: 'Altering applications without consent', shortName: 'Application alteration' },
  { id: 12, name: 'Delaying via duplicate submissions', shortName: 'Duplicate submissions' },
  { id: 13, name: 'Failing to provide prompt settlement when liability clear', shortName: 'Prompt settlement' },
];

const carrierNAICStatus: CarrierNAICStatus[] = [
  { carrierName: 'Hastings Mutual', practices: { 1: 'pass', 2: 'pass', 3: 'pass', 4: 'pass', 5: 'pass', 6: 'warn', 7: 'pass', 8: 'pass', 9: 'pass', 10: 'pass', 11: 'pass', 12: 'pass', 13: 'pass' } },
  { carrierName: 'SECURA Insurance', practices: { 1: 'pass', 2: 'warn', 3: 'pass', 4: 'pass', 5: 'pass', 6: 'pass', 7: 'pass', 8: 'pass', 9: 'pass', 10: 'pass', 11: 'pass', 12: 'warn', 13: 'pass' } },
  { carrierName: 'Acuity Insurance', practices: { 1: 'pass', 2: 'pass', 3: 'pass', 4: 'pass', 5: 'pass', 6: 'pass', 7: 'pass', 8: 'pass', 9: 'pass', 10: 'pass', 11: 'pass', 12: 'pass', 13: 'pass' } },
  { carrierName: 'Penn National', practices: { 1: 'pass', 2: 'pass', 3: 'warn', 4: 'pass', 5: 'pass', 6: 'pass', 7: 'pass', 8: 'pass', 9: 'pass', 10: 'fail', 11: 'pass', 12: 'pass', 13: 'pass' } },
];

const findings: Finding[] = [
  { id: 1, name: 'Documentation Completeness', desc: 'File tells complete story', rate: 94.2, trend: 2.1, files: 1284, flags: 74, severity: 'high' },
  { id: 2, name: 'Timeliness Compliance', desc: 'State-specific deadlines met', rate: 88.7, trend: 4.3, files: 1284, flags: 145, severity: 'high' },
  { id: 3, name: 'Reserve Documentation', desc: 'Rationale documented & current', rate: 82.1, trend: 1.8, files: 892, flags: 160, severity: 'high' },
  { id: 4, name: 'Required Notices Sent', desc: 'All correspondence milestones', rate: 91.5, trend: 3.2, files: 1284, flags: 109, severity: 'medium' },
  { id: 5, name: 'Investigation Adequacy', desc: 'All steps per claim type', rate: 89.3, trend: 2.7, files: 1284, flags: 137, severity: 'medium' },
  { id: 6, name: 'Payment Accuracy', desc: 'Over & under validation', rate: 96.1, trend: 0.8, files: 1108, flags: 43, severity: 'high' },
  { id: 7, name: 'Pattern Detection', desc: 'Adjuster/office anomalies', rate: 97.4, trend: 1.1, files: 1284, flags: 33, severity: 'medium' },
  { id: 8, name: 'File Completeness', desc: 'All required docs present', rate: 85.6, trend: 5.2, files: 1284, flags: 185, severity: 'medium' },
  { id: 9, name: 'Complaint Handling', desc: 'DOI referral response', rate: 93.8, trend: 2.4, files: 312, flags: 19, severity: 'low' },
  { id: 10, name: 'State-Specific Rules', desc: 'Jurisdiction-specific reqs', rate: 90.2, trend: 3.6, files: 1284, flags: 126, severity: 'high' },
];

const stateData: StateData[] = [
  { state: 'CA', name: 'California', score: 87, docs: 92, timely: 85, reserves: 78, notices: 94, investigation: 88, payment: 96, files: 342, status: 'yellow' },
  { state: 'TX', name: 'Texas', score: 93, docs: 96, timely: 91, reserves: 89, notices: 95, investigation: 92, payment: 97, files: 218, status: 'green' },
  { state: 'FL', name: 'Florida', score: 79, docs: 88, timely: 72, reserves: 74, notices: 82, investigation: 78, payment: 93, files: 189, status: 'red' },
  { state: 'NY', name: 'New York', score: 91, docs: 94, timely: 89, reserves: 86, notices: 93, investigation: 91, payment: 95, files: 156, status: 'green' },
  { state: 'IL', name: 'Illinois', score: 95, docs: 97, timely: 94, reserves: 92, notices: 96, investigation: 94, payment: 98, files: 134, status: 'green' },
  { state: 'OH', name: 'Ohio', score: 92, docs: 95, timely: 90, reserves: 88, notices: 94, investigation: 91, payment: 96, files: 98, status: 'green' },
  { state: 'PA', name: 'Pennsylvania', score: 88, docs: 91, timely: 86, reserves: 83, notices: 90, investigation: 87, payment: 95, files: 87, status: 'yellow' },
  { state: 'GA', name: 'Georgia', score: 84, docs: 89, timely: 80, reserves: 79, notices: 87, investigation: 83, payment: 94, files: 60, status: 'yellow' },
];

const carrierClients: CarrierClient[] = [
  { name: 'Hastings Mutual', score: 92, files: 420, states: 6, topIssue: 'Reserve documentation' },
  { name: 'SECURA Insurance', score: 88, files: 380, states: 8, topIssue: 'Timeliness (FL)' },
  { name: 'Acuity Insurance', score: 95, files: 284, states: 5, topIssue: 'None critical' },
  { name: 'Penn National', score: 86, files: 200, states: 12, topIssue: 'State-specific rules' },
];

const timelineData: TimelinePoint[] = [
  { month: 'Sep', score: 78 }, { month: 'Oct', score: 81 }, { month: 'Nov', score: 83 },
  { month: 'Dec', score: 85 }, { month: 'Jan', score: 88 }, { month: 'Feb', score: 91 },
];

const correctiveActions: CorrectiveAction[] = [
  { date: 'Nov 15', action: 'FL timeliness training deployed', impact: '+6% FL compliance' },
  { date: 'Dec 1', action: 'Reserve review SOP updated', impact: '+4% reserve docs' },
  { date: 'Jan 10', action: 'CA notice templates refreshed', impact: '+8% CA notices' },
  { date: 'Feb 1', action: 'WC investigation checklist added', impact: '+5% investigation' },
];

function StatusDot({ status }: { status: 'green' | 'yellow' | 'red' }) {
  const colorClass = status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-red-500';
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colorClass} shadow-sm`} />
  );
}

function ScoreGauge({ score, size = 160, label, showLabelAbove = false, hideOf100 = false }: { score: number; size?: number; label?: string; showLabelAbove?: boolean; hideOf100?: boolean }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const [animated, setAnimated] = useState(0);
  const strokeColor = score >= 90 ? '#22c55e' : score >= 80 ? '#f59e0b' : '#ef4444';
  const isCompact = size <= 56;
  const strokeW = isCompact ? 4 : 8;
  const textSize = isCompact ? 10 : size * 0.2;

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - start) / 1200, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimated(ease * score);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const animatedProgress = (animated / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      {showLabelAbove && label && (
        <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide text-center leading-tight">{label}</span>
      )}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeW} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeW}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - animatedProgress}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke] duration-300"
        />
        <text x={size / 2} y={size / 2 - (isCompact ? 2 : 6)} textAnchor="middle" fill="#111827" fontWeight="700" style={{ fontSize: textSize, fontFamily: 'Inter, sans-serif' }}>
          {Math.round(animated)}
        </text>
        {!isCompact && !hideOf100 && (
          <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="#6b7280" style={{ fontSize: size * 0.08, fontFamily: 'Inter, sans-serif' }}>
            of 100
          </text>
        )}
      </svg>
      {!showLabelAbove && label && <span className="text-neutral-600 text-xs font-medium">{label}</span>}
    </div>
  );
}

function MiniBar({ value, max = 100 }: { value: number; max?: number }) {
  const colorClass = value >= 90 ? 'bg-green-500' : value >= 80 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded bg-neutral-200 overflow-hidden">
        <div
          className={`h-full rounded ${colorClass} transition-all duration-700`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <span className="text-neutral-900 text-xs font-semibold min-w-9 text-right">{value}%</span>
    </div>
  );
}

function TrendLine({ data, width = 200, height = 40 }: { data: TimelinePoint[]; width?: number; height?: number }) {
  const max = Math.max(...data.map((d) => d.score));
  const min = Math.min(...data.map((d) => d.score));
  const range = max - min || 1;
  const padding = 4;
  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (d.score - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = points + ` ${width - padding},${height - padding} ${padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="block">
      <defs>
        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#trendGrad)" />
      <polyline points={points} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OverallReadinessCard({ score, sublabel }: { score: number; sublabel: string }) {
  return (
    <div className="flex-1 min-w-[180px] p-5 rounded-xl bg-gradient-to-br from-green-50 to-white border border-green-200 relative overflow-hidden flex flex-col items-center">
      <span className="absolute top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase tracking-wide">
        LIVE
      </span>
      <div className="text-sm font-medium text-neutral-600 mb-2 flex items-center gap-1.5">
        <Shield className="w-4 h-4 text-green-600" /> Overall Readiness
      </div>
      <ScoreGauge score={score} size={80} hideOf100 />
      {sublabel && <div className="text-sm text-neutral-500 mt-1.5 text-center">{sublabel}</div>}
    </div>
  );
}

function KPICard({
  icon,
  value,
  label,
  sublabel,
  color,
  badge,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel?: string;
  color: 'green' | 'blue' | 'primary' | 'orange';
  badge?: string;
}) {
  const colorMap = {
    green: 'from-green-50 to-white border-green-200',
    blue: 'from-blue-50 to-white border-blue-200',
    primary: 'from-primary-50 to-white border-blue-200',
    orange: 'from-orange-50 to-white border-orange-200',
  };
  const badgeColorMap = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    primary: 'bg-primary-100 text-primary-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <div
      className={`flex-1 min-w-[180px] p-5 rounded-xl bg-gradient-to-br ${colorMap[color]} border relative overflow-hidden`}
    >
      {badge && (
        <span className={`absolute top-2.5 right-3 text-[10px] font-bold px-2 py-0.5 rounded ${badgeColorMap[color]} uppercase tracking-wide`}>
          {badge}
        </span>
      )}
      <div className="text-sm font-medium text-neutral-600 mb-2 flex items-center gap-1.5">
        <span className="text-base">{icon}</span> {label}
      </div>
      <div className="text-3xl font-bold text-neutral-900 tracking-tight">{value}</div>
      {sublabel && <div className="text-sm text-neutral-500 mt-1.5">{sublabel}</div>}
    </div>
  );
}

function ExamExposureCalc({ findingRate, filesExamined = 200 }: { findingRate: number; filesExamined?: number }) {
  const filesWithFindings = Math.round(filesExamined * (findingRate / 100));
  const finePerViolation = 5000;
  const estimatedFines = filesWithFindings * finePerViolation;
  const remediationLow = 500000;
  const remediationHigh = 2000000;

  return (
    <div className="p-5 rounded-xl bg-white border border-neutral-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <span className="text-neutral-900 font-semibold">Exam Exposure Estimate</span>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded bg-orange-100 text-orange-600 font-semibold">
          IF EXAMINED TODAY
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-neutral-500 text-xs mb-1">Est. Finding Rate</div>
          <div
            className={`text-xl font-bold ${
              findingRate > 15 ? 'text-red-600' : findingRate > 10 ? 'text-amber-600' : 'text-green-600'
            }`}
          >
            {findingRate.toFixed(1)}%
          </div>
          <div className="text-neutral-500 text-xs">{filesWithFindings} of {filesExamined} files</div>
        </div>
        <div>
          <div className="text-neutral-500 text-xs mb-1">Est. Fine Exposure</div>
          <div className="text-xl font-bold text-orange-600">
            ${(estimatedFines / 1000).toFixed(0)}K
          </div>
          <div className="text-neutral-500 text-xs">@ $5,000/violation avg</div>
        </div>
        <div>
          <div className="text-neutral-500 text-xs mb-1">Est. Total Exposure</div>
          <div className="text-xl font-bold text-red-600">
            ${((estimatedFines + remediationLow) / 1000000).toFixed(1)}M–${((estimatedFines + remediationHigh) / 1000000).toFixed(1)}M
          </div>
          <div className="text-neutral-500 text-xs">Fines + remediation + legal</div>
        </div>
      </div>
    </div>
  );
}

export default function MarketConductTab() {
  const [activeView, setActiveView] = useState<'readiness' | 'findings' | 'states' | 'timeline'>('readiness');
  const [selectedCarrier, setSelectedCarrier] = useState('all');
  const [selectedCarrierForChecklist, setSelectedCarrierForChecklist] = useState<string | null>(carrierClients[0]?.name ?? null);
  const [examMode, setExamMode] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredFinding, setHoveredFinding] = useState<number | null>(null);

  const overallScore = 91;
  const avgFindingRate = 100 - findings.reduce((a, f) => a + f.rate, 0) / findings.length;

  const tabs = [
    { id: 'readiness' as const, label: 'Readiness Overview', icon: Shield },
    { id: 'findings' as const, label: 'Top 10 Findings', icon: ClipboardList },
    { id: 'states' as const, label: 'State Compliance', icon: MapPin },
    { id: 'timeline' as const, label: 'Trend & Corrections', icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col min-w-0">
      {/* Top Header */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 m-0">Market Conduct Readiness</h2>
          <p className="text-sm text-neutral-600 mt-1 mb-0">
            Continuous exam preparedness · Aligned to NAIC Unfair Claims Settlement Practices Act
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedCarrier}
            onChange={(e) => setSelectedCarrier(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 bg-white text-neutral-900 text-sm cursor-pointer outline-none"
          >
            <option value="all">All Carrier Clients</option>
            {carrierClients.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setExamMode(!examMode)}
            className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              examMode
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white text-neutral-600 border-neutral-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${examMode ? 'bg-red-500' : 'bg-neutral-400'}`} />
            {examMode ? 'EXAM ACTIVE' : 'Exam Mode'}
          </button>

          <button className="px-5 py-2 rounded-lg border-none bg-primary-600 text-white text-sm font-semibold cursor-pointer flex items-center gap-1.5 shadow-md hover:bg-primary-700 transition-colors">
            <FileOutput className="w-4 h-4" />
            Generate Report
          </button>

          <div className="px-3.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 text-xs flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-green-600" />
            Connected to: Guidewire ClaimCenter
          </div>
        </div>
      </div>

      {/* Exam Mode Banner */}
      {examMode && (
        <div className="py-2.5 px-0 mb-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-red-600 font-semibold text-sm">EXAM DEFENSE MODE ACTIVE</span>
            <span className="text-neutral-600 text-xs">
              — Generating documentation trail for all files in examination scope
            </span>
          </div>
          <span className="text-neutral-500 text-xs">Scope: FL Commercial Auto · Period: 2024-2025 · 189 files</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 pt-3 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2.5 border-none cursor-pointer bg-transparent text-sm font-medium flex items-center gap-1.5 transition-all -mb-px ${
              activeView === tab.id
                ? 'text-neutral-900 border-b-2 border-primary-600'
                : 'text-neutral-600 border-b-2 border-transparent'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pt-6 space-y-6">
        {/* READINESS OVERVIEW */}
        {activeView === 'readiness' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <OverallReadinessCard score={overallScore} sublabel="↑ 13 pts since September" />
              <KPICard
                icon={<FolderOpen className="w-4 h-4 text-blue-600" />}
                value="1,284"
                label="Files Under Surveillance"
                sublabel="100% coverage · All LOBs"
                color="blue"
              />
              <KPICard
                icon={<MapPin className="w-4 h-4 text-primary-600" />}
                value="8 States"
                label="Jurisdictions Monitored"
                sublabel="142 state-specific rules active"
                color="primary"
              />
              <KPICard
                icon={<ClipboardList className="w-4 h-4 text-orange-600" />}
                value="24"
                label="Exam Criteria Tracked"
                sublabel="Mapped to NAIC + state regs"
                color="orange"
              />
              <KPICard
                icon={<CheckCircle2 className="w-4 h-4 text-green-600" />}
                value="47 days"
                label="Since Critical Violation"
                sublabel="Last: FL timeliness · Jan 11"
                color="green"
              />
            </div>

            <ExamExposureCalc findingRate={avgFindingRate} />

            {/* Two-column: Compact carrier table (left) + NAIC 13 checklist (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,400px)_1fr] gap-6">
              {/* Left: Compact carrier table */}
              <div className="p-6 rounded-xl bg-white border border-neutral-200 max-w-full">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">Carrier Client Compliance</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Per-client readiness for TPA reporting</div>
                  </div>
                  <div className="flex gap-1 p-0.5 rounded-lg bg-slate-50 border border-neutral-200">
                    {['By Client', 'By LOB', 'By Region'].map((v) => (
                      <span
                        key={v}
                        className={`px-3 py-1 rounded-md text-xs cursor-pointer ${
                          v === 'By Client' ? 'bg-primary-600 text-white font-semibold' : 'text-neutral-600'
                        }`}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 px-3 py-2 text-[10px] font-semibold text-neutral-500 uppercase tracking-wide">
                    <span>Carrier</span>
                    <span className="text-center w-14">Score</span>
                    <span>Top Issue</span>
                    <span></span>
                  </div>
                  {carrierClients.map((client) => (
                    <div
                      key={client.name}
                      onClick={() => setSelectedCarrierForChecklist(client.name)}
                      className={`grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCarrierForChecklist === client.name
                          ? 'bg-primary-50 border-primary-200'
                          : 'bg-slate-50 border-neutral-200 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{client.name}</div>
                        <div className="text-xs text-neutral-500">
                          {client.files} files · {client.states} states
                        </div>
                      </div>
                      <div className="flex justify-center w-14">
                        <ScoreGauge score={client.score} size={44} />
                      </div>
                      <div className="text-xs text-neutral-500">
                        Top issue:{' '}
                        <span className={client.topIssue === 'None critical' ? 'text-green-600' : 'text-amber-600'}>
                          {client.topIssue}
                        </span>
                      </div>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="px-2 py-1 rounded border border-neutral-200 bg-transparent text-neutral-600 text-xs cursor-pointer hover:bg-neutral-100 transition-colors flex items-center gap-1"
                      >
                        <FileOutput className="w-3 h-3" />
                        Export
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: NAIC 13 Prohibited Practices checklist */}
              <div className="p-6 rounded-xl bg-white border border-neutral-200 min-w-0">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">NAIC 13 Prohibited Practices</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {selectedCarrierForChecklist
                        ? `Exam defense posture for ${selectedCarrierForChecklist}`
                        : 'Select a carrier to view compliance status'}
                    </div>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" /> Compliant
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" /> At risk
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" /> Violation
                    </span>
                  </div>
                </div>

                {selectedCarrierForChecklist ? (
                  <div className="space-y-2">
                    {naicPractices.map((practice) => {
                      const status = carrierNAICStatus.find((c) => c.carrierName === selectedCarrierForChecklist)?.practices[practice.id] ?? 'pass';
                      const statusClass = status === 'pass' ? 'bg-green-100 text-green-700' : status === 'warn' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
                      const dotClass = status === 'pass' ? 'bg-green-500' : status === 'warn' ? 'bg-amber-500' : 'bg-red-500';
                      return (
                        <div
                          key={practice.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 border border-neutral-100"
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotClass}`} />
                          <span className="text-sm text-neutral-900 flex-1 min-w-0">{practice.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${statusClass}`}>
                            {status === 'pass' ? 'Compliant' : status === 'warn' ? 'At risk' : 'Violation'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500 text-sm">
                    <ClipboardList className="w-10 h-10 mb-3 opacity-50" />
                    <p>Select a carrier from the table to view their NAIC 13 compliance status</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary-50/50 border border-blue-200 flex items-center gap-4">
              <span className="text-2xl">💬</span>
              <div>
                <div className="text-sm text-neutral-900 font-medium leading-relaxed italic">
                  &quot;The #1 exam finding is never that the decision was wrong — it&apos;s that you can&apos;t prove it was right.
                  GLIF monitors every file against the same checklist examiners use. When they open your file, it&apos;s already been audited.&quot;
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TOP 10 FINDINGS */}
        {activeView === 'findings' && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-base font-semibold text-neutral-900">Top 10 Exam Findings Tracker</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Mapped to NAIC Market Regulation Handbook exam criteria
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> ≥90%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 80-89%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &lt;80%
                </span>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-neutral-200">
              <div className="grid grid-cols-[40px_1fr_100px_100px_80px_80px_140px] gap-3 px-5 py-3 bg-neutral-100 text-neutral-500 text-xs font-semibold uppercase tracking-wider">
                <span>#</span>
                <span>Finding Category</span>
                <span className="text-right">Compliance</span>
                <span className="text-right">30d Trend</span>
                <span className="text-right">Files</span>
                <span className="text-right">Flags</span>
                <span>Status</span>
              </div>
              {findings.map((f) => (
                <div
                  key={f.id}
                  onMouseEnter={() => setHoveredFinding(f.id)}
                  onMouseLeave={() => setHoveredFinding(null)}
                  className={`grid grid-cols-[40px_1fr_100px_100px_80px_80px_140px] gap-3 px-5 py-3.5 items-center border-t border-neutral-200 cursor-pointer transition-colors ${
                    hoveredFinding === f.id ? 'bg-neutral-50' : 'bg-white'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      f.rate >= 90 ? 'bg-green-100 text-green-600' : f.rate >= 80 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {f.id}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{f.name}</div>
                    <div className="text-xs text-neutral-500">{f.desc}</div>
                  </div>
                  <div className="text-right">
                    <MiniBar value={f.rate} />
                  </div>
                  <div className="text-right text-green-600 text-sm font-semibold">+{f.trend}%</div>
                  <div className="text-right text-neutral-600 text-sm">{f.files.toLocaleString()}</div>
                  <div className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        f.flags > 150 ? 'bg-red-100 text-red-600' : f.flags > 100 ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {f.flags}
                    </span>
                  </div>
                  <MiniBar value={f.rate} />
                </div>
              ))}
            </div>

            <ExamExposureCalc findingRate={avgFindingRate} />
          </div>
        )}

        {/* STATE COMPLIANCE */}
        {activeView === 'states' && (
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-base font-semibold text-neutral-900">Multi-State Compliance Matrix</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  State-specific rule compliance · {stateData.reduce((a, s) => a + s.files, 0).toLocaleString()} files across {stateData.length} jurisdictions
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-neutral-200">
              <div className="grid grid-cols-[140px_80px_1fr_1fr_1fr_1fr_1fr_1fr_80px] gap-0 px-4 py-3 bg-neutral-100 text-neutral-500 text-[10px] font-semibold uppercase tracking-wider">
                <span>Jurisdiction</span>
                <span className="text-center">Score</span>
                <span className="text-center">Docs</span>
                <span className="text-center">Timely</span>
                <span className="text-center">Reserves</span>
                <span className="text-center">Notices</span>
                <span className="text-center">Invest.</span>
                <span className="text-center">Payment</span>
                <span className="text-center">Files</span>
              </div>
              {stateData.map((s) => (
                <div
                  key={s.state}
                  onClick={() => setSelectedState(selectedState === s.state ? null : s.state)}
                  className={`grid grid-cols-[140px_80px_1fr_1fr_1fr_1fr_1fr_1fr_80px] gap-0 px-4 py-3 items-center border-t border-neutral-200 cursor-pointer transition-colors ${
                    selectedState === s.state ? 'bg-neutral-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <StatusDot status={s.status} />
                    <div>
                      <span className="text-sm font-semibold text-neutral-900">{s.state}</span>
                      <span className="text-xs text-neutral-500 ml-1.5">{s.name}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-sm font-bold ${
                        s.score >= 90 ? 'bg-green-100 text-green-600' : s.score >= 80 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {s.score}
                    </span>
                  </div>
                  {[s.docs, s.timely, s.reserves, s.notices, s.investigation, s.payment].map((val, i) => {
                    const colorClass = val >= 90 ? 'bg-green-100 text-green-600' : val >= 80 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600';
                    return (
                      <div key={i} className="text-center">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${colorClass}`}>
                          {val}%
                        </span>
                      </div>
                    );
                  })}
                  <div className="text-center text-neutral-600 text-xs">{s.files}</div>
                </div>
              ))}
            </div>

            {selectedState && (() => {
              const s = stateData.find((st) => st.state === selectedState);
              if (!s) return null;
              const deadlineItems = [
                {
                  action: 'Acknowledge Claim',
                  deadline: s.state === 'CA' ? '15 days' : s.state === 'FL' ? '14 days' : s.state === 'TX' ? '15 bus. days' : '15 days',
                  compliance: s.timely + 2,
                },
                {
                  action: 'Begin Investigation',
                  deadline: s.state === 'CA' ? 'Immediately' : s.state === 'FL' ? '10 days' : '15 days',
                  compliance: s.investigation,
                },
                {
                  action: 'Accept/Deny',
                  deadline: s.state === 'CA' ? '40 days' : s.state === 'FL' ? '90 days' : s.state === 'TX' ? '15 bus. days' : '30 bus. days',
                  compliance: s.timely,
                },
                {
                  action: 'Pay After Accept',
                  deadline: s.state === 'CA' ? '30 days' : s.state === 'FL' ? '20 days' : s.state === 'TX' ? '5 bus. days' : 'Promptly',
                  compliance: s.payment,
                },
              ];
              return (
                <div className="p-6 rounded-xl bg-white border border-neutral-200">
                  <div className="text-base font-semibold text-neutral-900 mb-4">
                    {s.name} — Timeliness Requirements
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {deadlineItems.map((item) => (
                      <div
                        key={item.action}
                        className="p-4 rounded-lg bg-slate-50 border border-neutral-200"
                      >
                        <div className="text-xs text-neutral-500 mb-1.5">{item.action}</div>
                        <div className="text-base font-bold text-neutral-900 mb-1">{item.deadline}</div>
                        <MiniBar value={Math.min(item.compliance, 100)} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TREND & CORRECTIONS */}
        {activeView === 'timeline' && (
          <div className="flex flex-col gap-5">
            <div className="text-base font-semibold text-neutral-900">Readiness Trend & Corrective Actions</div>

            <div className="p-6 rounded-xl bg-white border border-neutral-200">
              <div className="flex justify-between items-center mb-5">
                <div className="text-sm font-semibold text-neutral-900">Readiness Score Over Time</div>
                <div className="flex gap-2">
                  {['30d', '60d', '90d', '6mo'].map((p) => (
                    <span
                      key={p}
                      className={`px-3 py-1 rounded-md text-xs cursor-pointer border ${
                        p === '6mo' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-neutral-600 border-neutral-200'
                      }`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <TrendLine data={timelineData} width={900} height={120} />
              <div className="flex justify-between pt-2 px-1">
                {timelineData.map((d) => (
                  <div key={d.month} className="text-center">
                    <div className="text-xs text-neutral-500">{d.month}</div>
                    <div className="text-xs text-neutral-900 font-semibold">{d.score}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-xl bg-white border border-neutral-200">
              <div className="text-sm font-semibold text-neutral-900 mb-4">Corrective Actions & Impact</div>
              <div className="relative pl-7">
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-neutral-200" />
                {correctiveActions.map((action, i) => (
                  <div key={i} className="relative mb-5 pl-5">
                    <div className="absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-primary-600 border-2 border-slate-50" />
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs text-neutral-500 mb-0.5">{action.date}</div>
                        <div className="text-sm text-neutral-900 font-medium">{action.action}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-600">
                        {action.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-xl text-center bg-red-50 border border-red-200">
                <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">Without GLIF</div>
                <div className="text-2xl font-bold text-red-600">$400K–$5M+</div>
                <div className="text-xs text-neutral-600 mt-1">Exam prep scramble · Fines · Remediation · Legal</div>
                <div className="text-xs text-neutral-500 mt-2">Based on 40% finding rate · 200 files examined</div>
              </div>
              <div className="p-6 rounded-xl text-center bg-green-50 border border-green-200">
                <div className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-2">With GLIF AudRI</div>
                <div className="text-2xl font-bold text-green-600">Continuous Readiness</div>
                <div className="text-xs text-neutral-600 mt-1">100% file coverage · Real-time compliance · Proof on demand</div>
                <div className="text-xs text-neutral-500 mt-2">Target finding rate: &lt;10% · Documented corrective actions</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
