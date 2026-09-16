import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getGoldenSuite,
  runGoldenExtraction,
  runGoldenDecisions,
} from './services/api';

type Panel = 'extraction' | 'decisions';

export default function GoldenEval() {
  const [panel, setPanel] = useState<Panel>('extraction');
  const [suite, setSuite] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<any>(null);
  const [decisions, setDecisions] = useState<any>(null);

  useEffect(() => {
    getGoldenSuite()
      .then((data) => setSuite(data.suite))
      .catch((err) => setError(err.message || 'Failed to load golden suite'));
  }, []);

  const runExtraction = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runGoldenExtraction();
      setExtraction(data);
      setPanel('extraction');
    } catch (err: any) {
      setError(err.message || 'Extraction eval failed');
    } finally {
      setLoading(false);
    }
  };

  const runDecisions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runGoldenDecisions();
      setDecisions(data);
      setPanel('decisions');
    } catch (err: any) {
      setError(err.message || 'Decision eval failed');
    } finally {
      setLoading(false);
    }
  };

  const runBoth = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ext, dec] = await Promise.all([runGoldenExtraction(), runGoldenDecisions()]);
      setExtraction(ext);
      setDecisions(dec);
    } catch (err: any) {
      setError(err.message || 'Eval suite failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Golden Eval</h1>
        <p className="text-slate-300 text-sm max-w-3xl">
          Grades the <strong className="text-white">AudRI pipeline</strong> (LLM + prompts + glue) against a frozen
          playbook answer key — not the customer&apos;s claim, and not a real carrier production manual.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-mono text-slate-300">
          <span className="bg-white/10 px-3 py-1.5 rounded">TestD = create data</span>
          <span className="bg-emerald-500/20 text-emerald-200 px-3 py-1.5 rounded">Golden Eval = score pipeline</span>
          <span className="bg-white/10 px-3 py-1.5 rounded">DeepEval synthetics → TestD → freeze → here</span>
        </div>
      </div>

      {suite && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-slate-600">
          <div className="font-semibold text-slate-900">{suite.name}</div>
          <p className="mt-1">{suite.description}</p>
          <p className="mt-2 text-xs text-slate-500">
            Ground truth: {suite.ground_truth_level} · {suite.playbooks?.length || 0} playbooks ·{' '}
            {suite.decision_samples?.length || 0} decision samples
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={runBoth}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Run suite (extraction + decisions)'}
        </button>
        <button
          onClick={runExtraction}
          disabled={loading}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          Score extraction only
        </button>
        <button
          onClick={runDecisions}
          disabled={loading}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          Score decisions only
        </button>
        <Link
          to="/audit-oversight?tab=testd"
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
        >
          Open TestD (create)
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{error}</div>
      )}

      {(extraction || decisions) && (
        <div className="grid md:grid-cols-4 gap-4">
          <ScoreCard
            label="Extraction F1"
            value={extraction?.summary?.extraction_avg_f1 != null ? `${extraction.summary.extraction_avg_f1}%` : '—'}
            hint="Rule ID match vs frozen expected"
          />
          <ScoreCard
            label="Decision pass"
            value={
              decisions?.summary?.decision_pass_rate != null
                ? `${decisions.summary.decision_pass_rate}%`
                : '—'
            }
            hint={`${decisions?.summary?.decision_passed ?? 0}/${decisions?.summary?.decision_scored ?? 0} scored`}
          />
          <ScoreCard
            label="Playbooks"
            value={String(extraction?.summary?.extraction_playbooks ?? suite?.playbooks?.length ?? '—')}
            hint="In this suite"
          />
          <ScoreCard
            label="Decision samples"
            value={String(decisions?.summary?.decision_samples ?? suite?.decision_samples?.length ?? '—')}
            hint="Labeled claim pairs"
          />
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        <TabButton active={panel === 'extraction'} onClick={() => setPanel('extraction')}>
          1 · Extraction
        </TabButton>
        <TabButton active={panel === 'decisions'} onClick={() => setPanel('decisions')}>
          2 · Decisions
        </TabButton>
      </div>

      {panel === 'extraction' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Compares expected rule IDs from the golden suite to rules stored on the playbook in the DB
            (what extraction last produced). Free — no OpenRouter call.
          </p>
          {!extraction && (
            <EmptyHint text="Click “Score extraction only” or “Run suite” to grade playbook rule extraction." />
          )}
          {extraction?.results?.map((row: any) => (
            <div key={row.playbook_id} className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{row.label}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">{row.source}</p>
                </div>
                <PassPill ok={row.score?.pass} label={row.score?.pass ? 'PASS' : 'GAP'} />
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Metric label="F1" value={`${row.score?.f1 ?? 0}%`} />
                <Metric label="Precision" value={`${row.score?.precision ?? 0}%`} />
                <Metric label="Recall" value={`${row.score?.recall ?? 0}%`} />
                <Metric label="Counts" value={`${row.score?.actual_count}/${row.score?.expected_count}`} />
              </div>
              <div className="mt-4 grid md:grid-cols-3 gap-3 text-xs">
                <IdList title="Matched" items={row.score?.matched} tone="good" />
                <IdList title="Missing" items={row.score?.missing} tone="bad" />
                <IdList title="Extra" items={row.score?.extra} tone="warn" />
              </div>
              {row.notes && <p className="mt-3 text-xs text-slate-500">{row.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {panel === 'decisions' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Scores latest Single File Audit validations for frozen claim labels (compliant vs non-compliant).
            If a sample shows <em>no_result</em>, run that claim in{' '}
            <Link className="underline" to="/audit-oversight?tab=single-audit">
              Single File Audit
            </Link>{' '}
            first, then re-score here.
          </p>
          {!decisions && (
            <EmptyHint text="Click “Score decisions only” or “Run suite” after you have audit results for golden claims." />
          )}
          {decisions?.note && (
            <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3">
              {decisions.note}
            </div>
          )}
          {decisions?.results?.map((row: any) => (
            <div key={row.sample_id} className="bg-white border border-slate-200 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{row.label}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {row.sample_id} · {row.source}
                    {row.validation?.validation_id ? ` · validation #${row.validation.validation_id}` : ''}
                  </p>
                </div>
                {row.status === 'scored' ? (
                  <PassPill ok={row.pass} label={row.pass ? 'PASS' : 'FAIL'} />
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">no_result</span>
                )}
              </div>
              {row.message && <p className="mt-3 text-sm text-slate-600">{row.message}</p>}
              {row.actual && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <Metric label="Pass rate" value={`${row.actual.rule_pass_rate}%`} />
                  <Metric label="Passed" value={String(row.actual.rules_passed)} />
                  <Metric label="Failed" value={String(row.actual.rules_failed)} />
                  <Metric label="Warned" value={String(row.actual.rules_warned)} />
                  <Metric label="N/A" value={String(row.actual.rules_na)} />
                </div>
              )}
              {row.checks?.length > 0 && (
                <ul className="mt-3 text-xs text-slate-600 space-y-1">
                  {row.checks.map((c: string) => (
                    <li key={c} className="font-mono">
                      {c}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 text-xs text-slate-500">
                Expected: {JSON.stringify(row.expected)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
        active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function ScoreCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-900 mt-1">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{hint}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900 mt-0.5">{value}</div>
    </div>
  );
}

function PassPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-xs font-bold px-2.5 py-1 rounded ${
        ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
      }`}
    >
      {label}
    </span>
  );
}

function IdList({ title, items, tone }: { title: string; items?: string[]; tone: 'good' | 'bad' | 'warn' }) {
  const colors = {
    good: 'bg-emerald-50 text-emerald-900 border-emerald-100',
    bad: 'bg-rose-50 text-rose-900 border-rose-100',
    warn: 'bg-amber-50 text-amber-900 border-amber-100',
  };
  return (
    <div className={`rounded border p-3 ${colors[tone]}`}>
      <div className="font-semibold mb-1">
        {title} ({items?.length ?? 0})
      </div>
      <div className="font-mono break-all">{items?.length ? items.join(', ') : '—'}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div className="border border-dashed border-slate-300 rounded-lg p-8 text-center text-sm text-slate-500">{text}</div>;
}
