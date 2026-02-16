import { useState } from "react";

const COLORS = {
  navy: "#0f1a2e",
  deepBlue: "#1e3a8a",
  accentBlue: "#3b82f6",
  electricBlue: "#60a5fa",
  surface: "#111827",
  card: "#1a2332",
  cardHover: "#1f2b3d",
  border: "#2a3a52",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  success: "#10b981",
  successBg: "rgba(16,185,129,0.1)",
  error: "#ef4444",
  errorBg: "rgba(239,68,68,0.1)",
  warning: "#f59e0b",
  warningBg: "rgba(245,158,11,0.1)",
  info: "#3b82f6",
  infoBg: "rgba(59,130,246,0.1)",
};

// --- Mock Data ---
const auditFindings = [
  {
    id: "FND-2025-0847",
    rule: "Racing Exclusion Check",
    ruleId: "AC-EXC-003",
    category: "Coverage Exclusions",
    status: "fail",
    confidence: 0.94,
    severity: "critical",
    claim: "CLM-2025-1192",
    policyHolder: "James T. Morrison",
    summary: "Claim description mentions vehicle was participating in an organized time-trial event. Racing exclusion clause applies under Section 4.2(b).",
    model: "claude-sonnet-4-20250514",
    modelLabel: "Claude Sonnet 4",
    promptTokens: 3842,
    responseTokens: 1206,
    latency: "2.3s",
    timestamp: "2025-02-04T14:32:18Z",
    evidenceAnchors: [
      {
        docName: "Claim-CLM-2025-1192.pdf",
        page: 2,
        paragraph: "4",
        excerpt: "...vehicle was entered in a sanctioned quarter-mile time-trial at Midwest Raceway on January 18, 2025. The claimant states the incident occurred during the second qualifying run...",
        relevance: 0.97,
      },
      {
        docName: "AutoPolicy-SOP-2025.pdf",
        page: 8,
        paragraph: "12",
        excerpt: "...coverage shall not apply to any loss arising from the insured vehicle's participation in racing, speed contests, demolition contests, or timed events of any kind...",
        relevance: 0.99,
      },
    ],
    reasoning: `1. Extracted claim narrative from CLM-2025-1192 (page 2, para 4).
2. Identified key phrase: "sanctioned quarter-mile time-trial" — this constitutes a timed competitive event.
3. Cross-referenced with AutoPolicy-SOP-2025, Section 4.2(b) — Racing & Speed Contest Exclusion.
4. SOP explicitly excludes "timed events of any kind" from coverage.
5. Conclusion: Claim involves a timed racing event → exclusion applies → FAIL.`,
    humanActions: [
      { user: "Sarah Chen", role: "Sr. Claims Auditor", action: "Confirmed", timestamp: "2025-02-04T15:10:00Z", note: "AI finding is correct. Escalating to claims manager for denial review." },
    ],
  },
  {
    id: "FND-2025-0848",
    rule: "Prompt Notification (≤72 hrs)",
    ruleId: "AC-DTY-001",
    category: "Duties Compliance",
    status: "pass",
    confidence: 0.98,
    severity: "low",
    claim: "CLM-2025-1193",
    policyHolder: "Rebecca S. Whitfield",
    summary: "Claimant notified carrier within 18 hours of the loss event. Well within the 72-hour SOP requirement.",
    model: "claude-sonnet-4-20250514",
    modelLabel: "Claude Sonnet 4",
    promptTokens: 2105,
    responseTokens: 487,
    latency: "1.1s",
    timestamp: "2025-02-04T14:33:02Z",
    evidenceAnchors: [
      {
        docName: "Claim-CLM-2025-1193.pdf",
        page: 1,
        paragraph: "2",
        excerpt: "...loss occurred at approximately 3:15 PM on January 22, 2025. First notice of loss was received via online portal at 9:42 AM on January 23, 2025...",
        relevance: 0.96,
      },
    ],
    reasoning: `1. Extracted loss date/time: January 22, 2025, 3:15 PM.
2. Extracted FNOL timestamp: January 23, 2025, 9:42 AM.
3. Calculated elapsed time: ~18.5 hours.
4. SOP threshold: 72 hours (3 days).
5. 18.5 hrs < 72 hrs → PASS.`,
    humanActions: [],
  },
  {
    id: "FND-2025-0849",
    rule: "Policy Limit Verification",
    ruleId: "AC-LIM-002",
    category: "Policy Limits",
    status: "warning",
    confidence: 0.72,
    severity: "medium",
    claim: "CLM-2025-1194",
    policyHolder: "Apex Fleet Services LLC",
    summary: "Claim reserve of $485,000 approaches the per-accident limit of $500,000. Unable to confirm if additional claimants may push total beyond limit. Routed for human review.",
    model: "claude-sonnet-4-20250514",
    modelLabel: "Claude Sonnet 4",
    promptTokens: 4210,
    responseTokens: 892,
    latency: "1.8s",
    timestamp: "2025-02-04T14:34:15Z",
    evidenceAnchors: [
      {
        docName: "Claim-CLM-2025-1194.pdf",
        page: 3,
        paragraph: "7",
        excerpt: "...current total reserve established at $485,000 across three claimants. Adjuster notes indicate a fourth party may file a supplemental claim...",
        relevance: 0.91,
      },
      {
        docName: "Policy-APX-2025-FL.pdf",
        page: 5,
        paragraph: "3",
        excerpt: "...combined single limit of $500,000 per accident for bodily injury and property damage...",
        relevance: 0.95,
      },
    ],
    reasoning: `1. Extracted current reserve: $485,000 across 3 claimants.
2. Extracted per-accident CSL: $500,000.
3. Reserve is 97% of limit — within threshold but not exceeded.
4. Adjuster notes mention potential 4th claimant — could push over limit.
5. Confidence reduced due to uncertainty about additional claimant.
6. Conclusion: WARNING — requires human review for limit adequacy.`,
    humanActions: [
      { user: "Michael Torres", role: "Claims QA Manager", action: "Under Review", timestamp: "2025-02-04T16:20:00Z", note: "Requesting adjuster update on 4th claimant status before final determination." },
    ],
  },
];

