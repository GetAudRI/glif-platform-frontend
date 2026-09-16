import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { generateSchemaPair, getDocumentTypesCatalog, loadSchemaPairReview } from '../services/api';
import FieldMappingVisualization from './FieldMappingVisualization';
import SopNamingPreview from './SopNamingPreview';
import SchemaPairExtractionReview from './SchemaPairExtractionReview';
import { bundleFromSchemaPairResult, saveSopBundle, slugifySopName } from '../utils/sopNaming';

type DocType = {
  id: string;
  label: string;
  group: string;
};

type Group = { id: string; label: string };
type Model = { id: string; label: string };

export default function SchemaPairGenerator({
  onFinalize,
  onRunComplete,
  variant = 'full',
  restoreSopSchemaFile,
}: {
  onFinalize?: (result: any) => void;
  onRunComplete?: (result: any, meta: { documentName: string; slug: string; documentTypeLabel: string }) => void;
  /** seed = customer extraction test bed; full = technical schema pair UI */
  variant?: 'seed' | 'full';
  /** When set, reload review from a previously saved SOP schema file */
  restoreSopSchemaFile?: string | null;
} = {}) {
  const isSeed = variant === 'seed';
  const [sopText, setSopText] = useState('');
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [schemaName, setSchemaName] = useState('');
  const [schemaVersion, setSchemaVersion] = useState('1.0');
  const [documentType, setDocumentType] = useState('auto_detect');
  const [model, setModel] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [types, setTypes] = useState<DocType[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [generating, setGenerating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showArtifacts, setShowArtifacts] = useState(false);

  useEffect(() => {
    getDocumentTypesCatalog()
      .then((data) => {
        setGroups(data.groups || []);
        setTypes(data.types || []);
        const mods = data.models || [];
        setModels(mods);
        if (mods.length && !model) {
          setModel(mods[0].id);
        }
      })
      .catch(() => {
        /* catalog optional at first paint */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!restoreSopSchemaFile) return;
    let cancelled = false;
    setRestoring(true);
    setError('');
    loadSchemaPairReview(restoreSopSchemaFile)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        if (data.sop_slug) setSchemaName(data.sop_slug);
        const preview = String(data.sop_text_preview || data.sop_schema?.sop_text_preview || '').trim();
        if (preview) setSopText(preview);
        const bundle = bundleFromSchemaPairResult(data, schemaVersion);
        saveSopBundle(bundle);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || 'Failed to restore extraction review');
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreSopSchemaFile]);

  const typeLabel =
    types.find((t) => t.id === documentType)?.label || documentType;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSopFile(file);
    setError('');
    setResult(null);

    const baseName = slugifySopName(file.name);
    setSchemaName(baseName);

    if (file.name.toLowerCase().endsWith('.pdf')) {
      setSopText('');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSopText(content);
    };
    reader.readAsText(file);
  };

  const handleGenerate = async () => {
    const hasUploadedPdf = sopFile?.name.toLowerCase().endsWith('.pdf');

    if (!hasUploadedPdf && (!sopText || sopText.trim().length < 100)) {
      setError('Please upload or paste an SOP (at least 100 characters)');
      return;
    }

    if (!schemaName || schemaName.trim().length < 2) {
      setError('Please provide a document slug (e.g., "statefarm_wildfire_mce")');
      return;
    }

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const input = hasUploadedPdf && sopFile ? sopFile : sopText;
      const data = await generateSchemaPair(input, schemaName, schemaVersion, {
        documentType,
        model: model || undefined,
      });
      setResult(data);
      const bundle = bundleFromSchemaPairResult(data, schemaVersion, sopFile?.name);
      saveSopBundle(bundle);
      onRunComplete?.(data, {
        documentName: sopFile?.name || `${schemaName}.txt`,
        slug: data.sop_slug || schemaName,
        documentTypeLabel: data.document_type_label || typeLabel,
      });
    } catch (err: any) {
      setError(err.message || (isSeed ? 'Extraction failed' : 'Failed to generate schema pair'));
    } finally {
      setGenerating(false);
    }
  };

  const downloadSchema = (schema: any, filename: string) => {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const typesByGroup = groups
    .map((g) => ({
      ...g,
      types: types.filter((t) => t.group === g.id),
    }))
    .filter((g) => g.types.length > 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isSeed ? 'Upload any SOP / playbook' : 'Upload SOP File or Paste Text'}
          </label>
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-800 hover:file:bg-slate-200 mb-3"
          />
          <textarea
            value={sopText}
            onChange={(e) => setSopText(e.target.value)}
            placeholder={
              sopFile?.name.toLowerCase().endsWith('.pdf')
                ? `PDF selected: ${sopFile.name} (text will be extracted on the server)`
                : isSeed
                  ? 'Or paste SOP / policy text here…'
                  : 'Paste your SOP text here, or upload a file above...'
            }
            rows={isSeed ? 6 : 8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-sm"
            disabled={generating || sopFile?.name.toLowerCase().endsWith('.pdf')}
          />
          <p className="text-xs text-gray-500 mt-1">
            {sopFile?.name.toLowerCase().endsWith('.pdf')
              ? `PDF ready: ${sopFile.name}`
              : `${sopText.length} characters (minimum 100 required)`}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isSeed ? 'Document slug' : 'SOP slug'}{' '}
            <span className="text-gray-400 font-normal">(auto from filename)</span>
          </label>
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(slugifySopName(e.target.value))}
            placeholder="statefarm_wildfire_mce"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono text-sm"
            disabled={generating}
          />
        </div>

        {!isSeed && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schema Version</label>
            <input
              type="text"
              value={schemaVersion}
              onChange={(e) => setSchemaVersion(e.target.value)}
              placeholder="1.0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              disabled={generating}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
            disabled={generating}
          >
            {typesByGroup.map((g) => (
              <optgroup key={g.id} label={g.label}>
                {g.types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            What the customer said this playbook is. General P&C = catch-all.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">LLM</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
            disabled={generating || models.length === 0}
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isSeed && schemaName && (
        <SopNamingPreview slug={schemaName} version={schemaVersion} sopSourceFile={sopFile?.name} />
      )}

      <button
        onClick={handleGenerate}
        disabled={
          generating ||
          !schemaName ||
          (!sopFile?.name.toLowerCase().endsWith('.pdf') && sopText.length < 100)
        }
        className="w-full px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Clock className="w-5 h-5 animate-spin" />
            {isSeed ? 'Running extraction in test bed…' : 'Analyzing SOP & Generating Schemas...'}
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            {isSeed ? 'Extract rules' : 'Generate Schema Pair'}
          </>
        )}
      </button>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {restoring && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin" />
          Restoring previous extraction review…
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">
                  {isSeed
                    ? `Extracted ${result.extracted_rules_count ?? result.extracted_rules?.length ?? 0} rules`
                    : `Schema pair created for slug ${result.sop_slug || slugifySopName(schemaName)}`}
                </p>
                <p className="text-sm text-emerald-800 mt-1">
                  {result.restored ? 'Restored from saved schema · ' : ''}
                  {result.document_type_label || typeLabel}
                  {result.extraction_model ? ` · ${result.extraction_model}` : ''}
                  {result.sop_slug ? ` · slug ${result.sop_slug}` : ''}
                </p>

                {!isSeed && (
                  <>
                    <div className="grid md:grid-cols-2 gap-3 mt-3">
                      <div className="bg-white p-3 rounded border border-emerald-200">
                        <p className="text-sm font-medium text-gray-900 mb-2">SOP Schema</p>
                        <code className="text-xs text-gray-700 block mb-2">{result.sop_schema_file}</code>
                        <button
                          onClick={() => downloadSchema(result.sop_schema, result.sop_schema_file)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                      <div className="bg-white p-3 rounded border border-emerald-200">
                        <p className="text-sm font-medium text-gray-900 mb-2">Claim Schema</p>
                        <code className="text-xs text-gray-700 block mb-2">{result.claim_schema_file}</code>
                        <button
                          onClick={() => downloadSchema(result.claim_schema, result.claim_schema_file)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link
                        to={`/audit-oversight?tab=testd&claimSchema=${encodeURIComponent(result.claim_schema_file)}`}
                        className="inline-flex items-center gap-1 text-emerald-900 font-medium underline"
                      >
                        Next: Generate claims <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/audit-oversight?tab=single-audit&sopSchema=${encodeURIComponent(result.sop_schema_file)}&claimSchema=${encodeURIComponent(result.claim_schema_file)}`}
                        className="inline-flex items-center gap-1 text-emerald-900 font-medium underline"
                      >
                        Open Single File Audit <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </>
                )}

                {isSeed && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setShowArtifacts((v) => !v)}
                      className="text-xs text-emerald-900 underline"
                    >
                      {showArtifacts ? 'Hide' : 'Show'} technical schema files
                    </button>
                    {showArtifacts && (
                      <div className="mt-2 grid md:grid-cols-2 gap-2 text-xs font-mono text-slate-700">
                        <div className="bg-white border border-emerald-100 rounded p-2 flex items-center justify-between gap-2">
                          <span className="truncate">{result.sop_schema_file}</span>
                          <button
                            type="button"
                            onClick={() => downloadSchema(result.sop_schema, result.sop_schema_file)}
                            className="text-emerald-800 underline shrink-0"
                          >
                            Download
                          </button>
                        </div>
                        <div className="bg-white border border-emerald-100 rounded p-2 flex items-center justify-between gap-2">
                          <span className="truncate">{result.claim_schema_file}</span>
                          <button
                            type="button"
                            onClick={() => downloadSchema(result.claim_schema, result.claim_schema_file)}
                            className="text-emerald-800 underline shrink-0"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <SchemaPairExtractionReview
            key={`${result.sop_schema_file}-${result.extraction_model}-${result.extracted_rules_count}`}
            result={result}
            sopFile={sopFile}
            sopTextFallback={sopText}
          />

          {!isSeed && result.field_mappings && (
            <FieldMappingVisualization fieldMappings={result.field_mappings} />
          )}

          {onFinalize && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => onFinalize(result)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm font-medium"
              >
                Finalize seed → Sample Build
              </button>
              <p className="text-xs text-slate-600">
                Lock this extraction for claim generation. Keep running more SOPs above anytime.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
