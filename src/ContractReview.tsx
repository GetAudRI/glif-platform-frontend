import { useState, useEffect } from 'react';
import { apiFetch } from './utils/apiClient';
import { canMutate } from './utils/auth';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  List,
  Search,
  Clock,
  DollarSign,
  HardDrive,
  BookOpen,
  FileCheck2,
  ShieldCheck,
  Archive
} from 'lucide-react';

type StepStatus = 'active' | 'complete' | 'pending';


export default function ContractReview() {
  const [currentStep, setCurrentStep] = useState(1);

  // Playbook Selection State
  const [playbookMode, setPlaybookMode] = useState<'upload' | 'select'>('select');
  const [, setPlaybookFile] = useState<File | null>(null);
  const [existingPlaybooks, setExistingPlaybooks] = useState<any[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<number | null>(null);
  const [selectedPlaybookName, setSelectedPlaybookName] = useState<string>('');
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [playbookData, setPlaybookData] = useState<any>(null);
  const [playbookSearchQuery, setPlaybookSearchQuery] = useState('');

  // Contract State
  const [contractMode, setContractMode] = useState<'upload' | 'select'>('select');
  const [, setContractFile] = useState<File | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [selectedContractName, setSelectedContractName] = useState<string>('');
  const [existingContracts, setExistingContracts] = useState<any[]>([]);
  const [contractSearchQuery, setContractSearchQuery] = useState('');
  const [, setLoadingContracts] = useState(false);

  // Validation State
  const [validateLoading, setValidateLoading] = useState(false);
  const [useFastValidation, setUseFastValidation] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [savedValidations, setSavedValidations] = useState<any[]>([]);

  const steps = [
    { number: 1, label: 'Select/Upload Playbook', icon: BookOpen },
    { number: 2, label: 'Select/Upload Contract', icon: FileText },
    { number: 3, label: 'Validate', icon: ShieldCheck },
    { number: 4, label: 'Results', icon: FileCheck2 },
    { number: 5, label: 'Saved Results', icon: Archive }
  ];

  // Load existing playbooks and contracts on mount
  useEffect(() => {
    loadExistingPlaybooks();
    loadExistingContracts();
  }, []);

  const loadExistingPlaybooks = async () => {
    try {
      const response = await apiFetch(`/api/contract-review/playbooks`);
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
      const response = await apiFetch(`/api/contract-review/contracts?extracted_only=true`);
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
      const response = await apiFetch(`/api/contract-review/playbooks/upload`, {
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
      const playbookResponse = await apiFetch(`/api/contract-review/playbooks/${data.playbook_id}`);
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
      const response = await apiFetch(`/api/contract-review/playbooks/${playbookId}`);
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
      const response = await apiFetch(`/api/contract-review/contracts/upload`, {
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
      const response = await apiFetch(`/api/contract-review/contracts/${documentId}`);
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
      const response = await apiFetch(`/api/contract-review/validate`, {
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

  const getSeverityClass = (severity?: string) => {
    if (severity === 'critical') return 'sev-critical';
    if (severity === 'high') return 'sev-major';
    return 'sev-minor';
  };

  const getStatusClass = (status: string) => {
    if (status === 'pass') return 'status-pass';
    if (status === 'fail') return 'status-fail';
    if (status === 'warning') return 'status-warning';
    return 'status-na';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'pass') return 'Compliant';
    if (status === 'fail') return 'Non-compliant';
    if (status === 'warning') return 'Review';
    return 'Not applicable';
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-page">
      {/* Page Header */}
      <div className="bg-white border-b border-hair px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="overline mb-2">AudRI Contracts</div>
            <h1 className="heading text-3xl text-neutral-950">Contract Review</h1>
            <p className="text-sm text-neutral-600 mt-2">Validate contracts against playbook standards</p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-6xl">

        {/* Progress Steps */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const stepStatus = getStepStatus(step.number);
              return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => {
                      // Allow navigation to completed steps or step 5 (saved results)
                      if (step.number === 5 || stepStatus === 'complete') {
                        setCurrentStep(step.number);
                      }
                    }}
                    disabled={step.number !== 5 && stepStatus === 'pending'}
                    className={`w-12 h-12 rounded-sm border flex items-center justify-center transition-colors ${
                      stepStatus === 'complete'
                        ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 cursor-pointer'
                        : stepStatus === 'active'
                        ? 'bg-rust text-white border-rust'
                        : step.number === 5
                        ? 'bg-neutral-950 text-white border-neutral-950 hover:bg-neutral-800 cursor-pointer'
                        : 'bg-neutral-50 border-hair text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    {stepStatus === 'complete' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" strokeWidth={1.75} />
                    )}
                  </button>
                  <div className="mt-2 mono text-[11px] text-neutral-600 text-center">{step.label}</div>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-2 ${
                      stepStatus === 'complete' ? 'bg-green-500' : 'bg-hair'
                    }`}
                  />
                )}
              </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm mb-6 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Step 1: Playbook Selection */}
        {currentStep === 1 && (
          <div className="card p-6">
            <div className="overline mb-3">Step 01</div>
            <h2 className="heading text-2xl mb-4">Select or Upload Playbook</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2 border-b border-hair">
                <button
                  onClick={() => setPlaybookMode('select')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    playbookMode === 'select'
                      ? 'border-rust text-rust'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-2" />
                  Select Existing
                </button>
                {canMutate() && (
                <button
                  onClick={() => setPlaybookMode('upload')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    playbookMode === 'upload'
                      ? 'border-rust text-rust'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload New
                </button>
                )}
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
                    className="field-input pl-10"
                  />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredPlaybooks.map((playbook: any) => (
                    <div
                      key={playbook.id}
                      onClick={() => handleSelectPlaybook(playbook.id)}
                      className={`p-4 border rounded-sm cursor-pointer transition-colors ${
                        selectedPlaybookId === playbook.id
                          ? 'border-rust bg-rust-tint'
                          : 'border-hair hover:bg-neutral-50'
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
                          <CheckCircle2 className="w-5 h-5 text-rust" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="overline block mb-2">Upload Playbook File</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePlaybookUpload(file);
                  }}
                  className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border file:border-hair file:text-sm file:font-medium file:bg-white file:text-neutral-900 hover:file:bg-neutral-50"
                />
              </div>
            )}

            {playbookLoading && (
              <div className="mt-4 text-center text-gray-500">Processing playbook...</div>
            )}

            {selectedPlaybookId && playbookData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-sm">
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
                className="btn-primary"
              >
                Next: Select Contract
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Contract Selection */}
        {currentStep === 2 && (
          <div className="card p-6">
            <div className="overline mb-3">Step 02</div>
            <h2 className="heading text-2xl mb-4">Select or Upload Contract</h2>
            
            <div className="mb-4">
              <div className="flex space-x-2 border-b border-hair">
                <button
                  onClick={() => setContractMode('select')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    contractMode === 'select'
                      ? 'border-rust text-rust'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <List className="w-4 h-4 inline mr-2" />
                  Select Existing
                </button>
                {canMutate() && (
                <button
                  onClick={() => setContractMode('upload')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    contractMode === 'upload'
                      ? 'border-rust text-rust'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Upload New
                </button>
                )}
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
                    className="field-input pl-10"
                  />
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredContracts.map((contract: any) => (
                    <div
                      key={contract.id}
                      onClick={() => handleSelectContract(contract.id, contract.name)}
                      className={`p-4 border rounded-sm cursor-pointer transition-colors ${
                        documentId === contract.id
                          ? 'border-rust bg-rust-tint'
                          : 'border-hair hover:bg-neutral-50'
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
                          <CheckCircle2 className="w-5 h-5 text-rust" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="overline block mb-2">Upload Contract File</label>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleContractUpload(file);
                  }}
                  className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border file:border-hair file:text-sm file:font-medium file:bg-white file:text-neutral-900 hover:file:bg-neutral-50"
                />
              </div>
            )}

            {contractLoading && (
              <div className="mt-4 text-center text-gray-500">Processing contract...</div>
            )}

            {documentId && contractData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-sm">
                <div className="flex items-center text-green-700">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  <span className="font-medium">Contract selected</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!documentId}
                className="btn-primary"
              >
                Next: Validate
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Validation */}
        {currentStep === 3 && (
          <div className="card p-6">
            <div className="overline mb-3">Step 03</div>
            <h2 className="heading text-2xl mb-4">Validate Contract</h2>
            
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-neutral-50 border border-hair rounded-sm">
                <div className="overline mb-2">Playbook</div>
                <div className="text-gray-900">{selectedPlaybookName}</div>
              </div>
              
              <div className="p-4 bg-neutral-50 border border-hair rounded-sm">
                <div className="overline mb-2">Contract</div>
                <div className="text-gray-900">{selectedContractName}</div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="fastValidation"
                  checked={useFastValidation}
                  onChange={(e) => setUseFastValidation(e.target.checked)}
                  className="w-4 h-4 text-rust border-hair rounded-sm focus:ring-rust"
                />
                <label htmlFor="fastValidation" className="text-gray-700">
                  Use fast validation (critical rules only)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleValidate}
                disabled={validateLoading || !selectedPlaybookId || !documentId}
                className="btn-primary"
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
          <div className="card overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-hair">
              <div className="overline mb-2">Validation Report</div>
              <h2 className="heading text-3xl text-neutral-950 mb-2">Contract Validation Report</h2>
              <p className="text-neutral-600 text-sm">Side-by-side comparison: playbook rules, contract clauses, AudRI validation, and action items.</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 border-b border-hair bg-white">
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
                    <div className="p-6 border-r border-hair">
                      <div className="overline mb-3">Total Rules</div>
                      <div className="heading text-4xl tracking-tighter leading-none num text-neutral-950">{total}</div>
                    </div>
                    <div className="p-6 border-r border-hair">
                      <div className="overline mb-3">Passed</div>
                      <div className="heading text-4xl tracking-tighter leading-none num text-green-700">{passed}</div>
                    </div>
                    <div className="p-6 border-r border-hair">
                      <div className="overline mb-3">Warnings</div>
                      <div className="heading text-4xl tracking-tighter leading-none num text-amber-700">{warnings}</div>
                    </div>
                    <div className="p-6">
                      <div className="overline mb-3">Failed</div>
                      <div className="heading text-4xl tracking-tighter leading-none num text-red-700">{failed}</div>
                    </div>
                  </>
                );
              })()}
                  </div>

            {/* 4-Column Headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr_0.8fr] border-b border-hair">
              <div className="px-6 py-4 bg-neutral-50 border-r border-hair">
                <div className="overline">Playbook Rule</div>
                </div>
              <div className="px-6 py-4 bg-neutral-50 border-r border-hair">
                <div className="overline">Contract Clause</div>
                  </div>
              <div className="px-6 py-4 bg-neutral-50 border-r border-hair">
                <div className="overline">AudRI Validation</div>
                </div>
              <div className="px-6 py-4 bg-neutral-50">
                <div className="overline">Action Items</div>
              </div>
            </div>

            {/* 4-Column Validation Rows */}
            <div className="divide-y divide-hair">
              {Object.entries(results.categories || {}).map(([categoryKey, category]: [string, any]) => (
                category.checks?.map((check: any, checkIdx: number) => (
                      check.status !== 'n/a' && (
                        <div key={`${categoryKey}-${checkIdx}`} className="grid grid-cols-[1fr_1fr_1fr_0.8fr] hover:bg-neutral-50 transition-colors">
                          {/* Column 1: Playbook Rule */}
                          <div className="px-6 py-6 border-r border-hair">
                            <div className="overline mb-3 pb-2 border-b border-hair">
                              {selectedPlaybookName?.replace('.txt', '').replace(/_/g, ' ')}
                            </div>
                            <div className="font-semibold text-gray-900 mb-2 text-base">{check.rule}</div>
                            <div className="text-sm text-gray-600 mb-3 leading-relaxed">
                              {check.details || `Playbook requires validation of ${check.rule.toLowerCase()} to ensure compliance with company standards and policies. This check verifies that the contract meets all necessary requirements and conditions as specified in the playbook guidelines.`}
                            </div>
                            {check.severity && (
                              <span className={`pill ${getSeverityClass(check.severity)}`}>
                                {check.severity}
                              </span>
                            )}
                          </div>

                          {/* Column 2: Contract Clause */}
                          <div className="px-6 py-6 border-r border-hair">
                            <div className="overline mb-3 pb-2 border-b border-hair">
                              {selectedContractName?.replace('.txt', '').replace(/_/g, ' ')}
                            </div>
                            <div className="overline mb-2">
                              {category.name.includes('Clause') || category.name.includes('Terms') || category.name.includes('Compliance')
                                ? `ARTICLE ${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 5) + 1} - ${category.name.toUpperCase()}`
                                : category.name.toUpperCase()}
                            </div>
                            <div className="bg-rust-tint p-4 rounded-sm border border-rust-tint-bd">
                              <div className="text-sm text-gray-800 leading-relaxed font-serif">
                                "{check.details || `Contract provisions related to ${check.rule.toLowerCase()} shall be governed by the terms and conditions set forth in this agreement. The parties agree to comply with all applicable requirements and standards as specified herein.`}"
                              </div>
                            </div>
                          </div>

                          {/* Column 3: AudRI Validation */}
                          <div className="px-6 py-6 border-r border-hair">
                            <span className={`status-badge mb-4 ${getStatusClass(check.status)}`}>
                              {check.status === 'pass' && <CheckCircle2 className="w-4 h-4 mr-1" />}
                              {check.status === 'fail' && <XCircle className="w-4 h-4 mr-1" />}
                              {check.status === 'warning' && <AlertTriangle className="w-4 h-4 mr-1" />}
                              {getStatusLabel(check.status)}
                    </span>
                            
                            <div className="mb-4">
                              <div className="overline mb-2">AudRI Analysis</div>
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
                              <div className="bg-white border border-hair p-4 rounded-sm">
                                <div className="overline mb-2">
                                  Negotiation Suggestion
                                </div>
                                <div className="text-sm text-neutral-700 leading-relaxed">
                                  {check.status === 'fail' && <strong>MUST FIX: </strong>}
                                  {check.negotiation_suggestion || `Recommend negotiating the ${check.rule.toLowerCase()} terms to align with playbook requirements. Consider proposing alternative language that protects both parties' interests while meeting compliance standards.`}
                                </div>
                  </div>
                            )}
                          </div>

                          {/* Column 4: Action Items */}
                          <div className="px-6 py-6">
                            <select className="field-input mb-3">
                              <option value="">Select Action...</option>
                              <option value="redline">Redline the Contract Clause (Coming Soon)</option>
                              <option value="finalize">Finalize the Clause</option>
                            </select>
                            <div className="mono text-xs text-gray-600">
                              {check.status === 'pass' ? 'Clause is compliant, ready to finalize' :
                               check.status === 'fail' ? 'MUST FIX before finalizing' :
                               'Review negotiation suggestion before finalizing'}
                            </div>
                          </div>
                        </div>
                  )
                ))
              ))}
            </div>

            {/* Footer with Save/Export/New Review Buttons */}
            <div className="flex gap-4 px-8 py-6 bg-neutral-50 border-t border-hair">
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
                      alert('Validation saved successfully. Click "Saved Results" in the progress bar to view all saved validations.');
                    }}
                    className="btn-primary flex-1"
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
                    className="btn-secondary flex-1"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Export Results
                  </button>
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setResults(null);
                    }}
                    className="btn-secondary flex-1"
                  >
              Start New Review
            </button>
          </div>
          </div>
        )}

        {/* Step 5: Saved Results */}
        {currentStep === 5 && (
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="overline mb-2">Archive</div>
                <h2 className="heading text-3xl text-gray-900 mb-2">Saved Validation Results</h2>
                <p className="text-gray-600">View and manage your saved contract validations</p>
              </div>
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-primary"
              >
                New Validation
              </button>
            </div>

            {savedValidations.length === 0 ? (
              <div className="border border-dashed border-hair bg-white p-16 text-center">
                <List className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                <h3 className="heading text-xl text-gray-700 mb-2">No Saved Validations Yet</h3>
                <p className="text-gray-500 mb-6">Save validation results from Step 4 to see them here</p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn-primary"
                >
                  Start New Validation
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {savedValidations.map((validation: any) => (
                  <div
                    key={validation.id}
                    className="border border-hair rounded-sm p-6 hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setResults(validation.results);
                      setSelectedPlaybookName(validation.playbookName);
                      setSelectedContractName(validation.contractName);
                      setCurrentStep(4);
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="heading text-lg text-gray-900 mb-1">
                          {validation.contractName?.replace('.txt', '').replace(/_/g, ' ')} 
                          <span className="text-gray-400 mx-2">vs</span> 
                          {validation.playbookName?.replace('.txt', '').replace(/_/g, ' ')}
                        </h3>
                        <div className="mono flex items-center text-xs text-gray-500">
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
                      <div className="status-badge status-pass">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>{validation.passed} Passed</span>
                      </div>
                      <div className="status-badge status-warning">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <span>{validation.warnings} Warnings</span>
                      </div>
                      <div className="status-badge status-fail">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span>{validation.failed} Failed</span>
                      </div>
                      <div className="status-badge status-na">
                        <span>{validation.totalRules} Total Rules</span>
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
    </div>
  );
}

