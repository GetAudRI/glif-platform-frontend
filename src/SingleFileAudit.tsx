import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Download, List, Plus, Search, Clock, DollarSign, HardDrive } from 'lucide-react';
import { listDocuments, uploadDocument, listPolicyDeclarations, uploadPolicyDeclaration } from './services/api';

type StepStatus = 'active' | 'complete' | 'pending';

export default function SingleFileAudit() {
  const [currentStep, setCurrentStep] = useState(1);

  // Policy Declaration Selection State
  const [policyDeclarationMode, setPolicyDeclarationMode] = useState<'upload' | 'select'>('select');
  const [policyDeclarationFile, setPolicyDeclarationFile] = useState<File | null>(null);
  const [existingPolicyDeclarations, setExistingPolicyDeclarations] = useState<any[]>([]);
  const [selectedPolicyDeclarationId, setSelectedPolicyDeclarationId] = useState<number | null>(null);
  const [selectedPolicyDeclarationName, setSelectedPolicyDeclarationName] = useState<string>('');
  const [policyDeclarationLoading, setPolicyDeclarationLoading] = useState(false);
  const [policyDeclarationData, setPolicyDeclarationData] = useState<any>(null);
  const [policyDeclarationSearchQuery, setPolicyDeclarationSearchQuery] = useState('');
  const [loadingPolicyDeclarations, setLoadingPolicyDeclarations] = useState(false);

  // SOP Selection State
  const [sopMode, setSopMode] = useState<'upload' | 'select'>('select');
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [existingPlaybooks, setExistingPlaybooks] = useState<any[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<number | null>(null);
  const [selectedPlaybookName, setSelectedPlaybookName] = useState<string>('');
  const [sopLoading, setSopLoading] = useState(false);
  const [sopData, setSopData] = useState<any>(null);

  // Test helper
  // useEffect(() => {
  //   (window as any).simulateClaimUpload = (docId: number, data: any) => {
  //     setDocumentId(docId);
  //     setClaimData(data);
  //     setClaimFile(new File(["dummy"], "test_claim.txt", { type: "text/plain" }));
  //     setCurrentStep(4);
  //   };
  // }, []);

  // Team Checkposts State
  const [checkpostMode, setCheckpostMode] = useState<'skip' | 'upload' | 'select'>('skip');
  const [checkpostFile, setCheckpostFile] = useState<File | null>(null);
  const [selectedTeamCheckpostFileId, setSelectedTeamCheckpostFileId] = useState<number | null>(null);
  const [existingTeamCheckpostFiles, setExistingTeamCheckpostFiles] = useState<any[]>([]);
  const [checkpostLoading, setCheckpostLoading] = useState(false);
  const [checkpostData, setCheckpostData] = useState<any>(null);

  // Claim State
  const [claimMode, setClaimMode] = useState<'upload' | 'select'>('select');
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimData, setClaimData] = useState<any>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [existingClaims, setExistingClaims] = useState<any[]>([]);
  const [claimSearchQuery, setClaimSearchQuery] = useState('');
  const [loadingClaims, setLoadingClaims] = useState(false);

  // Validation State
  const [validateLoading, setValidateLoading] = useState(false);
  const [useFastValidation, setUseFastValidation] = useState(true); // Default to fast validation
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [csvFile, setCsvFile] = useState('');
  const [resultsFile, setResultsFile] = useState('');

  const steps = [
    { number: 1, label: 'Select/Upload Policy Declaration', icon: '📋' },
    { number: 2, label: 'Select/Upload SOP', icon: '📄' },
    { number: 3, label: 'Team Checkposts (Optional)', icon: '📋' },
    { number: 4, label: 'Upload Claim', icon: '🚗' },
    { number: 5, label: 'Validate', icon: '⚡' },
    { number: 6, label: 'Results', icon: '📊' }
  ];

  // Load existing policy declarations, playbooks, checkposts, and claims on mount
  useEffect(() => {
    // Fetch policy declarations
    loadExistingPolicyDeclarations();

    // Fetch playbooks
    fetch('http://localhost:5002/api/audit-oversight/playbooks')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExistingPlaybooks(data.playbooks);
        }
      })
      .catch(err => console.error('Failed to load playbooks:', err));

    // Fetch team checkpost files
    fetch('http://localhost:5002/api/audit-oversight/team-checkposts?show_all=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExistingTeamCheckpostFiles(data.team_checkpost_files || []);
        }
      })
      .catch(err => console.error('Failed to load team checkpost files:', err));
    
    // Load existing claims when component mounts or when entering step 4
    loadExistingClaims();
  }, []);

  // Load existing policy declarations function
  const loadExistingPolicyDeclarations = async () => {
    setLoadingPolicyDeclarations(true);
    try {
      const data = await listPolicyDeclarations({
        extractedOnly: true
      });
      if (data.success) {
        setExistingPolicyDeclarations(data.policy_declarations || []);
      }
    } catch (err) {
      console.error('Failed to load existing policy declarations:', err);
    } finally {
      setLoadingPolicyDeclarations(false);
    }
  };

  // Filter policy declarations based on search query
  const filteredPolicyDeclarations = existingPolicyDeclarations.filter((pd: any) => {
    if (!policyDeclarationSearchQuery.trim()) return true;
    const query = policyDeclarationSearchQuery.toLowerCase();
    return pd.name?.toLowerCase().includes(query);
  });

  // Load existing claims function
  const loadExistingClaims = async () => {
    setLoadingClaims(true);
    try {
      const data = await listDocuments({
        docType: 'claim',
        limit: 50,
        extractedOnly: true
      });
      if (data.success) {
        setExistingClaims(data.documents || []);
      }
    } catch (err) {
      console.error('Failed to load existing claims:', err);
    } finally {
      setLoadingClaims(false);
    }
  };

  // Filter claims based on search query
  const filteredClaims = existingClaims.filter((claim: any) => {
    if (!claimSearchQuery.trim()) return true;
    const query = claimSearchQuery.toLowerCase();
    return claim.name?.toLowerCase().includes(query);
  });

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
      const response = await fetch('http://localhost:5002/api/audit-oversight/playbooks/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload SOP');

      const data = await response.json();
      setSelectedPlaybookId(data.playbook_id);

      // Fetch the playbook details to get extracted rules
      const playbookResponse = await fetch(`http://localhost:5002/api/audit-oversight/playbooks/${data.playbook_id}`);
      const playbookData = await playbookResponse.json();

      if (playbookData.success) {
        const rules = playbookData.playbook.extracted_rules;
        console.log('Playbook data loaded (UPLOAD):', {
          playbook_id: data.playbook_id,
          extracted_rules: rules,
          rules_type: typeof rules,
          is_array: Array.isArray(rules),
          rules_length: Array.isArray(rules) ? rules.length : 'N/A',
          rules_structure: JSON.stringify(rules).substring(0, 500)
        });
        setSopData(rules);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process SOP');
    } finally {
      setSopLoading(false);
    }
  };

  const handleSelectPlaybook = async (playbookId: number) => {
    setSelectedPlaybookId(playbookId);
    setSopLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5002/api/audit-oversight/playbooks/${playbookId}`);
      const data = await response.json();

      if (!data.success) throw new Error('Failed to load playbook');

      const rules = data.playbook.extracted_rules;
      console.log('Loaded playbook data (SELECT):', {
        playbook_id: playbookId,
        extracted_rules: rules,
        rules_type: typeof rules,
        is_array: Array.isArray(rules),
        rules_length: Array.isArray(rules) ? rules.length : 'N/A',
        rules_structure: JSON.stringify(rules).substring(0, 500)
      });
      setSopData(rules);
      setSelectedPlaybookName(data.playbook.name);
      setSopFile(null); // No file uploaded, selected from DB
    } catch (err: any) {
      setError(err.message || 'Failed to load playbook');
    } finally {
      setSopLoading(false);
    }
  };

  const handleCheckpostUpload = async (file: File) => {
    setCheckpostFile(file);
    setCheckpostLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5002/api/audit-oversight/checkposts/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload checkpost');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload team checkpost file');
      }

      // Store the team checkpost file ID (new model)
      if (data.team_checkpost_file_id) {
        setSelectedTeamCheckpostFileId(data.team_checkpost_file_id);
        setCheckpostData({ 
          count: data.checkposts_count || 0,
          team_checkpost_file_id: data.team_checkpost_file_id,
          source_file: data.source_file || file.name
        });
        console.log('✅ Team checkpost file uploaded:', data.team_checkpost_file_id);
        
        // Reload team checkpost files list
        const listResponse = await fetch('http://localhost:5002/api/audit-oversight/team-checkposts?show_all=true');
        const listData = await listResponse.json();
        if (listData.success) {
          setExistingTeamCheckpostFiles(listData.team_checkpost_files || []);
        }
      } else {
        throw new Error('No team checkpost file ID returned from server');
      }
    } catch (err: any) {
      console.error('Checkpost upload error:', err);
      setError(err.message || 'Failed to process checkpost');
    } finally {
      setCheckpostLoading(false);
    }
  };

  const handleSelectTeamCheckpostFile = (teamCheckpostFileId: number) => {
    setSelectedTeamCheckpostFileId(teamCheckpostFileId);
    const selectedFile = existingTeamCheckpostFiles.find((f: any) => f.id === teamCheckpostFileId);
    setCheckpostData({ 
      count: selectedFile?.checkposts_count || 0,
      team_checkpost_file_id: teamCheckpostFileId,
      source_file: selectedFile?.name
    });
    setCheckpostFile(null); // No file uploaded, selected from DB
    console.log('✅ Selected team checkpost file:', teamCheckpostFileId);
  };

  const handleClaimUpload = async (file: File) => {
    setClaimFile(file);
    setClaimLoading(true);
    setError('');

    // Validate file before upload
    if (!file) {
      setError('No file selected');
      setClaimLoading(false);
      return;
    }

    // Check file size (16MB max)
    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 16MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      setClaimLoading(false);
      return;
    }

    try {
      const data = await uploadDocument(file);

      setDocumentId(data.document_id);
      setClaimData(data.extracted_data);
      
      // Show message if extraction was skipped (cached)
      if (data.already_extracted) {
        console.log('✅ Claim already extracted - using cached data');
      }
      
      // Reload claims list to include the newly uploaded one
      await loadExistingClaims();
    } catch (err: any) {
      console.error('Claim upload error:', err);
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Could not connect to server. Make sure the backend is running on port 5002.');
      } else {
        setError(err.message || 'Failed to process claim');
      }
    } finally {
      setClaimLoading(false);
    }
  };

  const handleSelectExistingClaim = async (claim: any) => {
    setClaimLoading(true);
    setError('');
    
    try {
      // Fetch the full claim data
      const response = await fetch(`http://localhost:5002/api/audit-oversight/documents/${claim.id}`);
      const data = await response.json();
      
      if (!data.success || !data.document) {
        throw new Error('Failed to load claim data');
      }
      
      setDocumentId(claim.id);
      setClaimData(data.document.extracted_data);
      setClaimFile(new File([], claim.name)); // Create a file object for display
      
      console.log('✅ Selected existing claim:', claim.name);
    } catch (err: any) {
      console.error('Error selecting claim:', err);
      setError(err.message || 'Failed to load claim');
    } finally {
      setClaimLoading(false);
    }
  };

  // Policy Declaration handlers
  const handlePolicyDeclarationUpload = async (file: File) => {
    setPolicyDeclarationFile(file);
    setPolicyDeclarationLoading(true);
    setError('');

    try {
      const data = await uploadPolicyDeclaration(file);

      setSelectedPolicyDeclarationId(data.policy_declaration_id);
      setSelectedPolicyDeclarationName(data.name);
      setPolicyDeclarationData({
        declarations_count: data.declarations_count,
        total_cost: data.total_cost,
        already_extracted: data.already_extracted
      });
      
      if (data.already_extracted) {
        console.log('✅ Policy Declaration already extracted - using cached data');
      }
      
      // Reload policy declarations list
      await loadExistingPolicyDeclarations();
    } catch (err: any) {
      console.error('Policy Declaration upload error:', err);
      setError(err.message || 'Failed to process Policy Declaration');
    } finally {
      setPolicyDeclarationLoading(false);
    }
  };

  const handleSelectExistingPolicyDeclaration = (pd: any) => {
    setSelectedPolicyDeclarationId(pd.id);
    setSelectedPolicyDeclarationName(pd.name);
    setPolicyDeclarationData({
      declarations_count: pd.declarations_count,
      total_cost: pd.total_cost
    });
    setPolicyDeclarationFile(null);
    console.log('✅ Selected existing Policy Declaration:', pd.name);
  };

  const handleValidate = async () => {
    setValidateLoading(true);
    setError('');

    // Validate required data
    if (!selectedPlaybookId) {
      setError('Please select or upload an SOP first');
      setValidateLoading(false);
      return;
    }

    if (!documentId) {
      setError('Please upload a claim document first');
      setValidateLoading(false);
      return;
    }

    const requestBody: any = {
      playbook_id: selectedPlaybookId,
      document_id: documentId,
      use_fast_validation: useFastValidation
    };
    
    // Include Policy Declaration ID if selected
    if (selectedPolicyDeclarationId) {
      requestBody.policy_declaration_id = selectedPolicyDeclarationId;
      console.log('✅ Including Policy Declaration in validation:', selectedPolicyDeclarationId);
    } else {
      console.log('⚠️  No Policy Declaration selected (optional)');
    }
    
    // Only include team_checkpost_file_id if one is selected
    if (selectedTeamCheckpostFileId) {
      requestBody.team_checkpost_file_id = selectedTeamCheckpostFileId;
      console.log('✅ Including team checkpost file in validation:', selectedTeamCheckpostFileId);
    } else {
      console.log('⚠️  No team checkpost file selected');
    }
    
    console.log('Starting validation with:', {
      playbook_id: selectedPlaybookId,
      team_checkpost_file_id: selectedTeamCheckpostFileId,
      document_id: documentId,
      checkpost_data: checkpostData,
      requestBody
    });

    try {
      // Start audit with database IDs
      const response = await fetch('http://localhost:5002/api/audit-oversight/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start audit');
      }

      const data = await response.json();

      console.log('Validation response:', data);

      // Store audit ID and show results
      setResults({
        audit_id: data.audit_id,
        policy_declaration_name: data.policy_declaration_name || selectedPolicyDeclarationName,
        policy_declarations_count: data.policy_declarations_count || 0,
        playbook_name: data.playbook_name || selectedPlaybookName || sopFile?.name,
        document_name: data.document_name || claimFile?.name,
        total_rules: data.total_rules,
        checkposts_count: data.checkposts_count,
        message: data.message,
        // Include validation results if available
        is_valid: data.is_valid !== undefined ? data.is_valid : false,
        claim_id: data.claim_id,
        rule_checks: data.rule_checks || [],
        errors: data.errors || [],
        warnings: data.warnings || [],
        // Include cost and AI metadata
        total_cost: data.total_cost || 0,
        playbook_cost: data.playbook_cost || 0,
        document_cost: data.document_cost || 0,
        policy_declaration_cost: data.policy_declaration_cost || 0,
        total_tokens: data.total_tokens || 0,
        input_tokens: data.input_tokens || 0,
        output_tokens: data.output_tokens || 0,
        ai_model: data.ai_model || 'claude-3.5-sonnet',
        confidence_score: data.confidence_score || 85,
        validation_timestamp: data.validation_timestamp
      });

      setCurrentStep(6);
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
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${status === 'active'
                    ? 'bg-blue-600 text-white'
                    : status === 'complete'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {status === 'complete' ? '✓' : step.number}
                </div>
                <div
                  className={`text-sm ${status === 'active' ? 'text-blue-900 font-semibold' : 'text-gray-600'
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

      {/* Step 1: Select/Upload Policy Declaration */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 1: Select or Upload Policy Declaration 📋
          </h2>
          <p className="text-gray-600 mb-6">
            Choose an existing Policy Declaration from the database or upload a new one. AI will extract declarations.
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setPolicyDeclarationMode('select')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${policyDeclarationMode === 'select'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <List className="inline-block w-5 h-5 mr-2" />
              Select Existing
            </button>
            <button
              onClick={() => setPolicyDeclarationMode('upload')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${policyDeclarationMode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Plus className="inline-block w-5 h-5 mr-2" />
              Upload New
            </button>
          </div>

          {/* Select Existing Mode */}
          {policyDeclarationMode === 'select' && (
            <div>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search policy declarations..."
                    value={policyDeclarationSearchQuery}
                    onChange={(e) => setPolicyDeclarationSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              {loadingPolicyDeclarations ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading policy declarations...</p>
                </div>
              ) : filteredPolicyDeclarations.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No policy declarations found.</p>
                  <button
                    onClick={() => setPolicyDeclarationMode('upload')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upload Your First Policy Declaration
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredPolicyDeclarations.map((pd) => (
                    <div
                      key={pd.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedPolicyDeclarationId === pd.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      onClick={() => handleSelectExistingPolicyDeclaration(pd)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{pd.name}</h4>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(pd.uploaded_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {pd.declarations_count || 0} declarations
                            </span>
                            {pd.total_cost && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ${pd.total_cost.toFixed(4)}
                              </span>
                            )}
                            {pd.file_size_formatted && (
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-4 h-4" />
                                {pd.file_size_formatted}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedPolicyDeclarationId === pd.id && (
                          <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload New Mode */}
          {policyDeclarationMode === 'upload' && (
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept=".pdf,.txt,.docx,.doc"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePolicyDeclarationUpload(file);
                  }}
                  className="hidden"
                  id="policy-declaration-upload"
                />
                <label
                  htmlFor="policy-declaration-upload"
                  className="cursor-pointer inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {policyDeclarationLoading ? 'Processing...' : 'Choose Policy Declaration File'}
                </label>
                <p className="text-sm text-gray-500 mt-2">PDF, TXT, DOCX, or DOC files</p>
              </div>
              {policyDeclarationFile && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    Selected: <span className="font-semibold">{policyDeclarationFile.name}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Next Button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => {
                if (selectedPolicyDeclarationId) {
                  setCurrentStep(2);
                } else {
                  setError('Please select or upload a Policy Declaration first');
                }
              }}
              disabled={!selectedPolicyDeclarationId && !policyDeclarationData}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next: Select SOP →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select/Upload SOP */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 2: Select or Upload SOP 📄
          </h2>
          <p className="text-gray-600 mb-6">
            Choose an existing SOP from the database or upload a new one. AI will extract validation rules.
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSopMode('select')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${sopMode === 'select'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <List className="inline-block w-5 h-5 mr-2" />
              Select Existing
            </button>
            <button
              onClick={() => setSopMode('upload')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${sopMode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Plus className="inline-block w-5 h-5 mr-2" />
              Upload New
            </button>
          </div>

          {/* Select Existing Mode */}
          {sopMode === 'select' && (
            <div>
              {existingPlaybooks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No SOPs found in database.</p>
                  <button
                    onClick={() => setSopMode('upload')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upload Your First SOP
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingPlaybooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedPlaybookId === playbook.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      onClick={() => handleSelectPlaybook(playbook.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{playbook.name}</h4>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>📅 {new Date(playbook.uploaded_at).toLocaleDateString()}</span>
                            <span>📊 {playbook.rules_count} rules</span>
                            {playbook.total_cost && <span>💰 ${playbook.total_cost.toFixed(4)}</span>}
                          </div>
                        </div>
                        {selectedPlaybookId === playbook.id && (
                          <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload New Mode */}
          {sopMode === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${sopLoading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
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
          )}

          {/* Loading State */}
          {sopLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3" />
              <p className="text-gray-600">
                {sopMode === 'upload' ? 'Uploading and extracting rules with AI...' : 'Loading playbook...'}
              </p>
            </div>
          )}

          {/* Rules Preview */}
          {sopData && !sopLoading && (
            <>
              <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">
                    {sopMode === 'upload' ? 'SOP Uploaded & Rules Extracted!' : 'Playbook Loaded!'}
                  </h4>
                </div>
                <p className="text-sm text-green-800">
                  {sopMode === 'upload'
                    ? 'Rules have been extracted and saved to database.'
                    : 'Using existing rules from database (no AI cost!).'}
                </p>
              </div>

              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Extracted Rules Preview:</h4>
                <pre className="text-sm text-blue-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {JSON.stringify(sopData, null, 2)}
                </pre>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Next: Team Checkposts →
                </button>
              </div>
            </>
          )}

          {/* Navigation Buttons - Show when SOP is selected but preview not shown yet */}
          {selectedPlaybookId && !sopData && !sopLoading && (
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!selectedPlaybookId}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next: Team Checkposts →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Team Checkposts (Optional) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 3: Team Checkposts (Optional) 📋
          </h2>
          <p className="text-gray-600 mb-6">
            Add team-specific validation rules from a checklist, select existing checkposts, or skip this step.
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setCheckpostMode('skip')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${checkpostMode === 'skip'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Skip
            </button>
            <button
              onClick={() => {
                setCheckpostMode('select');
                // Reload team checkpost files when switching to select mode
                fetch('http://localhost:5002/api/audit-oversight/team-checkposts?show_all=true')
                  .then(res => res.json())
                  .then(data => {
                    if (data.success) {
                      setExistingTeamCheckpostFiles(data.team_checkpost_files || []);
                    }
                  })
                  .catch(err => console.error('Failed to load team checkpost files:', err));
              }}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${checkpostMode === 'select'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <List className="inline-block w-5 h-5 mr-2" />
              Select Existing ({existingTeamCheckpostFiles.length})
            </button>
            <button
              onClick={() => setCheckpostMode('upload')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${checkpostMode === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Plus className="inline-block w-5 h-5 mr-2" />
              Upload New
            </button>
          </div>

          {/* Skip Mode */}
          {checkpostMode === 'skip' && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">No team checkposts will be used for validation.</p>
              <p className="text-sm text-gray-500">Only SOP rules will be applied.</p>
            </div>
          )}

          {/* Select Existing Mode */}
          {checkpostMode === 'select' && (
            <div>
              {existingTeamCheckpostFiles.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No team checkpost files found in database.</p>
                  <button
                    onClick={() => setCheckpostMode('upload')}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Upload Your First Checkpost File
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-3">Select a team checkpost file to include:</p>
                  {existingTeamCheckpostFiles.map((file: any) => (
                    <div
                      key={file.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedTeamCheckpostFileId === file.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                      onClick={() => {
                        if (selectedTeamCheckpostFileId === file.id) {
                          // Deselect if already selected
                          setSelectedTeamCheckpostFileId(null);
                          setCheckpostData(null);
                        } else {
                          // Select this file
                          handleSelectTeamCheckpostFile(file.id);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{file.name}</h4>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>📅 {new Date(file.created_at).toLocaleDateString()}</span>
                            <span>📋 {file.checkposts_count || 0} checkposts</span>
                            {file.linked_playbook && (
                              <span className="text-blue-600">🔗 Linked to: {file.linked_playbook}</span>
                            )}
                          </div>
                        </div>
                        {selectedTeamCheckpostFileId === file.id && (
                          <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload New Mode */}
          {checkpostMode === 'upload' && (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${checkpostLoading ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                }`}
              onClick={() => !checkpostLoading && document.getElementById('checkpostInput')?.click()}
            >
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {checkpostFile ? checkpostFile.name : 'Drop team checklist here'}
              </h3>
              <p className="text-gray-600 mb-2">or click to browse</p>
              <p className="text-sm text-gray-500">Supports: PDF, TXT, DOCX (max 16MB)</p>
              <input
                id="checkpostInput"
                type="file"
                accept=".pdf,.txt,.docx"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleCheckpostUpload(e.target.files[0])}
              />
            </div>
          )}

          {/* Loading State */}
          {checkpostLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3" />
              <p className="text-gray-600">Uploading and extracting checkposts with AI...</p>
            </div>
          )}

          {/* Success State */}
          {checkpostData && !checkpostLoading && checkpostMode !== 'skip' && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">
                  {checkpostMode === 'upload' ? 'Checkposts Uploaded!' : 'Checkposts Selected!'}
                </h4>
              </div>
              <p className="text-sm text-green-800">
                {checkpostData.count} checkpost{checkpostData.count !== 1 ? 's' : ''} will be used for validation.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              disabled={checkpostMode === 'upload' && checkpostLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              Next: Upload Claim →
            </button>
          </div>
        </div>
      )}


      {/* Step 3: Upload/Select Claim */}
      {currentStep === 4 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 4: Select or Upload Claim Document 🚗
          </h2>
          <p className="text-gray-600 mb-6">
            Choose an existing extracted claim or upload a new one. Already extracted claims skip AI processing.
          </p>

          {/* Mode Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setClaimMode('select');
                loadExistingClaims();
              }}
              className={`px-6 py-3 font-medium transition-colors ${
                claimMode === 'select'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Select Existing ({existingClaims.length})
            </button>
            <button
              onClick={() => setClaimMode('upload')}
              className={`px-6 py-3 font-medium transition-colors ${
                claimMode === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload New
            </button>
          </div>

          {/* Select Existing Claim Mode */}
          {claimMode === 'select' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search claims by filename..."
                  value={claimSearchQuery}
                  onChange={(e) => setClaimSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Claims List */}
              {loadingClaims ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-3" />
                  <p className="text-gray-600">Loading existing claims...</p>
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-2">
                    {claimSearchQuery ? 'No claims found matching your search.' : 'No extracted claims found.'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {claimSearchQuery ? 'Try a different search term or' : ''} Upload a new claim to get started.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-96 overflow-y-auto">
                  {filteredClaims.map((claim: any) => (
                    <button
                      key={claim.id}
                      onClick={() => handleSelectExistingClaim(claim)}
                      disabled={claimLoading}
                      className={`w-full p-4 text-left hover:bg-blue-50 transition-colors ${
                        documentId === claim.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      } ${claimLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{claim.name}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            {claim.uploaded_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(claim.uploaded_at).toLocaleDateString()}</span>
                              </div>
                            )}
                            {claim.file_size_display && (
                              <div className="flex items-center gap-1">
                                <HardDrive className="w-4 h-4" />
                                <span>{claim.file_size_display}</span>
                              </div>
                            )}
                            {claim.total_cost !== undefined && claim.total_cost > 0 && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span>${claim.total_cost.toFixed(6)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {documentId === claim.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload New Claim Mode */}
          {claimMode === 'upload' && (
            <div>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  claimLoading
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
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
            </div>
          )}

          {/* Extracted Data Preview */}
          {claimData && !claimLoading && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Extracted Claim Data Preview:</h4>
              <pre className="text-sm text-blue-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {JSON.stringify(claimData, null, 2)}
              </pre>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Back
            </button>
            {claimData && !claimLoading && (
              <button
                onClick={() => setCurrentStep(5)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Next: Validate →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Validate */}
      {currentStep === 5 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 5: Run Validation ⚡</h2>
          <p className="text-gray-600 mb-6">Ready to validate the claim against extracted rules.</p>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            {selectedPolicyDeclarationId && (
              <>
                <div className="flex justify-between mb-3">
                  <strong className="text-gray-900">Policy Declaration:</strong>
                  <span className="text-gray-700">{selectedPolicyDeclarationName || 'Selected from Database'}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <strong className="text-gray-900">Policy Declarations Count:</strong>
                  <span className="text-gray-700">{policyDeclarationData?.declarations_count || 0} declarations</span>
                </div>
              </>
            )}
            <div className="flex justify-between mb-3">
              <strong className="text-gray-900">SOP Document:</strong>
              <span className="text-gray-700">{sopFile?.name || selectedPlaybookName || 'Selected from Database'}</span>
            </div>
            <div className="flex justify-between mb-3">
              <strong className="text-gray-900">SOP Rules:</strong>
              <span className="text-gray-700">
                {(() => {
                  if (!sopData) {
                    console.log('No sopData available');
                    return '0 rules';
                  }
                  
                  // Helper function to count rules recursively in nested structures
                  const countRules = (data: any): number => {
                    if (!data) return 0;
                    
                    // If it's an array, count items
                    if (Array.isArray(data)) {
                      return data.length;
                    }
                    
                    // If it's an object/dict, recursively count
                    if (typeof data === 'object') {
                      // Check if it's {rules: [...]} structure
                      if (data.rules && Array.isArray(data.rules)) {
                        return data.rules.length;
                      }
                      
                      // Recursively count all nested structures
                      let total = 0;
                      for (const key in data) {
                        const value = data[key];
                        
                        if (Array.isArray(value)) {
                          // Count array items
                          total += value.length;
                        } else if (value && typeof value === 'object') {
                          // Recursively count nested objects
                          if (value.rules && Array.isArray(value.rules)) {
                            total += value.rules.length;
                          } else {
                            // Recursively count nested structures
                            total += countRules(value);
                          }
                        } else if (typeof value === 'string' && value.trim()) {
                          // Count string values as individual rules (e.g., definitions)
                          total += 1;
                        }
                      }
                      return total;
                    }
                    
                    return 0;
                  };
                  
                  const count = countRules(sopData);
                  console.log('SOP Rules count (VALIDATION STEP):', {
                    count,
                    sopData_type: typeof sopData,
                    is_array: Array.isArray(sopData),
                    sopData_sample: JSON.stringify(sopData).substring(0, 300)
                  });
                  return `${count} rules`;
                })()}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <strong className="text-gray-900">Team Checkposts:</strong>
              <span className="text-gray-700">
                {selectedTeamCheckpostFileId 
                  ? `${checkpostData?.count || 0} checkposts selected (File ID: ${selectedTeamCheckpostFileId})`
                  : '0 checkposts selected'}
              </span>
            </div>
            <div className="flex justify-between">
              <strong className="text-gray-900">Claim Document:</strong>
              <span className="text-gray-700">{claimFile?.name}</span>
            </div>
          </div>

          {/* Fast/Full Validation Toggle */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Validation Mode</h4>
                <p className="text-sm text-gray-600">
                  {useFastValidation
                    ? '⚡ Fast Validation: Using critical rules (15 top rules) for quick results (~5-10 seconds)'
                    : '🔍 Full Validation: Using all rules for comprehensive validation (~30-40 seconds)'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useFastValidation}
                  onChange={(e) => setUseFastValidation(e.target.checked)}
                  disabled={validateLoading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {useFastValidation ? 'Fast' : 'Full'}
                </span>
              </label>
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
              onClick={() => setCurrentStep(4)}
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

      {/* Step 5: Results */}
      {currentStep === 6 && results && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-[350px_1fr] gap-8">
            {/* Left Sidebar */}
            <aside className="flex flex-col gap-6">
              {/* Status Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-8 text-center">
                  <div className="text-5xl mb-4">
                    {results.is_valid ? '✅' : '❌'}
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-2 ${
                    results.is_valid 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {results.is_valid ? 'APPROVED' : 'REJECTED'}
                  </div>
                  <div className="text-sm text-gray-500 font-mono mt-2">
                    Claim ID: {results.claim_id || 'Unknown'}
                  </div>
                  
                  <div className="mt-6 space-y-3 text-left">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Total Checks</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {results.rule_checks?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Passed</span>
                      <span className="text-sm font-semibold text-green-600">
                        {results.rule_checks?.filter((c: any) => c.status === 'PASS').length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Failed</span>
                      <span className="text-sm font-semibold text-red-600">
                        {results.errors?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-500">Warnings</span>
                      <span className="text-sm font-semibold text-yellow-600">
                        {results.warnings?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">🤖 AI Analysis</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {results.ai_model || 'claude-3.5-sonnet'}
                  </span>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600"
                          style={{ width: `${results.confidence_score || 85}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {results.confidence_score || 85}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Processing Cost</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(results.total_cost || 0).toFixed(4)}
                    </span>
                  </div>
                  {(results.policy_declaration_cost || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Policy Declaration Cost</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(results.policy_declaration_cost || 0).toFixed(4)}
                      </span>
                    </div>
                  )}
                  {(results.playbook_cost || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">SOP Cost</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(results.playbook_cost || 0).toFixed(4)}
                      </span>
                    </div>
                  )}
                  {(results.document_cost || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Claim Cost</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(results.document_cost || 0).toFixed(4)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Tokens</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {(results.total_tokens || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Time</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {results.validation_timestamp 
                        ? new Date(results.validation_timestamp).toLocaleString()
                        : new Date().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Download Actions */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col gap-3">
                  <button
                    onClick={resetWorkflow}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    🔄 Validate Another Claim
                  </button>
                  <a
                    href={`http://localhost:5002/api/audit-oversight/audit/${results.audit_id}/download/csv`}
                    download
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center transition-colors"
                  >
                    📥 Download CSV Report
                  </a>
                  <a
                    href={`http://localhost:5002/api/audit-oversight/audit/${results.audit_id}/download/json`}
                    download
                    className="w-full px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center transition-colors"
                  >
                    📄 Download JSON
                  </a>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-col">
              {/* Validation Summary */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Validation Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.policy_declaration_name && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Policy Declaration</div>
                      <div className="font-semibold text-gray-900">{results.policy_declaration_name}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {results.policy_declarations_count || 0} declarations
                      </div>
                    </div>
                  )}
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">SOP Document</div>
                    <div className="font-semibold text-gray-900">{results.playbook_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {results.total_rules || 0} rules
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-1">Claim Document</div>
                    <div className="font-semibold text-gray-900">{results.document_name}</div>
                    {results.checkposts_count > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {results.checkposts_count} checkposts
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex gap-4 px-6">
                    <button className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-semibold text-sm">
                      ⚙️ Automated Rules ({results.rule_checks?.length || 0})
                    </button>
                  </div>
                </div>

                {/* Rules List */}
                <div className="max-h-[600px] overflow-y-auto">
                  {results.rule_checks && results.rule_checks.length > 0 ? (
                    results.rule_checks.map((check: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex gap-4 p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-xl flex-shrink-0 w-6 text-center">
                          {check.status === 'PASS' && '✅'}
                          {check.status === 'FAIL' && '❌'}
                          {check.status === 'WARNING' && '⚠️'}
                          {(!check.status || check.status === 'N/A') && 'ℹ️'}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 mb-1">
                            {check.rule}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              check.status === 'PASS' 
                                ? 'bg-green-100 text-green-800'
                                : check.status === 'FAIL'
                                  ? 'bg-red-100 text-red-800'
                                  : check.status === 'WARNING'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                              {check.status || 'N/A'}
                            </span>
                            {check.details && (
                              <span className="text-gray-500">{check.details}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No rule checks available
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