const ledgerEntries = [
  { time: "14:32:18", event: "AI Analysis", detail: "GREAT Engine processed CLM-2025-1192 against 14 rules", icon: "🤖" },
  { time: "14:32:20", event: "Finding Created", detail: "FND-2025-0847 — Racing Exclusion violation detected (94% confidence)", icon: "🔴" },
  { time: "14:33:02", event: "AI Analysis", detail: "GREAT Engine processed CLM-2025-1193 against 14 rules", icon: "🤖" },
  { time: "14:33:03", event: "Finding Created", detail: "FND-2025-0848 — Prompt Notification passed (98% confidence)", icon: "🟢" },
  { time: "14:34:15", event: "AI Analysis", detail: "GREAT Engine processed CLM-2025-1194 against 14 rules", icon: "🤖" },
  { time: "14:34:17", event: "Finding Created", detail: "FND-2025-0849 — Policy Limit warning, routed to human review", icon: "🟡" },
  { time: "15:10:00", event: "Human Action", detail: "Sarah Chen confirmed FND-0847 — escalated for denial review", icon: "👤" },
  { time: "16:20:00", event: "Human Action", detail: "Michael Torres flagged FND-0849 — requesting adjuster update", icon: "👤" },
];

// --- Components ---
function StatusBadge({ status }) {
  const config = {
    pass: { label: "PASS", bg: COLORS.successBg, color: COLORS.success, border: COLORS.success },
    fail: { label: "FAIL", bg: COLORS.errorBg, color: COLORS.error, border: COLORS.error },
    warning: { label: "WARNING", bg: COLORS.warningBg, color: COLORS.warning, border: COLORS.warning },
  };
  const c = config[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 1, background: c.bg, color: c.color, border: `1px solid ${c.border}30`, fontFamily: "'JetBrains Mono', monospace" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c.color, boxShadow: `0 0 8px ${c.color}60` }} />
      {c.label}
    </span>
  );
}

function SeverityDot({ severity }) {
  const colors = { critical: COLORS.error, medium: COLORS.warning, low: COLORS.success };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors[severity] }} />
      {severity}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? COLORS.success : pct >= 75 ? COLORS.warning : COLORS.error;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: `${color}20` }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'JetBrains Mono', monospace", minWidth: 40 }}>{pct}%</span>
    </div>
  );
}

function EvidenceCard({ anchor, index }) {
  return (
    <div style={{ background: "rgba(59,130,246,0.05)", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: COLORS.accentBlue, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}>
            SRC {index + 1}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.electricBlue }}>{anchor.docName}</span>
        </div>
        <span style={{ fontSize: 10, color: COLORS.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
          p.{anchor.page} ¶{anchor.paragraph} · relevance: {Math.round(anchor.relevance * 100)}%
        </span>
      </div>
      <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, borderLeft: `3px solid ${COLORS.accentBlue}40`, paddingLeft: 12, fontStyle: "italic" }}>
        "{anchor.excerpt}"
      </div>
    </div>
  );
}

