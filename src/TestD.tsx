import { useEffect, useState } from 'react';
import SchemaBasedClaimsGenerator from './components/SchemaBasedClaimsGenerator';
import SOPBasedClaimsGenerator from './components/SOPBasedClaimsGenerator';
import SchemaPairGenerator from './components/SchemaPairGenerator';
import {
  FinalizedSeed,
  SeedRun,
  getActiveSeedRunId,
  listFinalizedSeeds,
  listSeedRuns,
  markSeedRunFinalized,
  recordSeedRun,
  saveFinalizedSeed,
  selectFinalizedSeed,
  setActiveSeedRunId,
  slugifySopName,
} from './utils/sopNaming';

type TestDStage = 'seed' | 'samples';

export default function TestD() {
  const [stage, setStage] = useState<TestDStage>('seed');
  const [seeds, setSeeds] = useState<FinalizedSeed[]>(() => listFinalizedSeeds());
  const [runs, setRuns] = useState<SeedRun[]>(() => listSeedRuns());
  const [selectedSeedId, setSelectedSeedId] = useState<string>(() => listFinalizedSeeds()[0]?.id || '');
  const [activeRunId, setActiveRunId] = useState<string | null>(() => getActiveSeedRunId());
  const [restoreSopSchemaFile, setRestoreSopSchemaFile] = useState<string | null>(() => {
    const id = getActiveSeedRunId();
    const run = listSeedRuns().find((r) => r.id === id);
    return run?.sop_schema_file || listSeedRuns()[0]?.sop_schema_file || null;
  });
  const [finalizeMsg, setFinalizeMsg] = useState('');

  const selectedSeed = seeds.find((s) => s.id === selectedSeedId) || seeds[0] || null;

  useEffect(() => {
    setSeeds(listFinalizedSeeds());
    setRuns(listSeedRuns());
  }, [stage]);

  useEffect(() => {
    if (stage === 'samples' && selectedSeed) {
      selectFinalizedSeed(selectedSeed);
    }
  }, [stage, selectedSeedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRunComplete = (
    result: any,
    meta: { documentName: string; slug: string; documentTypeLabel: string }
  ) => {
    const run: SeedRun = {
      id: `${meta.slug}__${result.extraction_model || 'model'}__${Date.now()}`,
      document_name: meta.documentName,
      slug: meta.slug,
      document_type: result.used_document_type || '',
      document_type_label: meta.documentTypeLabel,
      llm: result.extraction_model || '—',
      rule_count: result.extracted_rules_count ?? result.extracted_rules?.length ?? 0,
      sop_schema_file: result.sop_schema_file,
      claim_schema_file: result.claim_schema_file,
      ran_at: new Date().toISOString(),
      finalized: false,
    };
    setRuns(recordSeedRun(run));
    setActiveRunId(run.id);
    setActiveSeedRunId(run.id);
    setRestoreSopSchemaFile(result.sop_schema_file);
  };

  const openRun = (run: SeedRun) => {
    setActiveRunId(run.id);
    setActiveSeedRunId(run.id);
    setRestoreSopSchemaFile(run.sop_schema_file);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalize = (result: any) => {
    const slug = result.sop_slug || slugifySopName(result.sop_schema_file || 'custom');
    const version = '1.0';
    const seed: FinalizedSeed = {
      id: `${slug}__${result.extraction_model || 'model'}__${Date.now()}`,
      slug,
      version,
      label: `${slug} · ${result.document_type_label || result.used_document_type || 'SOP'} · ${
        result.extracted_rules_count ?? '?'
      } rules`,
      sop_schema_file: result.sop_schema_file,
      claim_schema_file: result.claim_schema_file,
      document_type_label: result.document_type_label || result.used_document_type,
      extraction_model: result.extraction_model,
      rule_count: result.extracted_rules_count,
      finalized_at: new Date().toISOString(),
    };
    const next = saveFinalizedSeed(seed);
    setSeeds(next);
    setSelectedSeedId(seed.id);
    if (activeRunId) {
      setRuns(markSeedRunFinalized(activeRunId));
    }
    setFinalizeMsg(`Seed finalized: ${seed.label}`);
    setStage('samples');
  };

  const handleSelectSeed = (id: string) => {
    setSelectedSeedId(id);
    const seed = seeds.find((s) => s.id === id);
    if (seed) selectFinalizedSeed(seed);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-2">TestD</h1>
        <p className="text-slate-300 text-sm max-w-3xl">
          <strong className="text-white">Seed Stage</strong> — give us any SOP; we run it in the test bed and show
          every extracted rule.{' '}
          <strong className="text-white">Sample Build</strong> — pick a finalized seed and create demo claims.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <StageTab active={stage === 'seed'} onClick={() => setStage('seed')}>
          1 · Seed Stage
        </StageTab>
        <StageTab active={stage === 'samples'} onClick={() => setStage('samples')}>
          2 · Sample Build
        </StageTab>
      </div>

      {stage === 'seed' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-900">Extraction test bed</h2>
              <p className="text-sm text-slate-600 mt-1">
                Drop any customer SOP or playbook. Pick document type + LLM. The output that matters is the{' '}
                <strong>extracted rules</strong> you can walk through with the customer.
              </p>
            </div>
            <div className="p-6">
              <SchemaPairGenerator
                variant="seed"
                restoreSopSchemaFile={restoreSopSchemaFile}
                onRunComplete={handleRunComplete}
                onFinalize={handleFinalize}
              />
            </div>
          </div>

          {finalizeMsg && (
            <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              {finalizeMsg}
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Extraction runs</h2>
              <p className="text-sm text-slate-600 mt-1">
                Click a row to reopen the document | rules review (survives refresh).
              </p>
            </div>
            {runs.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-500">
                No runs yet. Upload an SOP above and click <strong>Extract rules</strong>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Document</th>
                      <th className="px-4 py-3 font-medium">Slug</th>
                      <th className="px-4 py-3 font-medium">Doc type</th>
                      <th className="px-4 py-3 font-medium">LLM</th>
                      <th className="px-4 py-3 font-medium">Extracted</th>
                      <th className="px-4 py-3 font-medium">When</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {runs.map((run) => (
                      <tr
                        key={run.id}
                        onClick={() => openRun(run)}
                        className={`cursor-pointer hover:bg-slate-50 ${
                          run.id === activeRunId ? 'bg-emerald-50/60' : 'bg-white'
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-900 max-w-[200px] truncate" title={run.document_name}>
                          {run.document_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{run.slug}</td>
                        <td className="px-4 py-3 text-slate-700 max-w-[180px] truncate" title={run.document_type_label}>
                          {run.document_type_label}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 max-w-[160px] truncate" title={run.llm}>
                          {run.llm.replace(/^[^/]+\//, '')}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{run.rule_count} rules</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(run.ran_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {run.finalized ? (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Finalized
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Open</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {stage === 'samples' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Continue from finalized seed</h2>
            <p className="text-sm text-slate-600">
              Choose an extraction you finalized in Seed Stage. Claims generators below use that claim schema.
            </p>
            {seeds.length === 0 ? (
              <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-4">
                No finalized seeds yet.{' '}
                <button type="button" className="underline font-medium" onClick={() => setStage('seed')}>
                  Go to Seed Stage
                </button>{' '}
                — extract rules, then Finalize seed.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Finalized seed</label>
                  <select
                    value={selectedSeed?.id || ''}
                    onChange={(e) => handleSelectSeed(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {seeds.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSeed && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 font-mono">
                    <div>slug: {selectedSeed.slug}</div>
                    <div>type: {selectedSeed.document_type_label || '—'}</div>
                    <div>llm: {selectedSeed.extraction_model || '—'}</div>
                    <div>claim: {selectedSeed.claim_schema_file}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedSeed && (
            <>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Generate claims from the finalized claim schema
                </h3>
                <p className="text-xs text-slate-500 mb-3 font-mono">{selectedSeed.claim_schema_file}</p>
                <SchemaBasedClaimsGenerator />
              </div>
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-1">
                  Or generate from SOP + claim schema pair
                </h3>
                <p className="text-xs text-slate-500 mb-3 font-mono">
                  {selectedSeed.sop_schema_file} · {selectedSeed.claim_schema_file}
                </p>
                <SOPBasedClaimsGenerator />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StageTab({
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
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? 'border-slate-900 text-slate-900'
          : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}
