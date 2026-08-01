import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { generateClaimsFromSchema, listSchemas } from '../services/api';
import SopNamingPreview from './SopNamingPreview';
import {
  loadSopBundle,
  extractSlugFromSchemaFilename,
  type SopBundle,
} from '../utils/sopNaming';

export default function SchemaBasedClaimsGenerator() {
  const [searchParams] = useSearchParams();
  const [docType, setDocType] = useState('claim');
  const [schemaVersion, setSchemaVersion] = useState('');
  const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
  const [activeBundle, setActiveBundle] = useState<SopBundle | null>(null);
  const [numCompliant, setNumCompliant] = useState(1);
  const [numNoncompliant, setNumNoncompliant] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loadingSchemas, setLoadingSchemas] = useState(false);

  // Load available schemas on mount
  useEffect(() => {
    loadSchemas();
  }, [docType, searchParams]);

  const loadSchemas = async () => {
    setLoadingSchemas(true);
    try {
      const bundle = loadSopBundle();
      setActiveBundle(bundle);

      const data = await listSchemas(docType);
      if (data.success && data.schema_files) {
        const claimFiles = data.schema_files.filter((f: string) => f.startsWith('claim_'));
        setAvailableSchemas(claimFiles);

        const fromUrl = searchParams.get('claimSchema');
        const preferred =
          fromUrl ||
          bundle?.claim_schema_file ||
          '';
        const pick =
          (preferred && claimFiles.includes(preferred) && preferred) ||
          (bundle?.slug &&
            claimFiles.find((f: string) => f.includes(bundle.slug))) ||
          claimFiles[claimFiles.length - 1] ||
          '';

        if (pick) {
          setSchemaVersion(pick);
        }
      }
    } catch (err) {
      console.error('Error loading schemas:', err);
    } finally {
      setLoadingSchemas(false);
    }
  };

  const handleGenerate = async () => {
    if (!schemaVersion) {
      setError('Select a claim schema file first (refresh list after Schema Pair generation)');
      return;
    }

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const data = await generateClaimsFromSchema(
        docType,
        schemaVersion,
        numCompliant,
        numNoncompliant,
        true
      );
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate claims from schema');
    } finally {
      setGenerating(false);
    }
  };

  const activeSlug =
    activeBundle?.slug ||
    extractSlugFromSchemaFilename(schemaVersion) ||
    '';

  return (
    <div className="space-y-4">
      {activeBundle && (
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-900">
          Linked to SOP slug <code className="font-mono bg-purple-100 px-1 rounded">{activeBundle.slug}</code>
          {activeBundle.sop_source_file && (
            <span className="text-purple-700"> from {activeBundle.sop_source_file}</span>
          )}
        </div>
      )}

      {activeSlug && (
        <SopNamingPreview
          slug={activeSlug}
          version={activeBundle?.version || '1.0'}
          bundle={activeBundle}
          compact={false}
        />
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={generating}
          >
            <option value="claim">Claim</option>
            <option value="policy">Policy</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Claim schema <span className="text-gray-400 font-normal">(claim_{'{slug}'}_v…)</span>
          </label>
          <div className="flex gap-2">
            <select
              value={schemaVersion}
              onChange={(e) => setSchemaVersion(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={generating}
            >
              {availableSchemas.map((schemaFile) => (
                <option key={schemaFile} value={schemaFile}>
                  {schemaFile}
                </option>
              ))}
            </select>
            <button
              onClick={loadSchemas}
              disabled={loadingSchemas || generating}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh schema list"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSchemas ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Actual file from: config/extraction_schemas/ • Click refresh after generating new schemas
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compliant Claims (✅ Will PASS)
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={numCompliant}
            onChange={(e) => setNumCompliant(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={generating}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Non-Compliant Claims (❌ Will FAIL)
          </label>
          <input
            type="number"
            min="0"
            max="5"
            value={numNoncompliant}
            onChange={(e) => setNumNoncompliant(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            disabled={generating}
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || !schemaVersion}
        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Clock className="w-5 h-5 animate-spin" />
            Generating Claims from Schema...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            🎯 Generate Claims
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-2">
                ✅ Successfully generated {result.num_claims_generated} claims!
              </p>
              <p className="text-sm text-green-700 mb-1">
                SOP slug: <code className="bg-green-100 px-2 py-1 rounded">{result.sop_slug || activeSlug}</code>
              </p>
              <p className="text-sm text-green-700 mb-3">
                Claim schema: <code className="bg-green-100 px-2 py-1 rounded">{result.schema_file || schemaVersion}</code>
              </p>
              {result.output_directory && (
                <p className="text-xs text-green-700 mb-2 font-mono">
                  Saved to: {result.output_directory}
                </p>
              )}
              {result.detected_domain?.label && (
                <p className="text-xs text-green-700 mb-2">
                  Domain: {result.detected_domain.label}
                </p>
              )}
              
              {result.saved_files && result.saved_files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-green-800">Generated Files:</p>
                  {result.saved_files.map((file: any, idx: number) => (
                    <div key={idx} className="bg-white p-3 rounded border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        {file.compliance_status === 'compliant' ? (
                          <span className="text-green-600">✅</span>
                        ) : (
                          <span className="text-red-600">❌</span>
                        )}
                        <code className="text-xs font-mono text-gray-700">{file.filename}</code>
                      </div>
                      <p className="text-xs text-gray-600">
                        Claim: {file.claim_number} | 
                        Status: {file.compliance_status === 'compliant' ? 'PASS' : 'FAIL'}
                      </p>
                      {file.expected_violations && file.expected_violations.length > 0 && (
                        <div className="mt-2 text-xs text-red-600">
                          <p className="font-medium">Expected Violations:</p>
                          <ul className="list-disc list-inside ml-2">
                            {file.expected_violations.map((v: string, i: number) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm font-medium text-blue-900 mb-2">🎯 Next Steps:</p>
                <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to <strong>Single File Audit</strong> tab</li>
                  <li>Upload the generated claims (from: {result.output_directory})</li>
                  <li>Use the <strong>same schema version</strong> for validation</li>
                  <li>Verify compliant claims PASS ✅ and non-compliant claims FAIL ❌</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

