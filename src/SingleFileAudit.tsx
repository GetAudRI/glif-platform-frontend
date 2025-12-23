import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Download, List, Plus, Search, Clock, DollarSign, HardDrive } from 'lucide-react';
import { 
  listDocuments, 
  uploadDocument, 
  listPolicyDeclarations, 
  uploadPolicyDeclaration,
  getPolicyDeclaration,
  getPlaybook,
  getTeamCheckpostFile,
  getGraphSubgraph,
  listSchemas
} from './services/api';
import NarrativeValidationResults from './components/NarrativeValidationResults';

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
  
  // Schema Selection State
  const [policySchemaVersion, setPolicySchemaVersion] = useState<string>('policy_schema_v1.0.json');
  const [availablePolicySchemas, setAvailablePolicySchemas] = useState<string[]>([]);
  const [claimSchemaVersion, setClaimSchemaVersion] = useState<string>('claim_schema_v1.0.json');
  const [availableClaimSchemas, setAvailableClaimSchemas] = useState<string[]>([]);

  // SOP Selection State (Third Party SOP - Optional)
  const [sopMode, setSopMode] = useState<'skip' | 'upload' | 'select'>('skip');
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
  const [rulesTab, setRulesTab] = useState<'All' | 'Policy Declarations' | 'SOP Rules' | 'Team Checkposts'>('All');
  const [policyDetails, setPolicyDetails] = useState<any>(null);
  const [playbookDetails, setPlaybookDetails] = useState<any>(null);
  const [teamCheckpostDetails, setTeamCheckpostDetails] = useState<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: any[]; edges: any[]; count?: any } | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState('');
  const [showAuditDetailsModal, setShowAuditDetailsModal] = useState(false);
  
  // Audit Trail View State
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditStatusFilter, setAuditStatusFilter] = useState<'all' | 'PASS' | 'FAIL' | 'WARNING'>('all');
  const [resultsViewMode, setResultsViewMode] = useState<'grid' | 'narrative'>('narrative'); // New: narrative view by default

  // UPDATED: Reverted to 5-step workflow (removed Policy Declaration step)
  const steps = [
    { number: 1, label: 'Upload SOP', icon: '📄' },
    { number: 2, label: 'Team Checkposts (Optional)', icon: '📋' },
    { number: 3, label: 'Upload Claim', icon: '🚗' },
    { number: 4, label: 'Validate', icon: '⚡' },
    { number: 5, label: 'Results', icon: '📊' }
  ];
  
  // COMMENTED OUT: Policy Declaration step (may be re-enabled in future)
  // const steps_with_policy = [
  //   { number: 1, label: 'Select/Upload Policy Declaration', icon: '📋' },
  //   { number: 2, label: 'Third Party SOP (Optional)', icon: '📄' },
  //   { number: 3, label: 'Team Checkposts (Optional)', icon: '📋' },
  //   { number: 4, label: 'Upload Claim', icon: '🚗' },
  //   { number: 5, label: 'Validate', icon: '⚡' },
  //   { number: 6, label: 'Results', icon: '📊' }
  // ];

  // Load available schemas on mount
  useEffect(() => {
    // Fetch policy schemas - now returns actual filenames
    listSchemas('policy')
      .then(data => {
        if (data.success && data.schema_files) {
          setAvailablePolicySchemas(data.schema_files);
          // Set first schema as default if available
          if (data.schema_files.length > 0) {
            setPolicySchemaVersion(data.schema_files[0]);
          }
        }
      })
      .catch(error => console.error('Error loading policy schemas:', error));
    
    // Fetch claim schemas - now returns actual filenames
    listSchemas('claim')
      .then(data => {
        if (data.success && data.schema_files) {
          setAvailableClaimSchemas(data.schema_files);
          // Set first schema as default if available
          if (data.schema_files.length > 0) {
            setClaimSchemaVersion(data.schema_files[0]);
          }
        }
      })
      .catch(error => console.error('Error loading claim schemas:', error));
  }, []);

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

  // Load rich details when selections change
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (selectedPolicyDeclarationId) {
          const data = await getPolicyDeclaration(selectedPolicyDeclarationId);
          setPolicyDetails(data?.policy_declaration || data);
        }
        if (selectedPlaybookId) {
          const pb = await getPlaybook(selectedPlaybookId);
          setPlaybookDetails(pb);
        }
        if (selectedTeamCheckpostFileId) {
          const tc = await getTeamCheckpostFile(selectedTeamCheckpostFileId);
          setTeamCheckpostDetails(tc);
        }
      } catch (err) {
        console.error('Failed to fetch detail data:', err);
      }
    };
    fetchDetails();
  }, [selectedPolicyDeclarationId, selectedPlaybookId, selectedTeamCheckpostFileId]);

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

  const fetchEvidenceGraph = async () => {
    if (!results?.validation_id) return;
    console.log('🕸️ Fetching evidence graph with params:', {
      validation_id: results.validation_id,
      playbook_id: selectedPlaybookId,
      document_id: documentId,
      policy_declaration_id: selectedPolicyDeclarationId,
      team_checkpost_file_id: selectedTeamCheckpostFileId
    });
    setGraphLoading(true);
    setGraphError('');
    try {
      const data = await getGraphSubgraph({
        validation_id: results.validation_id,
        playbook_id: selectedPlaybookId || undefined,
        document_id: documentId || undefined,
        policy_declaration_id: selectedPolicyDeclarationId || undefined,
        team_checkpost_file_id: selectedTeamCheckpostFileId || undefined,
        limit: 200
      });
      console.log('🕸️ Graph data received:', {
        nodes: data.nodes?.length || 0,
        edges: data.edges?.length || 0,
        count: data.count,
        success: data.success
      });
      setGraphData({ nodes: data.nodes || [], edges: data.edges || [], count: data.count });
    } catch (err: any) {
      console.error('🕸️ Graph fetch error:', err);
      setGraphError(err.message || 'Failed to load evidence graph');
    } finally {
      setGraphLoading(false);
    }
  };

  useEffect(() => {
    if (currentStep === 5 && results?.validation_id) {
      console.log('🕸️ Auto-fetching evidence graph for validation:', results.validation_id);
      fetchEvidenceGraph();
    }
  }, [
    currentStep,
    results?.validation_id,
    selectedPlaybookId,
    documentId,
    selectedPolicyDeclarationId,
    selectedTeamCheckpostFileId
  ]);

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
      const data = await uploadDocument(file, claimSchemaVersion);

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
      const data = await uploadPolicyDeclaration(file, policySchemaVersion);

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

    // Validate required data - need SOP
    if (!selectedPlaybookId) {
      setError('Please select or upload an SOP');
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
    
    // COMMENTED OUT: Policy Declaration support (may be re-enabled in future)
    // Include Policy Declaration (Optional)
    // if (selectedPolicyDeclarationId) {
    //   requestBody.policy_declaration_id = selectedPolicyDeclarationId;
    //   console.log('✅ Including Policy Declaration in validation:', selectedPolicyDeclarationId);
    // } else {
    //   console.log('⚠️  No Policy Declaration selected (optional)');
    // }
    
    // Include Third Party SOP (Optional)
    if (selectedPlaybookId) {
      requestBody.playbook_id = selectedPlaybookId;
      console.log('✅ Including Third Party SOP in validation:', selectedPlaybookId);
    } else {
      console.log('⚠️  No Third Party SOP selected (optional)');
    }
    
    // Only include team_checkpost_file_id if one is selected (Optional)
    if (selectedTeamCheckpostFileId) {
      requestBody.team_checkpost_file_id = selectedTeamCheckpostFileId;
      console.log('✅ Including team checkpost file in validation:', selectedTeamCheckpostFileId);
    } else {
      console.log('⚠️  No team checkpost file selected (optional)');
    }
    
    console.log('Starting validation with:', {
      policy_declaration_id: selectedPolicyDeclarationId,
      playbook_id: selectedPlaybookId || null,
      team_checkpost_file_id: selectedTeamCheckpostFileId || null,
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
      console.log('🕸️ Setting results with validation_id:', data.validation_id);
      setResults({
        audit_id: data.audit_id,
        validation_id: data.validation_id,
        audit_result_id: data.audit_result_id,
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

      setCurrentStep(5);
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

      {/* REMOVED: Step 1 - Policy Declaration (Dec 22, 2025)
          Removed to simplify workflow to 5 steps. Policy Declaration step state variables 
          remain at top of file but are unused. To restore: check git history for full JSX. */}

      {/* Step 1: Upload SOP (formerly Step 2) */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 1: Upload SOP 📄
          </h2>
          <p className="text-gray-600 mb-6">
            Select an existing SOP or upload a new one. AI will extract validation rules from the document.
          </p>

          {/* Mode Toggle (removed Skip option) */}
          <div className="flex gap-3 mb-6">
            {/* <button
              onClick={() => setSopMode('skip')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${sopMode === 'skip'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Skip
            </button> */}
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
                  onClick={() => setCurrentStep(2)}
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
                onClick={() => setCurrentStep(2)}
                disabled={!selectedPlaybookId}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next: Team Checkposts →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Team Checkposts (Optional) (formerly Step 3) */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 2: Team Checkposts (Optional) 📋
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
              onClick={() => setCurrentStep(1)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Back to SOP
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={checkpostMode === 'upload' && checkpostLoading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              Next: Upload Claim →
            </button>
          </div>
        </div>
      )}


      {/* Step 3: Upload/Select Claim (formerly Step 4) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 3: Select or Upload Claim Document 🚗
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
              {/* Schema Version Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extraction Schema File
                </label>
                <select
                  value={claimSchemaVersion}
                  onChange={(e) => setClaimSchemaVersion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={claimLoading}
                >
                  {availableClaimSchemas.map((schemaFile) => (
                    <option key={schemaFile} value={schemaFile}>
                      {schemaFile}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  📁 config/extraction_schemas/ | Controls extraction fields & validation
                </p>
              </div>

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
              onClick={() => setCurrentStep(2)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Back to Checkposts
            </button>
            {claimData && !claimLoading && (
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Next: Validate →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Validate (formerly Step 5) */}
      {currentStep === 4 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 4: Run Validation ⚡</h2>
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
              <strong className="text-gray-900">Third Party SOP:</strong>
              <span className="text-gray-700">
                {sopMode === 'skip' 
                  ? 'None (Skipped)' 
                  : sopFile?.name || selectedPlaybookName || 'Selected from Database'}
              </span>
            </div>
            <div className="flex justify-between mb-3">
              <strong className="text-gray-900">Third Party SOP Rules:</strong>
              <span className="text-gray-700">
                {(() => {
                  if (sopMode === 'skip' || !sopData) {
                    console.log('SOP skipped or no sopData available');
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
              onClick={() => setCurrentStep(3)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              disabled={validateLoading}
            >
              ← Back to Claim
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

      {/* Step 5: Results (formerly Step 6) */}
      {currentStep === 5 && !results && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Loading validation results...</p>
          </div>
        </div>
      )}
      
      {currentStep === 5 && results && (() => {
        const ruleChecks = results.rule_checks || [];
        
        // Show message if no rule checks available yet
        if (ruleChecks.length === 0 && !validateLoading) {
          return (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Step 5: Validation Results 📊
              </h2>
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 mb-4">No validation results available yet.</p>
                <p className="text-sm text-gray-500">Audit ID: {results.audit_id}</p>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  ← Back to Validate
                </button>
              </div>
            </div>
          );
        }
        
        const baseRules = ruleChecks.length;
        const passedCount = ruleChecks.filter((c: any) => c.status === 'PASS').length;
        const failedCount = ruleChecks.filter((c: any) => c.status === 'FAIL').length || results.errors?.length || 0;
        const warningCount = ruleChecks.filter((c: any) => c.status === 'WARNING').length || results.warnings?.length || 0;
        const complianceScore = results.confidence_score !== undefined
          ? results.confidence_score
          : baseRules
            ? Math.round((passedCount / baseRules) * 100)
            : 85;

        const formatCurrency = (val: number) => `$${(val || 0).toFixed(4)}`;
        const formatDate = (val: any) => val ? new Date(val).toLocaleString() : new Date().toLocaleString();

        const categorizeRule = (check: any) => {
          const type = (check?.category || check?.type || check?.rule_type || check?.source || '').toLowerCase();
          if (type.includes('policy')) return 'Policy Declarations';
          if (type.includes('checkpost')) return 'Team Checkposts';
          if (type.includes('sop') || type.includes('rule')) return 'SOP Rules';
          return 'Other';
        };

        const categoryOrder: Array<'Policy Declarations' | 'SOP Rules' | 'Team Checkposts' | 'Other'> = [
          'Policy Declarations',
          'SOP Rules',
          'Team Checkposts',
          'Other'
        ];

        const buildFallbackRules = (items: any[], category: string) => {
          if (!items || !items.length) return [];
          return items.map((r: any, idx: number) => {
            const text = r?.rule || r?.title || r?.name || r?.description || r?.text || r?.content || r;
            const details = r?.details || r?.explanation || r?.summary || '';
            return {
              rule: typeof text === 'string' ? text : JSON.stringify(text),
              details: typeof details === 'string' ? details : (details ? JSON.stringify(details) : ''),
              status: 'N/A',
              category,
              fallbackId: `${category}-${idx}`
            };
          });
        };

        const policyFallback = buildFallbackRules(
          policyDetails?.declarations || policyDetails?.extracted_declarations || [],
          'Policy Declarations'
        );
        const sopFallback = buildFallbackRules(
          (playbookDetails?.extracted_rules) || sopData || [],
          'SOP Rules'
        );
        const checkpostFallback = buildFallbackRules(
          teamCheckpostDetails?.checkposts
            || teamCheckpostDetails?.checkposts_data
            || [],
          'Team Checkposts'
        );

        const combinedRules = [
          ...(ruleChecks || []),
          ...policyFallback,
          ...sopFallback,
          ...checkpostFallback
        ];

        // If backend reported more SOP rules than we have in checks/fallback, add placeholders to align counts
        const sopReportedTotal = results.total_rules || 0;
        const currentSopCount = combinedRules.filter((c: any) => categorizeRule(c) === 'SOP Rules').length;
        const missingSop = sopReportedTotal > currentSopCount ? sopReportedTotal - currentSopCount : 0;
        if (missingSop > 0) {
          for (let i = 0; i < missingSop; i++) {
            combinedRules.push({
              rule: `SOP rule placeholder ${currentSopCount + i + 1}`,
              details: 'Rule not returned in rule_checks; displaying to match reported total.',
              status: 'N/A',
              category: 'SOP Rules',
              fallbackId: `SOP-placeholder-${i}`
            });
          }
        }

        // Total rules that were actually validated (exclude N/A)
        const appliedRules = combinedRules.filter((r: any) => r.status !== 'N/A');
        const totalRules = appliedRules.length || combinedRules.length || baseRules;

        const getCategoryStats = (cat: string) => {
          const items = combinedRules.filter((c: any) => categorizeRule(c) === cat);
          return {
            total: items.length,
            pass: items.filter((c: any) => c.status === 'PASS').length,
            fail: items.filter((c: any) => c.status === 'FAIL').length,
            warn: items.filter((c: any) => c.status === 'WARNING').length
          };
        };

        const groupedRules = categoryOrder.map((cat) => ({
          category: cat,
          items: combinedRules.filter((c: any) => categorizeRule(c) === cat),
          stats: getCategoryStats(cat)
        }));

        const tabTotal = (tab: 'All' | 'Policy Declarations' | 'SOP Rules' | 'Team Checkposts') => {
          if (tab === 'All') return totalRules;
          return getCategoryStats(tab).total;
        };

        const ruleIcon = (status?: string) => {
          if (status === 'PASS') return '✅';
          if (status === 'FAIL') return '❌';
          if (status === 'WARNING') return '⚠️';
          return 'ℹ️';
        };

        const pillClass = (status?: string) => {
          if (status === 'PASS') return 'bg-green-100 text-green-800';
          if (status === 'FAIL') return 'bg-red-100 text-red-800';
          if (status === 'WARNING') return 'bg-yellow-100 text-yellow-800';
          return 'bg-gray-100 text-gray-700';
        };

        const categoryBadge = (category: string) => {
          if (category === 'Policy Declarations') return 'text-blue-700';
          if (category === 'SOP Rules') return 'text-green-700';
          if (category === 'Team Checkposts') return 'text-purple-700';
          return 'text-gray-700';
        };

        return (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Summary Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {results.is_valid ? '✅' : '❌'}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold mb-1">Claim Validation Complete</h1>
                    <p className="text-blue-100 text-sm">
                      Claim ID: {results.claim_id || results.document_name || 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-4xl font-bold">{complianceScore}%</div>
                    <div className="text-blue-100 text-xs">Compliance Score</div>
                    <button
                      onClick={() => setShowAuditDetailsModal(true)}
                      className="px-2 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors border border-white/30"
                    >
                      Audit Details
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="text-xl font-bold">{totalRules}</div>
                  <div className="text-blue-100 text-xs">Total Rules</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="text-xl font-bold text-green-300">{passedCount}</div>
                  <div className="text-blue-100 text-xs">Passed</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="text-xl font-bold text-red-300">{failedCount}</div>
                  <div className="text-blue-100 text-xs">Failed</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="text-xl font-bold text-yellow-300">{warningCount}</div>
                  <div className="text-blue-100 text-xs">Warnings</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[320px_1fr] gap-6">
              {/* Left Sidebar */}
              <aside className="flex flex-col gap-4">
                {/* Status Card */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 text-center">
                    <div className="text-5xl mb-3">{results.is_valid ? '✅' : '❌'}</div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-3 ${
                      results.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {results.is_valid ? 'APPROVED' : 'REJECTED'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono mt-2">
                      Validated: {formatDate(results.validation_timestamp)}
                    </div>
                  </div>
                </div>

                {/* Documents Used */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <span className="text-sm font-semibold text-gray-700">📄 Documents Used</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {results.policy_declaration_name && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Policy Declaration</div>
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {results.policy_declaration_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {results.policy_declarations_count || 0} declarations
                        </div>
                      </div>
                    )}
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Third Party SOP</div>
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {results.playbook_name || (sopMode === 'skip' ? 'None (Skipped)' : 'N/A')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {getCategoryStats('SOP Rules').total || 0} rules
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="text-xs text-gray-600 mb-1">Claim Document</div>
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {results.document_name || 'Claim'}
                      </div>
                    </div>
                    {(results.checkposts_count !== undefined || results.team_checkpost_file) && (
                      <div className="bg-orange-50 rounded-lg p-3">
                        <div className="text-xs text-gray-600 mb-1">Team Checkpost File</div>
                        <div className="font-semibold text-sm text-gray-900 truncate">
                          {results.team_checkpost_file?.name || checkpostData?.source_file || 'Team Checkposts'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {results.team_checkpost_file?.checkposts_count || results.checkposts_count || checkpostData?.count || 0} checkposts
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">🤖 AI Analysis</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {results.ai_model || 'claude-3.5-sonnet'}
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">Confidence</span>
                        <span className="text-sm font-semibold text-gray-900">{complianceScore}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: `${Math.min(complianceScore, 100)}%` }}></div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Cost</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(results.total_cost || 0)}</span>
                      </div>
                      {(results.policy_declaration_cost || 0) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Policy Declaration</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(results.policy_declaration_cost)}</span>
                        </div>
                      )}
                      {(results.playbook_cost || 0) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">SOP Extraction</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(results.playbook_cost)}</span>
                        </div>
                      )}
                      {(results.document_cost || 0) > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Claim Extraction</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(results.document_cost)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <span className="text-gray-600">Tokens Used</span>
                        <span className="font-semibold text-gray-900">
                          {(results.total_tokens || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 flex flex-col gap-2">
                    <button
                      onClick={resetWorkflow}
                      className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-sm"
                    >
                      🔄 Validate Another Claim
                    </button>
                    <button
                      onClick={() => {
                        if (!results?.audit_id) return;
                        const choice = window.prompt('Export format? Type csv, json, or pdf', 'csv');
                        if (!choice) return;
                        const format = choice.trim().toLowerCase();
                        if (!['csv', 'json', 'pdf'].includes(format)) {
                          alert('Invalid format. Please enter csv, json, or pdf.');
                          return;
                        }
                        const url = `http://localhost:5002/api/audit-oversight/audit/${results.audit_id}/download/${format}`;
                        // open in same tab to trigger download
                        window.location.href = url;
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm text-center"
                    >
                      📥 Export Results (CSV / JSON / PDF)
                    </button>
                  <button
                    onClick={() => setShowAuditDetails(true)}
                    className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-sm text-center"
                  >
                    Next: Audit Details →
                  </button>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <main className="flex flex-col gap-4">
                {/* Search and Filter Bar */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        placeholder="Search rules, details, evidence..."
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={auditStatusFilter}
                        onChange={(e) => setAuditStatusFilter(e.target.value as any)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="PASS">✅ Pass Only</option>
                        <option value="FAIL">❌ Fail Only</option>
                        <option value="WARNING">⚠️ Warning Only</option>
                      </select>
                      <select
                        value={rulesTab}
                        onChange={(e) => setRulesTab(e.target.value as any)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="All">All Categories ({totalRules})</option>
                        <option value="Policy Declarations">Policy Declarations ({tabTotal('Policy Declarations')})</option>
                        <option value="SOP Rules">SOP Rules ({tabTotal('SOP Rules')})</option>
                        <option value="Team Checkposts">Team Checkposts ({tabTotal('Team Checkposts')})</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Narrative View - Always visible */}
                <NarrativeValidationResults results={results} />

                {/* Audit Trail Grid - Hidden */}
                {false && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {/* Grid Header */}
                  <div className="grid grid-cols-3 bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
                    <div className="px-4 py-3 text-center font-bold text-sm text-blue-900 uppercase tracking-wide border-r border-gray-200">
                      📄 Source Documents
                    </div>
                    <div className="px-4 py-3 text-center font-bold text-sm text-blue-900 uppercase tracking-wide border-r border-gray-200">
                      ⚙️ Validation Logic
                    </div>
                    <div className="px-4 py-3 text-center font-bold text-sm text-blue-900 uppercase tracking-wide">
                      ✓ Result & Evidence
                    </div>
                  </div>

                  {/* Audit Rows */}
                  <div className="max-h-[600px] overflow-y-auto">
                    {(() => {
                      // Filter rules based on search and status
                      const filteredRules = combinedRules.filter((check: any) => {
                        const category = categorizeRule(check);
                        const matchesTab = rulesTab === 'All' || category === rulesTab;
                        const matchesStatus = auditStatusFilter === 'all' || check.status === auditStatusFilter;
                        const searchLower = auditSearchQuery.toLowerCase();
                        const matchesSearch = !searchLower || 
                          (check.rule || '').toLowerCase().includes(searchLower) ||
                          (check.details || '').toLowerCase().includes(searchLower) ||
                          (check.issue || '').toLowerCase().includes(searchLower) ||
                          category.toLowerCase().includes(searchLower);
                        return matchesTab && matchesStatus && matchesSearch;
                      });

                      if (filteredRules.length === 0) {
                        return (
                          <div className="py-12 text-center text-gray-500">
                            <p className="text-sm">No rules match your filters.</p>
                          </div>
                        );
                      }

                      return filteredRules.map((check: any, idx: number) => {
                        const category = categorizeRule(check);
                        const ruleId = check.id || check.rule_id || `${category.substring(0, 2).toUpperCase()}-${idx + 1}`;
                        
                        // Parse JSON if check.rule is a JSON string
                        let parsedRule: any = null;
                        let ruleTitle = '';
                        let ruleDetails = '';
                        let ruleCategory = category;
                        let ruleSeverity = '';
                        
                        if (check.rule && typeof check.rule === 'string') {
                          try {
                            // Try to parse as JSON
                            if (check.rule.trim().startsWith('{')) {
                              parsedRule = JSON.parse(check.rule);
                              ruleTitle = parsedRule.declaration_text || parsedRule.rule_text || parsedRule.title || check.rule;
                              ruleCategory = parsedRule.category || category;
                              ruleSeverity = parsedRule.severity || '';
                              ruleDetails = parsedRule.value ? `Value: ${parsedRule.value}` : '';
                            } else {
                              ruleTitle = check.rule;
                            }
                          } catch (e) {
                            // If parsing fails, use as-is
                            ruleTitle = check.rule;
                          }
                        } else if (check.rule && typeof check.rule === 'object') {
                          // If it's already an object
                          parsedRule = check.rule;
                          ruleTitle = parsedRule.declaration_text || parsedRule.rule_text || parsedRule.title || 'Untitled Rule';
                          ruleCategory = parsedRule.category || category;
                          ruleSeverity = parsedRule.severity || '';
                          ruleDetails = parsedRule.value ? `Value: ${parsedRule.value}` : '';
                        } else {
                          ruleTitle = check.rule || 'Untitled Rule';
                        }
                        
                        // Use check.details if available, otherwise use extracted details
                        const displayDetails = check.details || ruleDetails;
                        
                        return (
                          <div
                            key={`audit-row-${idx}`}
                            className={`grid grid-cols-3 border-b border-gray-200 min-h-[120px] transition-colors hover:bg-gray-50 ${
                              check.status === 'PASS'
                                ? 'border-l-4 border-green-500'
                                : check.status === 'FAIL'
                                  ? 'border-l-4 border-red-500'
                                  : check.status === 'WARNING'
                                    ? 'border-l-4 border-yellow-500'
                                    : 'border-l-4 border-gray-300'
                            }`}
                          >
                            {/* Column 1: Source Document */}
                            <div className="px-5 py-4 border-r border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                  {ruleCategory}
                                </div>
                                {ruleSeverity && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    ruleSeverity === 'critical' ? 'bg-red-100 text-red-800' :
                                    ruleSeverity === 'high' ? 'bg-orange-100 text-orange-800' :
                                    ruleSeverity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {ruleSeverity}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-start gap-2 mb-2">
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold flex-shrink-0">
                                  {ruleId}
                                </span>
                                <div className="text-sm font-semibold text-gray-900 flex-1 leading-snug">
                                  {ruleTitle}
                                </div>
                              </div>
                              {displayDetails && (
                                <div className="text-xs text-gray-600 leading-relaxed mt-2">
                                  {displayDetails}
                                </div>
                              )}
                              {parsedRule?.declaration_type && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                    Type: {parsedRule.declaration_type}
                                  </span>
                                  {parsedRule.validation_required === 'true' && (
                                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                      ⚠️ Validation Required
                                    </span>
                                  )}
                                </div>
                              )}
                              {check.source_section && (
                                <div className="mt-2 text-xs text-blue-600 font-medium">
                                  📄 {check.source_section}
                                </div>
                              )}
                            </div>

                            {/* Column 2: Validation Logic */}
                            <div className="px-5 py-4 border-r border-gray-200">
                              <div className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                                {check.validation_type || 'Rule Validation'}
                              </div>
                              {check.validation_logic || check.logic || check.condition ? (
                                <div className="bg-purple-50 border-l-3 border-purple-500 rounded p-3 mt-2">
                                  <div className="font-mono text-xs text-gray-800 space-y-1">
                                    {(check.validation_logic || check.logic || check.condition).split('\n').map((line: string, i: number) => (
                                      <div key={i}>{line}</div>
                                    ))}
                                  </div>
                                </div>
                              ) : check.field || check.expected_value || parsedRule?.value ? (
                                <div className="bg-purple-50 border-l-3 border-purple-500 rounded p-3 mt-2">
                                  <div className="font-mono text-xs text-gray-800 space-y-1">
                                    {check.field && <div>Field: {check.field}</div>}
                                    {check.expected_value && <div>Expected: {check.expected_value}</div>}
                                    {check.actual_value && <div>Actual: {check.actual_value}</div>}
                                    {parsedRule?.value && !check.expected_value && (
                                      <div>Policy Value: {parsedRule.value}</div>
                                    )}
                                    {check.status === 'N/A' && (
                                      <div className="text-gray-500 italic mt-1">
                                        Rule does not apply to this claim (N/A)
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-gray-600 italic mt-2 p-3 bg-gray-50 rounded">
                                  {check.status === 'N/A' 
                                    ? 'Policy rule extracted. Validation pending against claim document.'
                                    : 'Validating rule against claim data'}
                                </div>
                              )}
                            </div>

                            {/* Column 3: Result & Evidence */}
                            <div className="px-5 py-4">
                              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold mb-3 ${
                                check.status === 'PASS'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : check.status === 'FAIL'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : check.status === 'WARNING'
                                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                                {ruleIcon(check.status)} {check.status || 'N/A'}
                              </div>
                              
                              {check.status === 'PASS' && (
                                <div className="text-sm text-gray-900 mb-2">
                                  ✓ Rule satisfied. Claim data meets requirements.
                                </div>
                              )}
                              
                              {check.status === 'FAIL' && (
                                <>
                                  <div className="text-sm text-red-900 mb-2 font-medium">
                                    ✗ Rule violated
                                  </div>
                                  {check.issue && (
                                    <div className="text-xs text-red-800 bg-red-50 p-2 rounded mb-2">
                                      <strong>Issue:</strong> {check.issue}
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {check.status === 'WARNING' && (
                                <div className="text-sm text-yellow-900 mb-2">
                                  ⚠️ Warning: Review required
                                </div>
                              )}
                              
                              {check.status === 'N/A' && (
                                <div className="text-sm text-gray-600 mb-2">
                                  Policy rule extracted from source document
                                </div>
                              )}

                              {/* Evidence Chain */}
                              {(check.evidence || check.matched_fields || check.source_reference || parsedRule) && (
                                <div className="mt-3">
                                  <div className="text-xs font-semibold text-gray-700 mb-1">Evidence:</div>
                                  <ul className="space-y-1 text-xs text-gray-600">
                                    {parsedRule?.category && (
                                      <li className="flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <span>Category: {parsedRule.category}</span>
                                      </li>
                                    )}
                                    {parsedRule?.declaration_type && (
                                      <li className="flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <span>Type: {parsedRule.declaration_type}</span>
                                      </li>
                                    )}
                                    {check.source_reference && (
                                      <li className="flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <span>Source: {check.source_reference}</span>
                                      </li>
                                    )}
                                    {check.matched_fields && (
                                      <li className="flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <span>Matched: {check.matched_fields}</span>
                                      </li>
                                    )}
                                    {check.evidence && (
                                      <li className="flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <span>{check.evidence}</span>
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
                )}
              </main>
            </div>

        {/* Evidence Graph (POC) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-800">🕸️ Evidence Graph (POC)</div>
              <div className="text-xs text-gray-500">Nodes from validation, playbook, policy, claim fields, and checkposts</div>
            </div>
            <div className="flex items-center gap-2">
              {graphError && (
                <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">
                  {graphError}
                </span>
              )}
              <button
                onClick={fetchEvidenceGraph}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={graphLoading || !results?.validation_id}
              >
                {graphLoading ? 'Refreshing...' : 'Refresh evidence'}
              </button>
            </div>
          </div>
          <div className="p-4">
            {!graphData && !graphLoading && (
              <div className="text-sm text-gray-600">
                Evidence graph will appear here after the first validation. Click "Refresh evidence" to load it.
              </div>
            )}
            {graphLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Loading graph data...</span>
              </div>
            )}
            {graphData && !graphLoading && (graphData.nodes.length > 0 || graphData.edges.length > 0) && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="text-sm font-semibold text-gray-800 mb-2">
                    Nodes ({graphData.count?.nodes ?? graphData.nodes.length})
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {graphData.nodes.map((node) => (
                      <div key={node.id} className="bg-white rounded border border-gray-200 p-2">
                        <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{node.type}</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{node.label}</div>
                        {node.snippet && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">{node.snippet}</div>
                        )}
                        <div className="text-[11px] text-gray-500 mt-1">
                          Source: {node.source_type} {node.source_id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <div className="text-sm font-semibold text-gray-800 mb-2">
                    Edges ({graphData.count?.edges ?? graphData.edges.length})
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {graphData.edges.map((edge) => {
                      const fromLabel = graphData.nodes.find((n) => n.id === edge.from)?.label || edge.from;
                      const toLabel = graphData.nodes.find((n) => n.id === edge.to)?.label || edge.to;
                      return (
                        <div key={edge.id} className="bg-white rounded border border-gray-200 p-2">
                          <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{edge.type}</div>
                          <div className="text-sm text-gray-900">
                            {fromLabel} → {toLabel}
                          </div>
                          {edge.confidence !== undefined && edge.confidence !== null && (
                            <div className="text-[11px] text-gray-500">Confidence: {edge.confidence}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {graphData && !graphLoading && graphData.nodes.length === 0 && graphData.edges.length === 0 && (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="font-medium mb-1">⚠️ Graph data is empty</div>
                <div className="text-xs">
                  The evidence graph exists but contains no nodes or edges. This might happen if the validation hasn't built the graph yet. Try clicking "Refresh evidence" or running a new validation.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Details Modal */}
        {showAuditDetailsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowAuditDetailsModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowAuditDetailsModal(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Details</h3>
              <div className="space-y-3 text-sm text-gray-800">
                <div>
                  <div className="text-xs text-gray-500">Claim</div>
                  <div className="font-semibold">{results.document_name || results.claim_id || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">SOP</div>
                  <div className="font-semibold">{results.playbook_name || 'SOP'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="font-mono text-gray-700">{formatDate(results.validation_timestamp)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      results.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {results.is_valid ? 'APPROVED' : 'REJECTED'}
                  </span>
                  <span className="text-sm text-gray-700 font-semibold">{complianceScore}% Score</span>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        );
      })()}
    </div>
  );
}