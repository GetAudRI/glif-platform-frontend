import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, XCircle, Download, List, Plus, X } from 'lucide-react';
import { uploadInvoiceApprovalSOP, uploadInvoice, validateInvoice, getInvoiceApprovalResults, getTeamCheckpostFile } from './services/api';
import { apiFetch } from './utils/apiClient';
import { canMutate } from './utils/auth';

type StepStatus = 'active' | 'complete' | 'pending';

export default function InvoiceApproval() {
  const [currentStep, setCurrentStep] = useState(1);

  // RFP/SOW Selection State
  const [sopMode, setSopMode] = useState<'upload' | 'select'>('select');
  const [sopFile, setSopFile] = useState<File | null>(null);
  const [existingPlaybooks, setExistingPlaybooks] = useState<any[]>([]);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<number | null>(null);
  const [selectedPlaybookName, setSelectedPlaybookName] = useState<string>('');
  const [sopLoading, setSopLoading] = useState(false);
  const [sopData, setSopData] = useState<any>(null);

  // Team Checkposts State
  const [checkpostMode, setCheckpostMode] = useState<'skip' | 'upload' | 'select'>('skip');
  const [checkpostFile, setCheckpostFile] = useState<File | null>(null);
  const [selectedTeamCheckpostFileId, setSelectedTeamCheckpostFileId] = useState<number | null>(null);
  const [selectedTeamCheckpostFileName, setSelectedTeamCheckpostFileName] = useState<string>('');
  const [existingTeamCheckpostFiles, setExistingTeamCheckpostFiles] = useState<any[]>([]);
  const [linkedTeamCheckpostFile, setLinkedTeamCheckpostFile] = useState<any>(null);
  const [checkpostLoading, setCheckpostLoading] = useState(false);
  const [checkpostData, setCheckpostData] = useState<any>(null);

  // Invoice State
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);

  // Validation State
  const [validateLoading, setValidateLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  // Checkpost Review Modal State
  const [showCheckpostModal, setShowCheckpostModal] = useState(false);
  const [checkpostReviewData, setCheckpostReviewData] = useState<any>(null);
  const [checkpostReviewLoading, setCheckpostReviewLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | 'review' | null>(null);

  const steps = [
    { number: 1, label: 'Upload/Select Approval Policy (RFP/SOW)', icon: '📄' },
    { number: 2, label: 'Team Checkposts (Optional)', icon: '📋' },
    { number: 3, label: 'Upload Invoice', icon: '🧾' },
    { number: 4, label: 'Run Approval Review', icon: '⚡' },
    { number: 5, label: 'Approval Results', icon: '📊' }
  ];

  // Load existing playbooks and checkposts on mount
  useEffect(() => {
    // Fetch playbooks (RFP/SOW documents)
    apiFetch('/api/audit-oversight/playbooks')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExistingPlaybooks(data.playbooks);
        }
      })
      .catch(err => console.error('Failed to load playbooks:', err));

    // Fetch team checkpost files (show all, including linked ones)
    apiFetch('/api/audit-oversight/team-checkposts?show_all=true')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExistingTeamCheckpostFiles(data.team_checkpost_files || []);
        }
      })
      .catch(err => console.error('Failed to load team checkpost files:', err));
  }, []);

  const getStepStatus = (stepNum: number): StepStatus => {
    if (stepNum < currentStep) return 'complete';
    if (stepNum === currentStep) return 'active';
    return 'pending';
  };

  const handleSopUpload = async (file: File) => {
    if (!canMutate()) {
      setError('Demo account is view-only');
      return;
    }
    setSopFile(file);
    setSopLoading(true);
    setError('');

    try {
      const data = await uploadInvoiceApprovalSOP(file);
      setSelectedPlaybookId(data.playbook_id);

      // Fetch the playbook details to get extracted rules
      const playbookResponse = await apiFetch(`/api/audit-oversight/playbooks/${data.playbook_id}`);
      const playbookData = await playbookResponse.json();

      if (playbookData.success) {
        const rules = playbookData.playbook.extracted_rules;
        setSopData(rules);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process RFP/SOW');
    } finally {
      setSopLoading(false);
    }
  };

  const handleSelectPlaybook = async (playbookId: number) => {
    setSelectedPlaybookId(playbookId);
    setSopLoading(true);
    setError('');

    try {
      const response = await apiFetch(`/api/audit-oversight/playbooks/${playbookId}`);
      const data = await response.json();

      if (!data.success) throw new Error('Failed to load playbook');

      const rules = data.playbook.extracted_rules;
      setSopData(rules);
      setSelectedPlaybookName(data.playbook.name);
      setSopFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load playbook');
    } finally {
      setSopLoading(false);
    }
  };

  const handleCheckpostUpload = async (file: File) => {
    if (!canMutate()) {
      setError('Demo account is view-only');
      return;
    }
    setCheckpostFile(file);
    setCheckpostLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiFetch('/api/audit-oversight/checkposts/upload', {
        method: 'POST',
        body: formData
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMsg = data?.error || data?.message || `Server error: ${response.status} ${response.statusText}`;
        console.error('Upload error:', errorMsg, data);
        throw new Error(errorMsg);
      }

      if (!data.success) {
        const errorMsg = data?.error || data?.message || 'Failed to upload team checkpost file';
        throw new Error(errorMsg);
      }

      if (data.team_checkpost_file_id) {
        setSelectedTeamCheckpostFileId(data.team_checkpost_file_id);
        setSelectedTeamCheckpostFileName(data.source_file || file.name || 'Team Checkpost File');
        setCheckpostData({ 
          count: data.checkposts_count || 0,
          team_checkpost_file_id: data.team_checkpost_file_id
        });
        
        // Optionally link to playbook if one is selected
        if (selectedPlaybookId && data.team_checkpost_file_id) {
          await linkTeamCheckpostToPlaybook(selectedPlaybookId, data.team_checkpost_file_id);
        }
      } else {
        throw new Error('No team checkpost file ID returned from server');
      }
    } catch (err: any) {
      console.error('Team checkpost upload error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Could not connect to server. Make sure the backend is running on port 5002.');
      } else {
        setError(err.message || 'Failed to process team checkpost file');
      }
    } finally {
      setCheckpostLoading(false);
    }
  };

  const handleSelectTeamCheckpostFile = async (teamCheckpostFileId: number, fileName?: string) => {
    setSelectedTeamCheckpostFileId(teamCheckpostFileId);
    
    // Fetch the team checkpost file to get count
    try {
      const response = await apiFetch(`/api/audit-oversight/team-checkposts/${teamCheckpostFileId}`);
      const data = await response.json();
      
      if (data.success && data.team_checkpost_file) {
        setSelectedTeamCheckpostFileName(data.team_checkpost_file.name || fileName || 'Team Checkpost File');
        setCheckpostData({ 
          count: data.team_checkpost_file.checkposts_count || 0,
          team_checkpost_file_id: teamCheckpostFileId
        });
        
        // Optionally link to playbook if one is selected
        if (selectedPlaybookId) {
          await linkTeamCheckpostToPlaybook(selectedPlaybookId, teamCheckpostFileId);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch team checkpost file:', err);
    }
    
    setCheckpostFile(null);
  };

  const linkTeamCheckpostToPlaybook = async (playbookId: number, teamCheckpostFileId: number) => {
    try {
      const response = await apiFetch('/rules-engine/auto-claims/link-checkpost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playbook_id: playbookId,
          team_checkpost_file_id: teamCheckpostFileId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setLinkedTeamCheckpostFile({ id: teamCheckpostFileId });
      }
    } catch (err: any) {
      console.error('Failed to link team checkpost to playbook:', err);
      // Don't show error to user - linking is optional
    }
  };

  // Check for linked team checkpost file when playbook is selected
  useEffect(() => {
    if (selectedPlaybookId) {
      apiFetch(`/api/audit-oversight/playbooks/${selectedPlaybookId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.playbook.team_checkpost_file) {
            setLinkedTeamCheckpostFile(data.playbook.team_checkpost_file);
            setSelectedTeamCheckpostFileId(data.playbook.team_checkpost_file.id);
            setSelectedTeamCheckpostFileName(data.playbook.team_checkpost_file.name || 'Team Checkpost File');
            setCheckpostData({ 
              count: data.playbook.team_checkpost_file.checkposts_count || 0,
              team_checkpost_file_id: data.playbook.team_checkpost_file.id
            });
          }
        })
        .catch(err => console.error('Failed to check linked team checkpost:', err));
    }
  }, [selectedPlaybookId]);

  const handleInvoiceUpload = async (file: File) => {
    if (!canMutate()) {
      setError('Demo account is view-only');
      return;
    }
    setInvoiceFile(file);
    setInvoiceLoading(true);
    setError('');

    if (!file) {
      setError('No file selected');
      setInvoiceLoading(false);
      return;
    }

    const maxSize = 16 * 1024 * 1024; // 16MB
    if (file.size > maxSize) {
      setError(`File too large. Maximum size is 16MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      setInvoiceLoading(false);
      return;
    }

    try {
      const data = await uploadInvoice(file);
      setDocumentId(data.document_id);
      setInvoiceData(data.extracted_data);
    } catch (err: any) {
      console.error('Invoice upload error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Could not connect to server. Make sure the backend is running on port 5002.');
      } else {
        setError(err.message || 'Failed to process invoice');
      }
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleValidate = async () => {
    setValidateLoading(true);
    setError('');

    if (!selectedPlaybookId) {
      setError('Please select or upload an RFP/SOW first');
      setValidateLoading(false);
      return;
    }

    if (!documentId) {
      setError('Please upload an invoice document first');
      setValidateLoading(false);
      return;
    }

    try {
      // Use selected team checkpost file ID or linked one
      const teamCheckpostFileId = selectedTeamCheckpostFileId || linkedTeamCheckpostFile?.id;
      
      const data = await validateInvoice(selectedPlaybookId, documentId, teamCheckpostFileId);
      
      // Fetch full results
      const resultsData = await getInvoiceApprovalResults(data.validation_id);
      
      // Extract validation results from the response
      const validationResults = resultsData.validation?.results || data.validation_results || {};
      
      setResults({
        validation_id: data.validation_id,
        playbook_name: selectedPlaybookName || sopFile?.name,
        document_name: invoiceFile?.name,
        invoice_number: resultsData.document?.invoice_number || invoiceData?.invoice_number,
        is_approved: validationResults.is_approved || false,
        recommendation: validationResults.recommendation || 'REVIEW',
        compliance_score: validationResults.compliance_score || 0,
        rule_checks: validationResults.rule_checks || [],
        errors: validationResults.errors || [],
        warnings: validationResults.warnings || [],
        total_cost: resultsData.validation?.total_cost || 0,
        playbook_cost: resultsData.validation?.playbook_cost || 0,
        document_cost: resultsData.validation?.document_cost || 0,
        ai_metadata: validationResults.ai_metadata || {},
        team_checkpost_file_id: data.team_checkpost_file_id || teamCheckpostFileId || null
      });

      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message || 'Approval review failed');
    } finally {
      setValidateLoading(false);
    }
  };

  const resetWorkflow = () => {
    setCurrentStep(1);
    setSopFile(null);
    setInvoiceFile(null);
    setSopData(null);
    setInvoiceData(null);
    setResults(null);
    setError('');
    setShowCheckpostModal(false);
    setCheckpostReviewData(null);
    setPendingAction(null);
  };

  const handleActionClick = async (action: 'approve' | 'reject' | 'review') => {
    // Check if there's a team checkpost file to review
    // Priority: results -> selected -> linked -> playbook linked
    let teamCheckpostFileId = results?.team_checkpost_file_id || 
                              selectedTeamCheckpostFileId || 
                              linkedTeamCheckpostFile?.id;
    
    // If still no ID, try to get it from the playbook
    if (!teamCheckpostFileId && selectedPlaybookId) {
      try {
        const playbookResponse = await apiFetch(`/api/audit-oversight/playbooks/${selectedPlaybookId}`);
        const playbookData = await playbookResponse.json();
        if (playbookData.success && playbookData.playbook?.team_checkpost_file?.id) {
          teamCheckpostFileId = playbookData.playbook.team_checkpost_file.id;
        }
      } catch (err) {
        console.error('Failed to fetch playbook for team checkpost:', err);
      }
    }
    
    if (teamCheckpostFileId) {
      // Show modal with checkpost data
      setPendingAction(action);
      setCheckpostReviewLoading(true);
      setShowCheckpostModal(true);
      
      try {
        const checkpostData = await getTeamCheckpostFile(teamCheckpostFileId);
        setCheckpostReviewData(checkpostData);
      } catch (err: any) {
        console.error('Failed to load checkpost data:', err);
        setError('Failed to load checkpost data for review');
        setShowCheckpostModal(false);
        setPendingAction(null);
      } finally {
        setCheckpostReviewLoading(false);
      }
    } else {
      // No checkpost file, proceed directly with action
      handleActionConfirm(action);
    }
  };

  const handleActionConfirm = async (action: 'approve' | 'reject' | 'review') => {
    // Close modal
    setShowCheckpostModal(false);
    setPendingAction(null);
    
    // Show loading state
    setError('');
    
    try {
      // Prepare action data
      const actionData = {
        validation_id: results?.validation_id,
        action: action.toUpperCase(),
        invoice_number: results?.invoice_number,
        recommendation: results?.recommendation
      };
      
      // For demo purposes, we'll show a success message
      // In production, this would make an API call to record the action
      const actionMessages = {
        approve: {
          title: '✅ Invoice Approved',
          message: `Invoice ${results?.invoice_number || ''} has been approved and routed to Finance for payment processing.`
        },
        reject: {
          title: '❌ Invoice Rejected',
          message: `Invoice ${results?.invoice_number || ''} has been rejected. The vendor will be notified.`
        },
        review: {
          title: '⚠️ Review Requested',
          message: `A request for additional information has been sent for invoice ${results?.invoice_number || ''}.`
        }
      };
      
      const message = actionMessages[action];
      
      // Show success message (in production, this would be a toast notification)
      alert(`${message.title}\n\n${message.message}`);
      
      // Log action for audit trail (in production, this would be saved to database)
      console.log('Invoice action taken:', actionData);
      
    } catch (err: any) {
      setError(`Failed to ${action} invoice: ${err.message}`);
      console.error('Action error:', err);
    }
  };

  const handleModalClose = () => {
    setShowCheckpostModal(false);
    setPendingAction(null);
    setCheckpostReviewData(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Invoice Approval</h1>
            <p className="text-sm text-neutral-600 mt-1">Validate invoices against approval policies</p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
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
                    ? 'bg-purple-600 text-white'
                    : status === 'complete'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                    }`}
                >
                  {status === 'complete' ? '✓' : step.number}
                </div>
                <div
                  className={`text-sm ${status === 'active' ? 'text-purple-900 font-semibold' : 'text-gray-600'
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

      {/* Step 1: Select/Upload RFP/SOW */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 1: Upload/Select Approval Policy (RFP/SOW) 📄
          </h2>
          <p className="text-gray-600 mb-6">
            Choose an existing RFP/SOW/Contract from the database or upload a new one. AI will extract approval rules.
          </p>

          {/* Mode Toggle */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setSopMode('select')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${sopMode === 'select'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <List className="inline-block w-5 h-5 mr-2" />
              Select Existing
            </button>
            {canMutate() && (
            <button
              onClick={() => setSopMode('upload')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${sopMode === 'upload'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Plus className="inline-block w-5 h-5 mr-2" />
              Upload New
            </button>
            )}
          </div>

          {/* Select Existing Mode */}
          {sopMode === 'select' && (
            <div>
              {existingPlaybooks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No RFP/SOW documents found in database.</p>
                  <button
                    onClick={() => setSopMode('upload')}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Upload Your First RFP/SOW
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingPlaybooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedPlaybookId === playbook.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
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
                          <CheckCircle2 className="w-6 h-6 text-purple-600" />
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
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${sopLoading ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
              onClick={() => !sopLoading && document.getElementById('sopInput')?.click()}
            >
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {sopFile ? sopFile.name : 'Drop RFP/SOW document here'}
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
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent mb-3" />
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
                    {sopMode === 'upload' ? 'RFP/SOW Uploaded & Rules Extracted!' : 'Playbook Loaded!'}
                  </h4>
                </div>
                <p className="text-sm text-green-800">
                  {sopMode === 'upload'
                    ? 'Rules have been extracted and saved to database.'
                    : 'Using existing rules from database (no AI cost!).'}
                </p>
              </div>

              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">Extracted Rules Preview:</h4>
                <pre className="text-sm text-purple-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {JSON.stringify(sopData, null, 2)}
                </pre>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Next: Team Checkposts →
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 2: Team Checkposts (Optional) - Same as SingleFileAudit */}
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
              onClick={() => setCheckpostMode('select')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${checkpostMode === 'select'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <List className="inline-block w-5 h-5 mr-2" />
              Select Existing
            </button>
            {canMutate() && (
            <button
              onClick={() => setCheckpostMode('upload')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${checkpostMode === 'upload'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Plus className="inline-block w-5 h-5 mr-2" />
              Upload New
            </button>
            )}
          </div>

          {/* Skip Mode */}
          {checkpostMode === 'skip' && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">No team checkposts will be used for validation.</p>
              <p className="text-sm text-gray-500">Only RFP/SOW rules will be applied.</p>
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
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Upload Your First Team Checkpost File
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedTeamCheckpostFile && (
                    <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-900">Currently Linked Team Checkpost</h4>
                      </div>
                      <p className="text-sm text-purple-800">
                        {linkedTeamCheckpostFile.name} ({linkedTeamCheckpostFile.checkposts_count || 0} checkposts)
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mb-3">Select a team checkpost file to use:</p>
                  {existingTeamCheckpostFiles.map((tcf) => (
                    <div
                      key={tcf.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedTeamCheckpostFileId === tcf.id
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                        }`}
                      onClick={() => handleSelectTeamCheckpostFile(tcf.id, tcf.name)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{tcf.name}</h4>
                          <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span>📅 {new Date(tcf.created_at).toLocaleDateString()}</span>
                            <span>📋 {tcf.checkposts_count || 0} checkposts</span>
                            {tcf.linked_playbook && (
                              <span className="text-purple-600">🔗 Linked to: {tcf.linked_playbook}</span>
                            )}
                          </div>
                        </div>
                        {selectedTeamCheckpostFileId === tcf.id && (
                          <CheckCircle2 className="w-6 h-6 text-purple-600" />
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
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${checkpostLoading ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
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

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={checkpostMode === 'upload' && checkpostLoading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-gray-400"
            >
              Next: Upload Invoice →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Upload Invoice */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Step 3: Upload Invoice Document 🧾
          </h2>
          <p className="text-gray-600 mb-6">
            Upload the invoice document. AI will extract structured invoice data.
          </p>

          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${invoiceLoading ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
              }`}
            onClick={() => !invoiceLoading && document.getElementById('invoiceInput')?.click()}
          >
            <div className="text-6xl mb-4">🧾</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {invoiceFile ? invoiceFile.name : 'Drop invoice document here'}
            </h3>
            <p className="text-gray-600 mb-2">or click to browse</p>
            <p className="text-sm text-gray-500">Supports: PDF, TXT, JSON (max 16MB)</p>
            <input
              id="invoiceInput"
              type="file"
              accept=".pdf,.txt,.json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleInvoiceUpload(e.target.files[0])}
            />
          </div>

          {invoiceLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent mb-3" />
              <p className="text-gray-600">Extracting invoice data with AI...</p>
            </div>
          )}

          {invoiceData && !invoiceLoading && (
            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Extracted Invoice Data Preview:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-purple-700 font-medium">Invoice #:</span>
                  <span className="ml-2 text-purple-900">{invoiceData.invoice_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">Vendor:</span>
                  <span className="ml-2 text-purple-900">{invoiceData.vendor_name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">Total Amount:</span>
                  <span className="ml-2 text-purple-900">${invoiceData.total_amount?.toLocaleString() || '0.00'}</span>
                </div>
                <div>
                  <span className="text-purple-700 font-medium">Invoice Date:</span>
                  <span className="ml-2 text-purple-900">{invoiceData.invoice_date || 'N/A'}</span>
                </div>
              </div>
              <pre className="text-sm text-purple-800 whitespace-pre-wrap max-h-48 overflow-y-auto mt-4">
                {JSON.stringify(invoiceData, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              ← Back
            </button>
            {invoiceData && !invoiceLoading && (
              <button
                onClick={() => setCurrentStep(4)}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Next: Run Approval Review →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Run Approval Review */}
      {currentStep === 4 && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 4: Run Approval Review ⚡</h2>
          <p className="text-gray-600 mb-6">Ready to validate the invoice against extracted rules.</p>

          <div className="bg-purple-50 rounded-lg p-6 mb-6">
            <div className="flex justify-between mb-3">
              <strong className="text-gray-900">RFP/SOW Document:</strong>
              <span className="text-gray-700">{sopFile?.name || selectedPlaybookName || 'Selected from Database'}</span>
            </div>
            {(selectedTeamCheckpostFileId || linkedTeamCheckpostFile) && (
              <div className="flex justify-between mb-3">
                <strong className="text-gray-900">Team Checkpost File:</strong>
                <span className="text-gray-700">
                  {selectedTeamCheckpostFileName || linkedTeamCheckpostFile?.name || checkpostFile?.name || 'Team Checkpost File'}
                  {checkpostData?.count && ` (${checkpostData.count} checkposts)`}
                </span>
              </div>
            )}
            <div className="flex justify-between mb-3">
              <strong className="text-gray-900">Invoice Document:</strong>
              <span className="text-gray-700">{invoiceFile?.name}</span>
            </div>
            <div className="flex justify-between">
              <strong className="text-gray-900">Invoice Number:</strong>
              <span className="text-gray-700">{invoiceData?.invoice_number || 'N/A'}</span>
            </div>
          </div>

          {validateLoading && (
            <div className="text-center mb-6">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent mb-3" />
              <p className="text-gray-600">Running approval review...</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              disabled={validateLoading}
            >
              ← Back
            </button>
            <button
              onClick={handleValidate}
              disabled={validateLoading}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-gray-300"
            >
              Run Approval Review ✓
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Approval Results */}
      {currentStep === 5 && results && (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 lg:gap-8">
            {/* Left Sidebar */}
            <aside className="flex flex-col gap-6">
              {/* Status Card */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-8 text-center">
                  <div className="text-5xl mb-4">
                    {results.is_approved ? '✅' : results.recommendation === 'REVIEW' ? '⚠️' : '❌'}
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-2 ${
                    results.recommendation === 'APPROVE'
                      ? 'bg-green-100 text-green-800' 
                      : results.recommendation === 'REJECT'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {results.recommendation === 'APPROVE' ? 'APPROVED FOR PAYMENT' : 
                     results.recommendation === 'REJECT' ? 'REJECTED - DO NOT PAY' : 
                     'REVIEW REQUIRED'}
                  </div>
                  <div className="text-sm text-gray-500 font-mono mt-2">
                    Invoice: {results.invoice_number || 'Unknown'}
                  </div>
                  
                  <div className="mt-6 space-y-3 text-left">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Compliance Score</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {results.compliance_score || 0}%
                      </span>
                    </div>
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
                    {results.ai_metadata?.model || 'claude-3.5-sonnet'}
                  </span>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Processing Cost</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(results.total_cost || 0).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">RFP/SOW Cost</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(results.playbook_cost || 0).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Invoice Cost</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(results.document_cost || 0).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 flex flex-col gap-3">
                  <button
                    onClick={resetWorkflow}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
                  >
                    🔄 Review Another Invoice
                  </button>
                  {results.recommendation === 'APPROVE' && (
                    <button 
                      onClick={() => handleActionClick('approve')}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                    >
                      ✅ Approve & Route to Finance
                    </button>
                  )}
                  {results.recommendation === 'REJECT' && (
                    <button 
                      onClick={() => handleActionClick('reject')}
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                    >
                      ❌ Reject Invoice
                    </button>
                  )}
                  {results.recommendation === 'REVIEW' && (
                    <button 
                      onClick={() => handleActionClick('review')}
                      className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
                    >
                      ⚠️ Request Additional Information
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex flex-col">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex gap-4 px-4 sm:px-6">
                    <button className="px-4 py-3 border-b-2 border-purple-600 text-purple-600 font-semibold text-sm">
                      ⚙️ Approval Rules ({results.rule_checks?.length || 0})
                    </button>
                  </div>
                  <div className="px-4 sm:px-6 py-2 bg-purple-50 text-xs sm:text-sm text-purple-700">
                    Validated against: RFP/SOW Rules + Team Checkposts (all validated using AI)
                  </div>
                </div>

                {/* Rules List */}
                <div className="max-h-[400px] sm:max-h-[600px] overflow-y-auto">
                  {results.rule_checks && results.rule_checks.length > 0 ? (
                    results.rule_checks.map((check: any, idx: number) => {
                      // Check if this is a team checkpost rule (by checking if rule text contains team checkpost indicators)
                      const isTeamCheckpost = check.rule?.includes('Team Checkpost') || 
                                            check.rule?.includes('TCP-') ||
                                            check.category === 'Team Checkpost';
                      
                      return (
                        <div
                          key={idx}
                          className="flex gap-3 sm:gap-4 p-3 sm:p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="text-lg sm:text-xl flex-shrink-0 w-5 sm:w-6 text-center">
                            {check.status === 'PASS' && '✅'}
                            {check.status === 'FAIL' && '❌'}
                            {check.status === 'WARNING' && '⚠️'}
                            {(!check.status || check.status === 'N/A') && 'ℹ️'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <div className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                                {check.rule}
                              </div>
                              {isTeamCheckpost && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded whitespace-nowrap">
                                  📋 Team Checkpost
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
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
                              {check.confidence_score && (
                                <span className="text-xs text-gray-400">
                                  Confidence: {check.confidence_score}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
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

      {/* Checkpost Review Modal */}
      {showCheckpostModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col my-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Review Team Checkposts</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Please review all team checkpost rules before {pendingAction === 'approve' ? 'approving' : pendingAction === 'reject' ? 'rejecting' : 'requesting information for'} this invoice
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {checkpostReviewLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-purple-600 border-t-transparent mb-3" />
                  <p className="text-gray-600">Loading checkpost data...</p>
                </div>
              ) : checkpostReviewData && checkpostReviewData.checkposts_data ? (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">{checkpostReviewData.name || 'Team Checkpost File'}</h4>
                    </div>
                    <p className="text-sm text-purple-700">
                      {checkpostReviewData.checkposts_count || checkpostReviewData.checkposts_data?.length || 0} checkposts found
                    </p>
                  </div>

                  <div className="space-y-3">
                    {checkpostReviewData.checkposts_data.map((checkpost: any, idx: number) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 mb-2">
                              {checkpost.text || checkpost.description || JSON.stringify(checkpost)}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {checkpost.blocking && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  🚫 Blocking
                                </span>
                              )}
                              {checkpost.evidence_required && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  📎 Evidence: {checkpost.evidence_required}
                                </span>
                              )}
                              {checkpost.source_section && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  📄 {checkpost.source_section}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No checkpost data available</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleModalClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
              >
                Cancel
              </button>
              {pendingAction === 'approve' && (
                <button
                  onClick={() => handleActionConfirm('approve')}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  ✅ Confirm Approval
                </button>
              )}
              {pendingAction === 'reject' && (
                <button
                  onClick={() => handleActionConfirm('reject')}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  ❌ Confirm Rejection
                </button>
              )}
              {pendingAction === 'review' && (
                <button
                  onClick={() => handleActionConfirm('review')}
                  className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
                >
                  ⚠️ Confirm Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