function FindingDetail({ finding }) {
  const [activeTab, setActiveTab] = useState("evidence");
  const tabs = [
    { id: "evidence", label: "Evidence Anchors", icon: "📎" },
    { id: "reasoning", label: "AI Reasoning", icon: "🧠" },
    { id: "provenance", label: "Decision Provenance", icon: "🔗" },
    { id: "human", label: "Human Actions", icon: "👤" },
  ];

  return (
    <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: COLORS.textDim }}>{finding.id}</span>
            <StatusBadge status={finding.status} />
            <SeverityDot severity={finding.severity} />
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.text, fontFamily: "'DM Sans', sans-serif" }}>{finding.rule}</h3>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>{finding.summary}</p>
        </div>
        <div style={{ textAlign: "right", minWidth: 140 }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>Confidence</div>
          <ConfidenceBar value={finding.confidence} />
        </div>
      </div>

      {/* Meta row */}
      <div style={{ padding: "12px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", gap: 28, flexWrap: "wrap", background: "rgba(0,0,0,0.15)" }}>
        {[
          { label: "Claim", value: finding.claim },
          { label: "Policy Holder", value: finding.policyHolder },
          { label: "Rule ID", value: finding.ruleId },
          { label: "Category", value: finding.category },
        ].map((m, i) => (
          <div key={i}>
            <div style={{ fontSize: 9, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 12, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}` }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: "12px 16px", background: activeTab === tab.id ? "rgba(59,130,246,0.08)" : "transparent",
              border: "none", borderBottom: activeTab === tab.id ? `2px solid ${COLORS.accentBlue}` : "2px solid transparent",
              color: activeTab === tab.id ? COLORS.electricBlue : COLORS.textDim,
              fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span>{tab.icon}</span> {tab.label}
            {tab.id === "human" && finding.humanActions.length > 0 && (
              <span style={{ background: COLORS.accentBlue, color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 8, marginLeft: 4 }}>
                {finding.humanActions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: "20px 24px" }}>
        {activeTab === "evidence" && (
          <div>
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 0, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
              Document passages used for this determination
            </p>
            {finding.evidenceAnchors.map((a, i) => <EvidenceCard key={i} anchor={a} index={i} />)}
          </div>
        )}

        {activeTab === "reasoning" && (
          <div>
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 0, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
              Chain-of-thought reasoning captured from LLM
            </p>
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {finding.reasoning}
            </div>
          </div>
        )}

        {activeTab === "provenance" && (
          <div>
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 0, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
              Full decision lineage and model metadata
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Model", value: finding.modelLabel, sub: finding.model },
                { label: "Timestamp", value: new Date(finding.timestamp).toLocaleString(), sub: "UTC-8" },
                { label: "Prompt Tokens", value: finding.promptTokens.toLocaleString(), sub: "input" },
                { label: "Response Tokens", value: finding.responseTokens.toLocaleString(), sub: "output" },
                { label: "Latency", value: finding.latency, sub: "end-to-end" },
                { label: "Rule Version", value: "v2.4.1", sub: "GREAT 1.0 ruleset" },
                { label: "Documents Analyzed", value: finding.evidenceAnchors.length.toString(), sub: "source files" },
                { label: "Ledger Hash", value: "0x7a3f...c2d1", sub: "immutable record" },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(0,0,0,0.15)", borderRadius: 8, padding: "12px 14px", border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 9, color: COLORS.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "human" && (
          <div>
            <p style={{ fontSize: 11, color: COLORS.textDim, marginTop: 0, marginBottom: 14, textTransform: "uppercase", letterSpacing: 1 }}>
              Human-in-the-loop review actions
            </p>
            {finding.humanActions.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: COLORS.textDim, fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                No human review actions yet. Finding is pending review.
              </div>
            ) : (
              finding.humanActions.map((ha, i) => (
                <div key={i} style={{ background: "rgba(59,130,246,0.05)", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accentBlue}, ${COLORS.deepBlue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                        {ha.user.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{ha.user}</div>
                        <div style={{ fontSize: 10, color: COLORS.textDim }}>{ha.role}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                        background: ha.action === "Confirmed" ? COLORS.successBg : COLORS.warningBg,
                        color: ha.action === "Confirmed" ? COLORS.success : COLORS.warning,
                        border: `1px solid ${ha.action === "Confirmed" ? COLORS.success : COLORS.warning}30`,
                      }}>
                        {ha.action.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 10, color: COLORS.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
                        {new Date(ha.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5, borderLeft: `3px solid ${COLORS.accentBlue}40`, paddingLeft: 12, marginLeft: 42 }}>
                    {ha.note}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main App ---
export default function AuditTrailPage() {
  const [selectedFinding, setSelectedFinding] = useState(0);
  const [showLedger, setShowLedger] = useState(true);

  const stats = [
    { label: "Findings Today", value: "47", icon: "🔍", color: COLORS.accentBlue },
    { label: "AI Processed", value: "312", icon: "🤖", sub: "claims", color: COLORS.electricBlue },
    { label: "Human Reviewed", value: "23", icon: "👤", sub: "of 47", color: COLORS.success },
    { label: "Avg Confidence", value: "91%", icon: "📊", color: COLORS.warning },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(170deg, ${COLORS.navy} 0%, ${COLORS.surface} 40%, #0c111b 100%)`,
      fontFamily: "'DM Sans', sans-serif",
      color: COLORS.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>

      {/* Top bar */}
      <div style={{
        padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${COLORS.border}`, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `linear-gradient(135deg, ${COLORS.accentBlue}, ${COLORS.deepBlue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.5,
          }}>G</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text, letterSpacing: -0.3 }}>GLIF AuditOversight</div>
            <div style={{ fontSize: 10, color: COLORS.textDim, letterSpacing: 1, textTransform: "uppercase" }}>AI Audit Trail · Powered by GREAT 1.0</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 11, color: COLORS.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
            Feb 4, 2025 · Auto Claims Validation
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: COLORS.successBg, border: `1px solid ${COLORS.success}30` }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.success, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.success }}>Engine Live</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24, animation: "fadeInUp 0.4s ease" }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: COLORS.card, borderRadius: 10, padding: "16px 20px",
              border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content: two columns */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, animation: "fadeInUp 0.5s ease" }}>
          {/* Left: Findings list + Ledger */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Findings list */}
            <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Recent Findings</span>
                <span style={{ fontSize: 11, color: COLORS.textDim }}>{auditFindings.length} items</span>
              </div>
              {auditFindings.map((f, i) => (
                <div
                  key={f.id}
                  onClick={() => setSelectedFinding(i)}
                  style={{
                    padding: "14px 18px", cursor: "pointer",
                    borderBottom: i < auditFindings.length - 1 ? `1px solid ${COLORS.border}` : "none",
                    background: selectedFinding === i ? "rgba(59,130,246,0.08)" : "transparent",
                    borderLeft: selectedFinding === i ? `3px solid ${COLORS.accentBlue}` : "3px solid transparent",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: COLORS.textDim }}>{f.id}</span>
                    <StatusBadge status={f.status} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>{f.rule}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim }}>{f.claim} · {f.policyHolder}</div>
                </div>
              ))}
            </div>

            {/* Immutable Ledger */}
            <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: "hidden" }}>
              <div
                onClick={() => setShowLedger(!showLedger)}
                style={{ padding: "14px 18px", borderBottom: showLedger ? `1px solid ${COLORS.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text }}>Immutable Audit Ledger</span>
                </div>
                <span style={{ fontSize: 11, color: COLORS.textDim, transform: showLedger ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▼</span>
              </div>
              {showLedger && (
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {ledgerEntries.map((e, i) => (
                    <div key={i} style={{ padding: "10px 18px", display: "flex", gap: 12, borderBottom: `1px solid ${COLORS.border}20`, fontSize: 11 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.textDim, whiteSpace: "nowrap", minWidth: 55 }}>{e.time}</span>
                      <span style={{ fontSize: 14, lineHeight: 1 }}>{e.icon}</span>
                      <div>
                        <div style={{ fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{e.event}</div>
                        <div style={{ color: COLORS.textDim, lineHeight: 1.4 }}>{e.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Finding detail */}
          <div>
            <FindingDetail finding={auditFindings[selectedFinding]} />

            {/* Regulatory export bar */}
            <div style={{
              marginTop: 16, background: COLORS.card, borderRadius: 10, border: `1px solid ${COLORS.border}`,
              padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>Regulatory Export Ready</div>
                  <div style={{ fontSize: 10, color: COLORS.textDim }}>DOI Market Conduct · SOX 404 · NAIC Model Audit Rule compliant format</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {["Export PDF", "Export JSON", "Full Trail CSV"].map((btn, i) => (
                  <button key={i} style={{
                    padding: "7px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                    background: i === 0 ? COLORS.accentBlue : "transparent",
                    color: i === 0 ? "#fff" : COLORS.textDim,
                    border: i === 0 ? "none" : `1px solid ${COLORS.border}`,
                    transition: "all 0.15s",
                  }}>
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            {/* Model version note */}
            <div style={{
              marginTop: 12, padding: "12px 20px", borderRadius: 8,
              background: "rgba(59,130,246,0.04)", border: `1px solid ${COLORS.border}`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 14 }}>🔄</span>
              <div style={{ fontSize: 11, color: COLORS.textDim, lineHeight: 1.5 }}>
                <strong style={{ color: COLORS.text }}>Model Drift Detection:</strong>{" "}
                All findings generated with <span style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.electricBlue }}>claude-sonnet-4-20250514</span>.
                Last benchmark run: Feb 3, 2025 — accuracy 96.2% on test suite (342 cases). No drift detected.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
