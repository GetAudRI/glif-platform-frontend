import { useState } from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { generateClaimsFromSOP } from '../services/api';

export default function SOPBasedClaimsGenerator() {
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [numClaims, setNumClaims] = useState(5);
  const [compliantRatio, setCompliantRatio] = useState(0.5);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!sopFile) {
      setError('Please select a SOP file');
      return;
    }

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const data = await generateClaimsFromSOP(sopFile, numClaims, compliantRatio);
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate claims');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload SOP File
          </label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => setSopFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Claims (1-20)
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={numClaims}
            onChange={(e) => setNumClaims(parseInt(e.target.value) || 5)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compliant Ratio (0.0 - 1.0)
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={compliantRatio}
            onChange={(e) => setCompliantRatio(parseFloat(e.target.value) || 0.5)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating || !sopFile}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Clock className="w-4 h-4 animate-spin" />
            Generating Claims...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            Generate Claims
          </>
        )}
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-900 mb-1">
                Successfully generated {result.generated_count} claims!
              </p>
              <p className="text-sm text-green-700">
                Files saved to: <code className="bg-green-100 px-2 py-1 rounded">{result.output_folder}</code>
              </p>
              <p className="text-xs text-green-600 mt-2">
                Compliant: {result.files.filter((f: any) => f.compliance_status === 'compliant').length} | 
                Non-compliant: {result.files.filter((f: any) => f.compliance_status === 'non_compliant').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

