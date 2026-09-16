import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Play, Shield } from 'lucide-react';

type MockClaim = {
  claimNumber: string;
  policyholder: string;
  status: 'Closed';
  lossDate: string;
  flags: number;
  leakage: string;
  featured?: boolean;
};

const PAGE_SIZE = 25;
const PAGE_COUNT = 3;
const FEATURED = 'CA-2026-99011';

const HOLDERS = [
  'Apex Logistics LLC',
  'Summit Fleet Co',
  'Harbor Transit Inc',
  'Redwood Haul LLC',
  'Pacific Rigging Co',
  'Iron Range Carriers',
  'Blue Ridge Freight',
  'Coastal Dispatch LLC',
];

function buildMockClaims(): MockClaim[] {
  const rows: MockClaim[] = [
    {
      claimNumber: FEATURED,
      policyholder: 'Apex Logistics LLC',
      status: 'Closed',
      lossDate: '2026-02-01',
      flags: 3,
      leakage: '$2,000',
      featured: true,
    },
  ];
  for (let i = 1; i < PAGE_SIZE * PAGE_COUNT; i += 1) {
    const n = 98000 + i;
    const flags = i % 11 === 0 ? 2 : i % 7 === 0 ? 1 : 0;
    rows.push({
      claimNumber: `CA-2026-${n}`,
      policyholder: HOLDERS[i % HOLDERS.length],
      status: 'Closed',
      lossDate: `2026-0${(i % 8) + 1}-${String((i % 27) + 1).padStart(2, '0')}`,
      flags,
      leakage: flags ? `$${500 * flags}` : '—',
    });
  }
  return rows;
}

export default function ClosedClaimsBatchDashboard({
  onStartRealAudit,
}: {
  onStartRealAudit: () => void;
}) {
  const navigate = useNavigate();
  const claims = useMemo(() => buildMockClaims(), []);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string>(FEATURED);
  const [running, setRunning] = useState(false);

  const pageRows = claims.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const flaggedCount = claims.filter((c) => c.flags > 0).length;

  const runAiAudit = () => {
    setRunning(true);
    // Demo path: frozen CA-2026-99011 already has a Fast audit in Audit Results.
    window.setTimeout(() => {
      navigate('/audit-oversight?tab=single-audit-results');
    }, 600);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Closed claims in queue" value="10,000" hint="Commercial Auto · Symbol 7" />
        <Kpi label="Shown in this mock" value={String(claims.length)} hint={`${PAGE_COUNT} pages · ${PAGE_SIZE}/page`} />
        <Kpi label="Exception files" value={String(flaggedCount)} hint="Flags on this sample" />
        <Kpi label="Pinned file" value="CA-2026-99011" hint="Apex Logistics LLC" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Mock closed-file queue for the customer walkthrough. Page through 2–3 pages, select a row, then run the AI audit.
          The real 25-file picker is still behind <strong>Start New Audit</strong>.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onStartRealAudit}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Use uploaded files
          </button>
          <button
            type="button"
            onClick={runAiAudit}
            disabled={running}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
          >
            <Play className="w-4 h-4" />
            {running ? 'Opening audit…' : 'Run AI Audit'}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Run AI Audit opens Audit Results for the frozen file CA-2026-99011 (the live Fast run). Other rows are mock queue padding.
      </p>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2 w-10"></th>
              <th className="px-3 py-2">Claim</th>
              <th className="px-3 py-2">Policyholder</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Date of loss</th>
              <th className="px-3 py-2">Flags</th>
              <th className="px-3 py-2">Est. leakage</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const active = selected === row.claimNumber;
              return (
                <tr
                  key={row.claimNumber}
                  onClick={() => setSelected(row.claimNumber)}
                  className={`border-t border-gray-100 cursor-pointer ${
                    row.featured ? 'bg-rose-50' : active ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="radio"
                      name="closed-claim"
                      checked={active}
                      onChange={() => setSelected(row.claimNumber)}
                      className="accent-blue-600"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono font-medium text-gray-900">
                    {row.claimNumber}
                    {row.featured && (
                      <span className="ml-2 text-[10px] uppercase font-semibold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                        demo
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{row.policyholder}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Shield className="w-3.5 h-3.5" />
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">{row.lossDate}</td>
                  <td className="px-3 py-2">
                    {row.flags > 0 ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {row.flags}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{row.leakage}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Page {page + 1} of {PAGE_COUNT} · selected {selected}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`px-3 py-1.5 rounded-lg ${
                page === i ? 'bg-gray-900 text-white' : 'border border-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            disabled={page === PAGE_COUNT - 1}
            onClick={() => setPage((p) => Math.min(PAGE_COUNT - 1, p + 1))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-gray-900 mt-0.5">{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{hint}</div>
    </div>
  );
}
