import { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Download } from 'lucide-react';

type StepStatus = 'active' | 'complete' | 'pending';

export default function SingleFileAudit() {
  const [currentStep, setCurrentStep] = useState(1);
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [sopLoading, setSopLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [validateLoading, setValidateLoading] = useState(false);
  const [sopData, setSopData] = useState<any>(null);
  const [claimData, setClaimData] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [csvFile, setCsvFile] = useState('');
  const [resultsFile, setResultsFile] = useState('');

  const steps = [
    { number: 1, label: 'Upload SOP', icon: '📄' },
    { number: 2, label: 'Upload Claim', icon: '🚗' },
    { number: 3, label: 'Validate', icon: '⚡' },
    { number: 4, label: 'Results', icon: '📊' }
  ];

  const getStepStatus = (stepNum: number): StepStatus => {
    if (stepNum < currentStep) return 'complete';
    if (stepNum === currentStep) return 'active';
    return 'pending';
  };

  const handleSopUpload = async (file: File) => {
    setSopFile(file);
    setSopLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/rules-engine/auto-claims/upload-sop', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to extract SOP rules');

      const data = await response.json();
      setSopData(data.rules); // Flask returns {success, rules, filename}
      setTimeout(() => setCurrentStep(2), 500);
    } catch (err: any) {
      setError(err.message || 'Failed to process SOP');
    } finally {
      setSopLoading(false);
    }
  };

  const handleClaimUpload = async (file: File) => {
    setClaimFile(file);
    setClaimLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/rules-engine/auto-claims/upload-claim', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to extract claim data');

      const data = await response.json();
      setClaimData(data.claim); // Flask returns {success, claim, filename}
      setTimeout(() => setCurrentStep(3), 500);
    } catch (err: any) {
      setError(err.message || 'Failed to process claim');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidateLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/rules-engine/auto-claims/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: sopData,  // Flask expects 'rules', not 'sop_data'
          claim: claimData  // Flask expects 'claim', not 'claim_data'
        })
      });

      if (!response.ok) throw new Error('Validation failed');

      const data = await response.json();
      setResults(data.validation_results); // Flask returns {success, validation_results}
      setCsvFile(data.csv_file || '');
      setResultsFile(data.results_file || '');
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setValidateLoading(false);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setSopFile(null);
    setClaimFile(null);
    setSopData(null);
    setClaimData(null);
    setResults(null);
    setError('');
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
          {steps.map((step) => {
            const status = getStepStatus(step.number);
            return (
              <div key={step.number} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                    status === 'active'
                      ? 'bg-blue-600 text-white'
                      : status === 'complete'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {status === 'complete' ? '✓' : step.number}
                </div>
                <div
                  className={`text-sm ${
                    status === 'active' ? 'text-blue-900 font-semibold' : 'text-gray-600'
                  }`}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step 1: Upload SOP */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 1: Upload SOP Document 📄
          </h2>
          <p className="text-gray-600 mb-6">
            Upload your Standard Operating Procedure or policy document. AI will extract validation rules.
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              sopLoading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={() => !sopLoading && document.getElementById('sopInput')?.click()}
          >
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {sopFile ? sopFile.name : 'Drop SOP document here'}
            </h3>
            <p className="text-gray-600 mb-2">or click to browse</p>
            <p className="text-sm text-gray-500">Supports: PDF, TXT, JSON (max 16MB)</p>
            <input
              id="sopInput"
              type="file"
              accept=".pdf,.txt,.json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleSopUpload(e.target.files[0])}
            />
          </div>

          {sopLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3" />
              <p className="text-gray-600">Extracting rules with AI...</p>
            </div>
          )}

          {sopData && !sopLoading && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Extracted Rules Preview:</h4>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {JSON.stringify(sopData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Upload Claim */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 2: Upload Claim Document 🚗
          </h2>
          <p className="text-gray-600 mb-6">
            Upload the insurance claim document. AI will extract structured claim data.
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              claimLoading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={() => !claimLoading && document.getElementById('claimInput')?.click()}
          >
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {claimFile ? claimFile.name : 'Drop claim document here'}
            </h3>
            <p className="text-gray-600 mb-2">or click to browse</p>
            <p className="text-sm text-gray-500">Supports: PDF, TXT, JSON (max 16MB)</p>
            <input
              id="claimInput"
              type="file"
              accept=".pdf,.txt,.json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleClaimUpload(e.target.files[0])}
            />
          </div>

          {claimLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3" />
              <p className="text-gray-600">Extracting claim data with AI...</p>
            </div>
          )}

          {claimData && !claimLoading && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Extracted Claim Data Preview:</h4>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {JSON.stringify(claimData, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Validate */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 3: Run Validation ⚡</h2>
          <p className="text-gray-600 mb-6">Ready to validate the claim against extracted rules.</p>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between mb-3">
              <strong className="text-gray-900">SOP Document:</strong>
              <span className="text-gray-700">{sopFile?.name}</span>
            </div>
            <div className="flex justify-between">
              <strong className="text-gray-900">Claim Document:</strong>
              <span className="text-gray-700">{claimFile?.name}</span>
            </div>
          </div>

          {validateLoading && (
            <div className="text-center mb-6">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3" />
              <p className="text-gray-600">Running validation...</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              disabled={validateLoading}
            >
              ← Back
            </button>
            <button
              onClick={handleValidate}
              disabled={validateLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300"
            >
              Validate Claim ✓
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {currentStep === 4 && results && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div
            className={`rounded-lg p-8 text-center mb-8 ${
              results.is_valid
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                : 'bg-gradient-to-br from-red-500 to-red-600 text-white'
            }`}
          >
            <div className="text-6xl mb-4">{results.is_valid ? '✅' : '❌'}</div>
            <h2 className="text-3xl font-bold mb-2">
              {results.is_valid ? 'Claim Valid' : 'Claim Invalid'}
            </h2>
            <p className="text-lg opacity-90">
              Claim ID: {results.claim_id || 'N/A'}
            </p>
          </div>

          {/* Summary Grid */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {results.rule_checks?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Total Checks</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {results.rule_checks?.filter((c: any) => c.status === 'PASS').length || 0}
              </div>
              <div className="text-sm text-gray-600">Passed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {results.errors?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {results.warnings?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Warnings</div>
            </div>
          </div>

          {/* Rule-by-Rule Results */}
          <h3 className="text-xl font-bold text-gray-900 mb-4">Rule-by-Rule Results</h3>
          <div className="space-y-3 mb-8">
            {results.rule_checks?.map((check: any, idx: number) => (
              <div
                key={idx}
                className={`border-l-4 rounded bg-gray-50 p-4 flex justify-between items-center ${
                  check.status === 'PASS'
                    ? 'border-green-500'
                    : check.status === 'FAIL'
                    ? 'border-red-500'
                    : check.status === 'WARNING'
                    ? 'border-yellow-500'
                    : 'border-gray-400'
                }`}
              >
                <div>
                  <div className="font-semibold text-gray-900">{check.rule}</div>
                  {check.details && <div className="text-sm text-gray-600 mt-1">{check.details}</div>}
                </div>
                <div
                  className={`px-4 py-2 rounded font-semibold text-sm ${
                    check.status === 'PASS'
                      ? 'bg-green-100 text-green-800'
                      : check.status === 'FAIL'
                      ? 'bg-red-100 text-red-800'
                      : check.status === 'WARNING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {check.status === 'PASS' && '✅ PASS'}
                  {check.status === 'FAIL' && '❌ FAIL'}
                  {check.status === 'WARNING' && '⚠️ WARNING'}
                  {check.status === 'N/A' && 'ℹ️ N/A'}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={resetWorkflow}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              🔄 Validate Another Claim
            </button>
            <a
              href={`http://localhost:5001/rules-engine/auto-claims/download/${csvFile}`}
              download
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-center"
            >
              📥 Download CSV Report
            </a>
            <a
              href={`http://localhost:5001/rules-engine/auto-claims/download/${resultsFile}`}
              download
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-center"
            >
              📥 Download JSON
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
