import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { generateSchemaPair } from '../services/api';
import FieldMappingVisualization from './FieldMappingVisualization';
import SopNamingPreview from './SopNamingPreview';
import { bundleFromSchemaPairResult, saveSopBundle, slugifySopName } from '../utils/sopNaming';

export default function SchemaPairGenerator() {
  const [sopText, setSopText] = useState('');
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [schemaName, setSchemaName] = useState('');
  const [schemaVersion, setSchemaVersion] = useState('1.0');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSopFile(file);
    setError('');

    const baseName = slugifySopName(file.name);
    setSchemaName(baseName);

    // For text files, preview content in the textarea. PDFs are sent to the backend for extraction.
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
      setError('Please provide an SOP slug (e.g., "statefarm_wildfire_mce")');
      return;
    }

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const input = hasUploadedPdf && sopFile ? sopFile : sopText;
      const data = await generateSchemaPair(input, schemaName, schemaVersion);
      setResult(data);
      const bundle = bundleFromSchemaPairResult(data, schemaVersion, sopFile?.name);
      saveSopBundle(bundle);
    } catch (err: any) {
      setError(err.message || 'Failed to generate schema pair');
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

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload SOP File or Paste Text
          </label>
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 mb-3"
          />
          <textarea
            value={sopText}
            onChange={(e) => setSopText(e.target.value)}
            placeholder={
              sopFile?.name.toLowerCase().endsWith('.pdf')
                ? `PDF selected: ${sopFile.name} (text will be extracted on the server)`
                : 'Paste your SOP text here, or upload a file above...'
            }
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
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
            SOP slug <span className="text-gray-400 font-normal">(shared by all files)</span>
          </label>
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(slugifySopName(e.target.value))}
            placeholder="statefarm_wildfire_mce"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
            disabled={generating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schema Version
          </label>
          <input
            type="text"
            value={schemaVersion}
            onChange={(e) => setSchemaVersion(e.target.value)}
            placeholder="1.0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={generating}
          />
        </div>
      </div>

      {schemaName && (
        <SopNamingPreview
          slug={schemaName}
          version={schemaVersion}
          sopSourceFile={sopFile?.name}
        />
      )}

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={
          generating ||
          !schemaName ||
          (!sopFile?.name.toLowerCase().endsWith('.pdf') && sopText.length < 100)
        }
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Clock className="w-5 h-5 animate-spin" />
            Analyzing SOP & Generating Schemas...
          </>
        ) : (
          <>
            <FileText className="w-5 h-5" />
            🔮 Generate Schema Pair
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-2">
                  ✅ Schema pair created for slug <code className="bg-green-100 px-1 rounded">{result.sop_slug || slugifySopName(schemaName)}</code>
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">SOP Schema</p>
                    <code className="text-xs text-gray-700 block mb-2">{result.sop_schema_file}</code>
                    <button
                      onClick={() => downloadSchema(result.sop_schema, result.sop_schema_file)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="text-sm font-medium text-gray-900 mb-2">Claim Schema</p>
                    <code className="text-xs text-gray-700 block mb-2">{result.claim_schema_file}</code>
                    <button
                      onClick={() => downloadSchema(result.claim_schema, result.claim_schema_file)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Field Mapping Visualization */}
          {result.field_mappings && (
            <div className="bg-white rounded-lg border border-gray-200 mt-4">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Field Mapping Preview</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Shows which SOP rules validate which claim fields (saved in both schemas)
                </p>
              </div>
              <div className="p-4">
                <FieldMappingVisualization
                  fieldMappings={result.field_mappings}
                  sopSchema={result.sop_schema}
                  claimSchema={result.claim_schema}
                />
              </div>
            </div>
          )}

          {/* Next Steps */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <p className="text-sm font-medium text-blue-900 mb-2">🎯 Next Steps:</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Schemas saved automatically to backend</li>
              <li>Generate demo claims in <strong>Schema-Based Claims Generator</strong> using <code>{result.claim_schema_file}</code></li>
              <li>Run Single File Audit with the matching SOP + claim schemas</li>
            </ol>
            <Link
              to={`/audit-oversight?tab=testd&claimSchema=${encodeURIComponent(result.claim_schema_file)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium mr-2"
            >
              Generate Claims (scroll down)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={`/audit-oversight?tab=single-audit&sopSchema=${encodeURIComponent(result.sop_schema_file)}&claimSchema=${encodeURIComponent(result.claim_schema_file)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              Open Single File Audit
              <ArrowRight className="w-4 h-4" />
            </Link>
            {result.detected_domain && (
              <p className="text-xs text-blue-700">
                Detected domain: <strong>{result.detected_domain.label}</strong>
                {' '}({result.extracted_rules_count} rules embedded in SOP schema)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

