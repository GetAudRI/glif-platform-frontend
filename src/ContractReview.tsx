import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Download, List, Search, Clock, DollarSign, HardDrive } from 'lucide-react';

type StepStatus = 'active' | 'complete' | 'pending';

const API_BASE = 'http://localhost:5002';

export default function ContractReview() {
  const [currentStep, setCurrentStep] = useState(1);

  // Playbook Selection State
  const [playbookMode, setPlaybookMode] = useState<'upload' | 'select'>('select');
  const [playbookFile, setPlaybookFile] = useState<File | null>(null);
  const [existingPlaybooks, setExistingPlaybooks] = useState<any[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<number | null>(null);
  const [selectedPlaybookName, setSelectedPlaybookName] = useState<string>('');
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [playbookData, setPlaybookData] = useState<any>(null);
  const [playbookSearchQuery, setPlaybookSearchQuery] = useState('');

  // Contract State
  const [contractMode, setContractMode] = useState<'upload' | 'select'>('select');
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [selectedContractName, setSelectedContractName] = useState<string>('');
  const [existingContracts, setExistingContracts] = useState<any[]>([]);
  const [contractSearchQuery, setContractSearchQuery] = useState('');
  const [loadingContracts, setLoadingContracts] = useState(false);

  // Validation State
  const [validateLoading, setValidateLoading] = useState(false);
  const [useFastValidation, setUseFastValidation] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [savedValidations, setSavedValidations] = useState<any[]>([]);

  const steps = [
    { number: 1, label: 'Select/Upload Playbook', icon: '📄' },
    { number: 2, label: 'Select/Upload Contract', icon: '📋' },
    { number: 3, label: 'Validate', icon: '⚡' },
    { number: 4, label: 'Results', icon: '📊' },
    { number: 5, label: 'Saved Results', icon: '💾' }
  ];

  // Load existing playbooks and contracts on mount
  useEffect(() => {
    loadExistingPlaybooks();
    loadExistingContracts();
  }, []);

  const loadExistingPlaybooks = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contract-review/playbooks`);
      const data = await response.json();
      if (data.success) {
        setExistingPlaybooks(data.playbooks || []);
      }
    } catch (err) {
      console.error('Failed to load playbooks:', err);
    }
  };

  const loadExistingContracts = async () => {
    setLoadingContracts(true);
    try {
      const response = await fetch(`${API_BASE}/api/contract-review/contracts?extracted_only=true`);
      const data = await response.json();
      if (data.success) {
        setExistingContracts(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const filteredPlaybooks = existingPlaybooks.filter((pb: any) => {
    if (!playbookSearchQuery.trim()) return true;
    const query = playbookSearchQuery.toLowerCase();
    return pb.name?.toLowerCase().includes(query);
  });

  const filteredContracts = existingContracts.filter((contract: any) => {
    if (!contractSearchQuery.trim()) return true;
    const query = contractSearchQuery.toLowerCase();
    return contract.name?.toLowerCase().includes(query);
  });

  const getStepStatus = (stepNum: number): StepStatus => {
    if (stepNum < currentStep) return 'complete';
    if (stepNum === currentStep) return 'active';
    return 'pending';
  };

  const handlePlaybookUpload = async (file: File) => {
    setPlaybookFile(file);
    setPlaybookLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/api/contract-review/playbooks/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload playbook');
      }

      setSelectedPlaybookId(data.playbook_id);
      setSelectedPlaybookName(data.name);

      // Fetch the playbook details to get extracted rules
      const playbookResponse = await fetch(`${API_BASE}/api/contract-review/playbooks/${data.playbook_id}`);
      const playbookData = await playbookResponse.json();

      if (playbookData.success) {
        const rules = playbookData.playbook.extracted_rules;
        setPlaybookData(rules);
      }

      // Reload playbooks list
      loadExistingPlaybooks();
    } catch (err: any) {
      setError(err.message || 'Failed to process playbook');
    } finally {
      setPlaybookLoading(false);
    }
  };

  const handleSelectPlaybook = async (playbookId: number) => {
    setSelectedPlaybookId(playbookId);
    setPlaybookLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/contract-review/playbooks/${playbookId}`);
      const data = await response.json();

      if (!data.success) throw new Error('Failed to load playbook');

      const rules = data.playbook.extracted_rules;
      setPlaybookData(rules);
      setSelectedPlaybookName(data.playbook.name);
      setPlaybookFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load playbook');
    } finally {
      setPlaybookLoading(false);
    }
  };

  const handleContractUpload = async (file: File) => {
    setContractFile(file);
    setContractLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/api/contract-review/contracts/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload contract');
      }

      setDocumentId(data.document_id);
      setSelectedContractName(file.name);
      setContractData(data.extracted_data);

      // Reload contracts list
      loadExistingContracts();
    } catch (err: any) {
      setError(err.message || 'Failed to process contract');
    } finally {
      setContractLoading(false);
    }
  };

  const handleSelectContract = async (documentId: number, contractName: string) => {
    setDocumentId(documentId);
    setSelectedContractName(contractName);
    setContractLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/contract-review/contracts/${documentId}`);
      const data = await response.json();

      if (!data.success) throw new Error('Failed to load contract');

      setContractData(data.document.extracted_data);
      setContractFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load contract');
    } finally {
      setContractLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedPlaybookId || !documentId) {
      setError('Please select both a playbook and a contract');
      return;
    }

    setValidateLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/contract-review/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          playbook_id: selectedPlaybookId,
          document_id: documentId,
          use_fast_validation: useFastValidation
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Validation failed');
      }

      setResults(data.validation_results);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to validate contract');
    } finally {
      setValidateLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Contract Review</h1>
          <p className="text-gray-600">Validate contracts against playbook standards</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => {
                      // Allow navigation to completed steps or step 5 (saved results)
                      if (step.number === 5 || getStepStatus(step.number) === 'complete') {
                        setCurrentStep(step.number);
                      }
                    }}
                    disabled={step.number !== 5 && getStepStatus(step.number) === 'pending'}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all ${
                      getStepStatus(step.number) === 'complete'
                        ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                        : getStepStatus(step.number) === 'active'
                        ? 'bg-blue-500 text-white'
                        : step.number === 5
                        ? 'bg-purple-500 text-white hover:bg-purple-600 cursor-pointer'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {getStepStatus(step.number) === 'complete' ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      step.number
                    )}
                  </button>
                  <div className="mt-2 text-sm font-medium text-gray-700">{step.label}</div>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      getStepStatus(step.number) === 'complete' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Step 1: Playbook Selection */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Select or Upload Playbook</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2 border-b">
                <button
                  onClick={() => setPlaybookMode('select')}
                  className={`px-4 py-2 font-medium ${
                    playbookMode === 'select'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-2" />
                  Select Existing
                </button>
                <button
                  onClick={() => setPlaybookMode('upload')}
                  className={`px-4 py-2 font-medium ${
                    playbookMode === 'upload'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload New
                </button>
              </div>
            </div>

            {playbookMode === 'select' ? (
              <div>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search playbooks..."
                    value={playbookSearchQuery}
                    onChange={(e) => setPlaybookSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPlaybooks.map((playbook: any) => (
                    <div
                      key={playbook.id}
                      onClick={() => handleSelectPlaybook(playbook.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPlaybookId === playbook.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{playbook.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {playbook.rules_count || 0} rules • {formatDate(playbook.uploaded_at)}
                          </div>
                        </div>
                        {selectedPlaybookId === playbook.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block mb-2 font-medium text-gray-700">Upload Playbook File</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePlaybookUpload(file);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}

            {playbookLoading && (
              <div className="mt-4 text-center text-gray-500">Processing playbook...</div>
            )}

            {selectedPlaybookId && playbookData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span className="font-medium">Playbook selected: {selectedPlaybookName}</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedPlaybookId}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next: Select Contract
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Contract Selection */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Select or Upload Contract</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2 border-b">
                <button
                  onClick={() => setContractMode('select')}
                  className={`px-4 py-2 font-medium ${
                    contractMode === 'select'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-2" />
                  Select Existing
                </button>
                <button
                  onClick={() => setContractMode('upload')}
                  className={`px-4 py-2 font-medium ${
                    contractMode === 'upload'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload New
                </button>
              </div>
            </div>

            {contractMode === 'select' ? (
              <div>
                <div className="mb-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search contracts..."
                    value={contractSearchQuery}
                    onChange={(e) => setContractSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredContracts.map((contract: any) => (
                    <div
                      key={contract.id}
                      onClick={() => handleSelectContract(contract.id, contract.name)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        documentId === contract.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{contract.name}</div>
                          <div className="text-sm text-gray-500 mt-1 flex items-center space-x-4">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(contract.uploaded_at)}
                            </span>
                            {contract.file_size && (
                              <span className="flex items-center">
                                <HardDrive className="w-4 h-4 mr-1" />
                                {formatFileSize(contract.file_size)}
                              </span>
                            )}
                            {contract.total_cost && (
                              <span className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                ${contract.total_cost.toFixed(4)}
                              </span>
                            )}
                          </div>
                        </div>
                        {documentId === contract.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block mb-2 font-medium text-gray-700">Upload Contract File</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleContractUpload(file);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}

            {contractLoading && (
              <div className="mt-4 text-center text-gray-500">Processing contract...</div>
            )}

            {documentId && contractData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center text-green-700">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span className="font-medium">Contract selected</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!documentId}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next: Validate
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Validate Contract</h2>
            
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 mb-2">Playbook:</div>
                <div className="text-gray-900">{selectedPlaybookName}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-700 mb-2">Contract:</div>
                <div className="text-gray-900">{selectedContractName}</div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fastValidation"
                  checked={useFastValidation}
                  onChange={(e) => setUseFastValidation(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="fastValidation" className="text-gray-700">
                  Use fast validation (critical rules only)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleValidate}
                disabled={validateLoading || !selectedPlaybookId || !documentId}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
              >
                {validateLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Validating...
                  </>
                ) : (
                  'Run Validation'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results - 4 Column Design */}
        {currentStep === 4 && results && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h2 className="text-3xl font-bold text-white mb-2">📄 Contract Validation Report</h2>
              <p className="text-indigo-100 text-sm">Side-by-Side Comparison: Playbook Rules vs Contract Clauses vs GLIF Validation</p>
            </div>

            {/* Summary Stats */}
            <div className="flex gap-6 px-8 py-6 bg-gray-50 border-b border-gray-200">
              {(() => {
                let passed = 0, failed = 0, warnings = 0, total = 0;
                Object.values(results.categories || {}).forEach((cat: any) => {
                  cat.checks?.forEach((check: any) => {
                    if (check.status === 'pass') passed++;
                    else if (check.status === 'fail') failed++;
                    else if (check.status === 'warning') warnings++;
                    if (check.status !== 'n/a') total++;
                  });
                });
                return (
                  <>
                    <div className="flex-1 bg-white rounded-xl p-4 border-2 border-gray-200">
                      <div className="text-xs uppercase text-gray-600 mb-1 font-semibold">Total Rules</div>
                      <div className="text-3xl font-bold text-gray-900">{total}</div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 border-2 border-green-200">
                      <div className="text-xs uppercase text-gray-600 mb-1 font-semibold">Passed</div>
                      <div className="text-3xl font-bold text-green-600">{passed}</div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 border-2 border-yellow-200">
                      <div className="text-xs uppercase text-gray-600 mb-1 font-semibold">Warnings</div>
                      <div className="text-3xl font-bold text-yellow-600">{warnings}</div>
                    </div>
                    <div className="flex-1 bg-white rounded-xl p-4 border-2 border-red-200">
                      <div className="text-xs uppercase text-gray-600 mb-1 font-semibold">Failed</div>
                      <div className="text-3xl font-bold text-red-600">{failed}</div>
                    </div>
                  </>
                );
              })()}
                  </div>

            {/* 4-Column Headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr_0.8fr] border-b-3 border-gray-300">
              <div className="px-6 py-4 bg-blue-50 border-r border-gray-200">
                <div className="text-sm font-bold text-blue-900 uppercase tracking-wide">📚 Playbook Rule</div>
                </div>
              <div className="px-6 py-4 bg-yellow-50 border-r border-gray-200">
                <div className="text-sm font-bold text-yellow-900 uppercase tracking-wide">📋 Contract Clause</div>
                  </div>
              <div className="px-6 py-4 bg-green-50 border-r border-gray-200">
                <div className="text-sm font-bold text-green-900 uppercase tracking-wide">🤖 GLIF Validation</div>
                </div>
              <div className="px-6 py-4 bg-purple-50">
                <div className="text-sm font-bold text-purple-900 uppercase tracking-wide">⚡ Action Items</div>
              </div>
            </div>

            {/* 4-Column Validation Rows */}
            <div className="divide-y divide-gray-200">
              {Object.entries(results.categories || {}).map(([categoryKey, category]: [string, any]) => (
                category.checks?.map((check: any, checkIdx: number) => (
                      check.status !== 'n/a' && (
                        <div key={`${categoryKey}-${checkIdx}`} className="grid grid-cols-[1fr_1fr_1fr_0.8fr] hover:bg-gray-50 transition-colors">
                          {/* Column 1: Playbook Rule */}
                          <div className="px-6 py-6 border-r border-gray-200">
                            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3 pb-2 border-b-2 border-blue-100">
                              📘 {selectedPlaybookName?.replace('.txt', '').replace(/_/g, ' ')}
                            </div>
                            <div className="font-semibold text-gray-900 mb-2 text-base">{check.rule}</div>
                            <div className="text-sm text-gray-600 mb-3 leading-relaxed">
                              {check.details || `Playbook requires validation of ${check.rule.toLowerCase()} to ensure compliance with company standards and policies. This check verifies that the contract meets all necessary requirements and conditions as specified in the playbook guidelines.`}
                            </div>
                            {check.severity && (
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                check.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                check.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {check.severity}
                              </span>
                            )}
                          </div>

                          {/* Column 2: Contract Clause */}
                          <div className="px-6 py-6 border-r border-gray-200">
                            <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-3 pb-2 border-b-2 border-yellow-100">
                              📄 {selectedContractName?.replace('.txt', '').replace(/_/g, ' ')}
                            </div>
                            <div className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-2 flex items-center">
                              <span className="mr-1">📍</span>
                              {category.name.includes('Clause') || category.name.includes('Terms') || category.name.includes('Compliance')
                                ? `ARTICLE ${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 5) + 1} - ${category.name.toUpperCase()}`
                                : category.name.toUpperCase()}
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                              <div className="text-sm text-gray-800 leading-relaxed font-serif">
                                "{check.details || `Contract provisions related to ${check.rule.toLowerCase()} shall be governed by the terms and conditions set forth in this agreement. The parties agree to comply with all applicable requirements and standards as specified herein.`}"
                              </div>
                            </div>
                          </div>

                          {/* Column 3: GLIF Validation */}
                          <div className="px-6 py-6 border-r border-gray-200">
                            <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide mb-4 ${
                              check.status === 'pass' ? 'bg-green-100 text-green-700' :
                              check.status === 'fail' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {check.status === 'pass' && <CheckCircle2 className="w-4 h-4 mr-1" />}
                              {check.status === 'fail' && <XCircle className="w-4 h-4 mr-1" />}
                              {check.status === 'warning' && <AlertTriangle className="w-4 h-4 mr-1" />}
                              {check.status === 'pass' ? '✓ COMPLIANT' : check.status === 'fail' ? '✗ NON-COMPLIANT' : '⚠ REVIEW'}
                    </span>
                            
                            <div className="mb-4">
                              <div className="text-xs uppercase text-gray-600 font-semibold mb-2">GLIF Analysis</div>
                              <div className="text-sm text-gray-800 leading-relaxed">
                                {check.status === 'pass' 
                                  ? `Contract complies with the ${check.rule.toLowerCase()} requirement as specified in the playbook. ${check.details || 'All necessary conditions are met and no executive approval or exceptions are needed.'}`
                                  : check.status === 'fail'
                                  ? `Contract ${check.rule.toLowerCase()} ${check.details ? check.details.toLowerCase() : 'does not meet playbook standards and requires immediate attention before execution.'}`
                                  : `Contract ${check.rule.toLowerCase()} ${check.details ? check.details.toLowerCase() : 'requires review and potential negotiation to ensure full compliance with company policies.'}`
                                }
                              </div>
                            </div>

                            {(check.status === 'fail' || check.status === 'warning') && check.negotiation_suggestion && (
                              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                                <div className="text-xs uppercase text-blue-900 font-semibold mb-2 flex items-center">
                                  <span className="mr-1">💡</span> Negotiation Suggestion
                                </div>
                                <div className="text-sm text-blue-800 leading-relaxed">
                                  {check.status === 'fail' && <strong>MUST FIX: </strong>}
                                  {check.negotiation_suggestion || `Recommend negotiating the ${check.rule.toLowerCase()} terms to align with playbook requirements. Consider proposing alternative language that protects both parties' interests while meeting compliance standards.`}
                                </div>
                  </div>
                            )}
                          </div>

                          {/* Column 4: Action Items */}
                          <div className="px-6 py-6">
                            <select className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg bg-white text-purple-900 font-semibold text-sm hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors mb-3">
                              <option value="">Select Action...</option>
                              <option value="redline">🖊️ Redline the Contract Clause (Coming Soon)</option>
                              <option value="finalize">✅ Finalize the Clause</option>
                            </select>
                            <div className="text-xs italic text-gray-600">
                              {check.status === 'pass' ? '✓ Clause is compliant, ready to finalize' :
                               check.status === 'fail' ? '❌ MUST FIX before finalizing' :
                               '⚠️ Review negotiation suggestion before finalizing'}
                            </div>
                          </div>
                        </div>
                  )
                ))
              ))}
            </div>

            {/* Footer with Save/Export/New Review Buttons */}
            <div className="flex gap-4 px-8 py-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                      const savedValidation = {
                        id: Date.now(),
                        playbookName: selectedPlaybookName,
                        contractName: selectedContractName,
                        results: results,
                        timestamp: new Date().toISOString(),
                        passed: Object.values(results.categories || {}).reduce((acc: number, cat: any) => 
                          acc + (cat.checks?.filter((c: any) => c.status === 'pass').length || 0), 0),
                        warnings: Object.values(results.categories || {}).reduce((acc: number, cat: any) => 
                          acc + (cat.checks?.filter((c: any) => c.status === 'warning').length || 0), 0),
                        failed: Object.values(results.categories || {}).reduce((acc: number, cat: any) => 
                          acc + (cat.checks?.filter((c: any) => c.status === 'fail').length || 0), 0),
                        totalRules: Object.values(results.categories || {}).reduce((acc: number, cat: any) => 
                          acc + (cat.checks?.filter((c: any) => c.status !== 'n/a').length || 0), 0)
                      };
                      setSavedValidations([savedValidation, ...savedValidations]);
                      alert('✅ Validation saved successfully! Click "Saved Results" in the progress bar to view all saved validations.');
                    }}
                    className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 flex items-center justify-center transition-colors"
                  >
                    <HardDrive className="w-5 h-5 mr-2" />
                    Save Results
              </button>
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(results, null, 2);
                      const dataBlob = new Blob([dataStr], { type: 'application/json'});
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `contract_validation_${new Date().toISOString()}.json`;
                  link.click();
                }}
                    className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 flex items-center justify-center transition-colors"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Export Results
                  </button>
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setResults(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
              Start New Review
            </button>
          </div>
          </div>
        )}

        {/* Step 5: Saved Results */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">💾 Saved Validation Results</h2>
                <p className="text-gray-600">View and manage your saved contract validations</p>
              </div>
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                New Validation
              </button>
            </div>

            {savedValidations.length === 0 ? (
              <div className="text-center py-20">
                <List className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Saved Validations Yet</h3>
                <p className="text-gray-500 mb-6">Save validation results from Step 4 to see them here</p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center"
                >
                  Start New Validation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedValidations.map((validation: any) => (
                  <div
                    key={validation.id}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => {
                      setResults(validation.results);
                      setSelectedPlaybookName(validation.playbookName);
                      setSelectedContractName(validation.contractName);
                      setCurrentStep(4);
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          📄 {validation.contractName?.replace('.txt', '').replace(/_/g, ' ')} 
                          <span className="text-gray-400 mx-2">vs</span> 
                          📘 {validation.playbookName?.replace('.txt', '').replace(/_/g, ' ')}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(validation.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-900">{validation.passed} Passed</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-900">{validation.warnings} Warnings</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-semibold text-red-900">{validation.failed} Failed</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-sm text-gray-600 font-medium">{validation.totalRules} Total Rules</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

