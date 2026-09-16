// API Service for AudRI Audit Oversight
// Updated to point to audri-platform-backend
const API_BASE = 'http://localhost:5002';

async function safeJson(response: Response) {
  const text = await response.text();
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e97752a4-3e96-4f05-babb-2cb091b3e4ba', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'H1',
        location: 'services/api.ts:safeJson',
        message: 'parsing json',
        data: { status: response.status, url: response.url, snippet: text.slice(0, 120) },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Unexpected response (status ${response.status}): ${text?.slice(0, 200) || 'No body'}`
    );
  }
}

// ==================== AUTHENTICATION API ====================

/**
 * Login with username and password
 */
export async function login(username: string, password: string) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Login failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Logout
 */
export async function logout() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}

/**
 * Verify authentication
 */
export async function verifyAuth(username: string) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error verifying auth:', error);
    throw error;
  }
}

// ==================== END AUTHENTICATION API ====================

// ==================== CONTRACT REVIEW API ====================

/**
 * List all playbooks for contract review
 */
export async function listContractReviewPlaybooks() {
  try {
    const response = await fetch(`${API_BASE}/api/contract-review/playbooks`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error listing playbooks:', error);
    throw error;
  }
}

/**
 * Get specific playbook
 */
export async function getContractReviewPlaybook(playbookId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/contract-review/playbooks/${playbookId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting playbook:', error);
    throw error;
  }
}

/**
 * Upload playbook for contract review
 */
export async function uploadContractReviewPlaybook(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/contract-review/playbooks/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload playbook');
    }
    
    return data;
  } catch (error) {
    console.error('Error uploading playbook:', error);
    throw error;
  }
}

/**
 * List all contracts
 */
export async function listContractReviewContracts(options?: { search?: string; extractedOnly?: boolean }) {
  try {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.extractedOnly) params.append('extracted_only', 'true');

    const response = await fetch(`${API_BASE}/api/contract-review/contracts?${params.toString()}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error listing contracts:', error);
    throw error;
  }
}

/**
 * Get specific contract
 */
export async function getContractReviewContract(documentId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/contract-review/contracts/${documentId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
}

/**
 * Upload contract for review
 */
export async function uploadContractReviewContract(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/contract-review/contracts/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload contract');
    }
    
    return data;
  } catch (error) {
    console.error('Error uploading contract:', error);
    throw error;
  }
}

/**
 * Validate contract against playbook
 */
export async function validateContractReview(playbookId: number, documentId: number, useFastValidation: boolean = false) {
  try {
    const response = await fetch(`${API_BASE}/api/contract-review/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playbook_id: playbookId,
        document_id: documentId,
        use_fast_validation: useFastValidation
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Validation failed');
    }
    
    return data;
  } catch (error) {
    console.error('Error validating contract:', error);
    throw error;
  }
}

/**
 * Get validation result
 */
export async function getContractReviewValidation(validationId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/contract-review/validations/${validationId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting validation:', error);
    throw error;
  }
}

// ==================== END CONTRACT REVIEW API ====================

export async function testConnection() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/health`);
  return response.json();
}

export async function testAuditModule() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/health`);
  return response.json();
}

export async function listClaims(limit = 100) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/documents?type=claim&limit=${limit}`);
  return safeJson(response);
}

export async function listSOPs() {
  return listAuditPlaybooks();
}

export async function listAuditPlaybooks() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/playbooks`);
  return safeJson(response);
}

export async function listTeamCheckpostFiles() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/team-checkposts?show_all=true`);
  return safeJson(response);
}

export async function startAudit(claims: string[], sops: string[], teamCheckpostFileId?: number) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      claims,
      sops,
      ...(teamCheckpostFileId ? { team_checkpost_file_id: teamCheckpostFileId } : {})
    })
  });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e97752a4-3e96-4f05-babb-2cb091b3e4ba', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'H2',
      location: 'services/api.ts:startAudit',
      message: 'startAudit response status',
      data: { status: response.status, url: response.url, hasCheckpost: !!teamCheckpostFileId },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion
  return safeJson(response);
}

export async function startExtraction(auditId: string) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e97752a4-3e96-4f05-babb-2cb091b3e4ba', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'H3',
      location: 'services/api.ts:startExtraction',
      message: 'startExtraction response status',
      data: { status: response.status, url: response.url, auditId },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion
  return safeJson(response);
}

export async function getAuditProgress(auditId: string) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/progress`);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e97752a4-3e96-4f05-babb-2cb091b3e4ba', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'initial',
      hypothesisId: 'H4',
      location: 'services/api.ts:getAuditProgress',
      message: 'progress response status',
      data: { status: response.status, url: response.url, auditId },
      timestamp: Date.now()
    })
  }).catch(() => {});
  // #endregion
  return safeJson(response);
}

export async function runAuditCheck(auditId: string, claimFile: string, sopFile: string) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim_file: claimFile, sop_file: sopFile })
  });
  return safeJson(response);
}

export async function getExtractedRules(auditId: string) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/rules`);
  return safeJson(response);
}

// ==================== DAY 4 UPDATE: VALIDATION API ====================

/**
 * DAY 4: Start batch validation
 */
export async function startValidation(auditId: string, demoMode: boolean = true) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ demo_mode: demoMode }),
    });

    const data = await safeJson(response);

    if (!data.success) {
      throw new Error(data.error || 'Failed to start validation');
    }

    return data;
  } catch (error) {
    console.error('Failed to start validation:', error);
    throw error;
  }
}

/**
 * DAY 4: Get validation results
 */
export async function getValidationResults(auditId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/results`);
    const data = await safeJson(response);

    if (!data.success) {
      throw new Error(data.error || 'Failed to get results');
    }

    return data;
  } catch (error) {
    console.error('Failed to get results:', error);
    throw error;
  }
}

// ==================== END DAY 4 UPDATE ====================

// ==================== MANUAL SAVE RULES FEATURE ====================

/**
 * Manually save extracted rules to JSON in sops/ folder
 * User clicks "Save Rules" button after single audit extraction
 */
export async function saveRulesToJSON(auditId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/save-rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await safeJson(response);

    if (!data.success) {
      throw new Error(data.error || 'Failed to save rules');
    }

    return data;
  } catch (error) {
    console.error('Failed to save rules:', error);
    throw error;
  }
}

// ==================== END MANUAL SAVE RULES ====================

// ==================== RULES ENGINE DASHBOARD API ====================

/**
 * Get Rules Engine Dashboard data (SOPs and Team Checkposts)
 */
export async function getRulesEngineDashboard() {
  try {
    const response = await fetch(`${API_BASE}/rules-engine/auto-claims/api/dashboard`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch dashboard data');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
    throw error;
  }
}

/**
 * Link a Team Checkpost file to an SOP
 */
export async function linkCheckpost(playbookId: number, teamCheckpostFileId: number) {
  try {
    const response = await fetch(`${API_BASE}/rules-engine/auto-claims/link-checkpost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playbook_id: playbookId,
        team_checkpost_file_id: teamCheckpostFileId
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to link checkpost');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to link checkpost:', error);
    throw error;
  }
}

/**
 * Get a specific playbook with its rules
 */
export async function getPlaybook(playbookId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/playbooks/${playbookId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch playbook');
    }
    
    return data.playbook;
  } catch (error) {
    console.error('Failed to fetch playbook:', error);
    throw error;
  }
}

/**
 * Get a specific team checkpost file with its checkposts
 */
export async function getTeamCheckpostFile(teamCheckpostFileId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/team-checkposts/${teamCheckpostFileId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch team checkpost file');
    }
    
    return data.team_checkpost_file;
  } catch (error) {
    console.error('Failed to fetch team checkpost file:', error);
    throw error;
  }
}

/**
 * Delete a playbook/SOP
 */
export async function deletePlaybook(playbookId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/playbooks/${playbookId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete playbook');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to delete playbook:', error);
    throw error;
  }
}

/**
 * Delete a team checkpost file
 */
export async function deleteTeamCheckpostFile(teamCheckpostFileId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/team-checkposts/${teamCheckpostFileId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete team checkpost file');
    }
    return data;
  } catch (error) {
    console.error('Error deleting team checkpost file:', error);
    throw error;
  }
}

// ==================== END RULES ENGINE DASHBOARD API ====================

// ==================== POLICY DECLARATIONS API ====================

/**
 * List all Policy Declarations
 */
export async function listPolicyDeclarations(options?: {
  search?: string;
  extractedOnly?: boolean;
}) {
  try {
    const params = new URLSearchParams();
    if (options?.search) {
      params.append('search', options.search);
    }
    if (options?.extractedOnly) {
      params.append('extracted_only', 'true');
    }
    
    const url = `${API_BASE}/api/audit-oversight/policy-declarations${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to list policy declarations');
    }
    
    return data;
  } catch (error) {
    console.error('Error listing policy declarations:', error);
    throw error;
  }
}

/**
 * Get specific Policy Declaration
 */
export async function getPolicyDeclaration(policyDeclarationId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/policy-declarations/${policyDeclarationId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get policy declaration');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting policy declaration:', error);
    throw error;
  }
}

/**
 * Upload Policy Declaration file and extract declarations
 */
export async function uploadPolicyDeclaration(file: File, schemaVersion: string = 'stable') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('schema_version', schemaVersion);
    formData.append('use_schema', 'true');
    
    const response = await fetch(`${API_BASE}/api/audit-oversight/policy-declarations/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to upload policy declaration');
    }
    
    return data;
  } catch (error) {
    console.error('Error uploading policy declaration:', error);
    throw error;
  }
}

/**
 * Delete Policy Declaration
 */
export async function deletePolicyDeclaration(policyDeclarationId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/policy-declarations/${policyDeclarationId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete policy declaration');
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting policy declaration:', error);
    throw error;
  }
}

/**
 * List available schema versions for a document type
 */
export async function listSchemas(docType: string) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/schemas/${docType}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to list schemas');
    }
    
    return data;
  } catch (error) {
    console.error('Error listing schemas:', error);
    throw error;
  }
}

/**
 * Get specific schema version
 */
export async function getSchema(docType: string, version: string) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/schemas/${docType}/${version}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get schema');
    }
    
    return data;
  } catch (error) {
    console.error('Error getting schema:', error);
    throw error;
  }
}

// ==================== END POLICY DECLARATIONS API ====================

// ==================== INVOICE APPROVAL API ====================

/**
 * Upload RFP/SOW/Approval Policy document for invoice approval
 */
export async function uploadInvoiceApprovalSOP(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/invoice-approval/upload-sop`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload RFP/SOW');
    }

    return data;
  } catch (error) {
    console.error('Failed to upload RFP/SOW:', error);
    throw error;
  }
}

/**
 * Upload document (claim/contract) - returns document with already_extracted flag
 */
export async function uploadDocument(file: File, schemaVersion: string = 'stable') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('schema_version', schemaVersion);
    formData.append('use_schema', 'true');

    const response = await fetch(`${API_BASE}/api/audit-oversight/documents/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload document');
    }

    return data;
  } catch (error) {
    console.error('Failed to upload document:', error);
    throw error;
  }
}

/**
 * Upload invoice document
 */
export async function uploadInvoice(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/invoice-approval/upload-invoice`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to upload invoice');
    }

    return data;
  } catch (error) {
    console.error('Failed to upload invoice:', error);
    throw error;
  }
}

/**
 * Validate invoice against RFP/SOW rules
 */
export async function validateInvoice(playbookId: number, documentId: number, teamCheckpostFileId?: number | null) {
  try {
    const body: any = {
      playbook_id: playbookId,
      document_id: documentId
    };
    
    if (teamCheckpostFileId) {
      body.team_checkpost_file_id = teamCheckpostFileId;
    }
    
    const response = await fetch(`${API_BASE}/api/invoice-approval/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to validate invoice');
    }

    return data;
  } catch (error) {
    console.error('Failed to validate invoice:', error);
    throw error;
  }
}

/**
 * Get invoice approval validation results
 */
export async function getInvoiceApprovalResults(validationId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/invoice-approval/results/${validationId}`);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to get validation results');
    }

    return data;
  } catch (error) {
    console.error('Failed to get validation results:', error);
    throw error;
  }
}

// ==================== END INVOICE APPROVAL API ====================

// ==================== AUDIT RESULTS API ====================

/**
 * List all audit results
 */
export async function listAuditResults(filters?: { status?: string; is_compliant?: boolean }) {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.is_compliant !== undefined) params.append('is_compliant', filters.is_compliant.toString());
    
    const url = `${API_BASE}/api/audit-oversight/audit-results${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch audit results');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch audit results:', error);
    throw error;
  }
}

/**
 * Get a specific audit result
 */
export async function getAuditResult(auditResultId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit-results/${auditResultId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch audit result');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch audit result:', error);
    throw error;
  }
}

/**
 * Update draft report comments
 */
export async function updateAuditComments(auditResultId: number, comments: string) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit-results/${auditResultId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comments })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update comments');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to update comments:', error);
    throw error;
  }
}

/**
 * Add management response (mockup)
 */
export async function addManagementResponse(auditResultId: number, response: string, managerName: string) {
  try {
    const response_data = await fetch(`${API_BASE}/api/audit-oversight/audit-results/${auditResultId}/management-response`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ response, manager_name: managerName })
    });
    
    const data = await response_data.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to add management response');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to add management response:', error);
    throw error;
  }
}

/**
 * Schedule closing meeting (mockup)
 */
export async function scheduleClosingMeeting(
  auditResultId: number,
  meetingDate: string,
  attendees: string[],
  notes: string,
  completed: boolean = false
) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit-results/${auditResultId}/closing-meeting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meeting_date: meetingDate,
        attendees,
        notes,
        completed
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to schedule closing meeting');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to schedule closing meeting:', error);
    throw error;
  }
}

/**
 * Distribute report (mockup)
 */
export async function distributeReport(
  auditResultId: number,
  recipients: string[],
  method: string = 'email'
) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit-results/${auditResultId}/distribute-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients,
        method
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to distribute report');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to distribute report:', error);
    throw error;
  }
}

/**
 * Update follow-up actions
 */
export async function updateFollowUpActions(auditResultId: number, actions: any[]) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit-results/${auditResultId}/follow-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ actions })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update follow-up actions');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to update follow-up actions:', error);
    throw error;
  }
}

/**
 * Generate mock audit results for testing
 */
export async function generateMockAuditResults() {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit-results/generate-mock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate mock audit results');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to generate mock audit results:', error);
    throw error;
  }
}

// ==================== END AUDIT RESULTS API ====================

// ==================== DOCUMENTS API ====================

/**
 * List all documents (claims, contracts, etc.)
 * Supports search and filter options
 */
export async function listDocuments(options?: {
  docType?: string;
  limit?: number;
  search?: string;
  extractedOnly?: boolean;
}) {
  try {
    const params = new URLSearchParams();
    params.append('type', options?.docType || 'claim');
    params.append('limit', (options?.limit || 100).toString());
    if (options?.search) params.append('search', options.search);
    if (options?.extractedOnly) params.append('extracted_only', 'true');
    
    const response = await fetch(`${API_BASE}/api/audit-oversight/documents?${params.toString()}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch documents');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    throw error;
  }
}

/**
 * Get a specific document by ID
 */
export async function getDocument(documentId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/documents/${documentId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch document');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch document:', error);
    throw error;
  }
}

/**
 * Delete a document (claim/contract/etc.)
 */
export async function deleteDocument(documentId: number) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/documents/${documentId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete document');
    }
    return data;
  } catch (error) {
    console.error('Failed to delete document:', error);
    throw error;
  }
}

// ==================== END DOCUMENTS API ====================

// ==================== CLAIM GENERATION API ====================

/**
 * Generate sample claims from uploaded SOP file
 */
export async function generateClaimsFromSOP(
  file: File,
  numClaims: number,
  compliantRatio: number = 0.5
) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('num_claims', numClaims.toString());
    formData.append('compliant_ratio', compliantRatio.toString());
    
    const response = await fetch(`${API_BASE}/api/audit-oversight/generate-claims`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate claims');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to generate claims:', error);
    throw error;
  }
}

/**
 * Generate claims from JSON schema (NEW - schema-driven approach)
 */
export async function generateClaimsFromSchema(
  docType: string = 'claim',
  schemaVersion: string = 'stable',
  numCompliant: number = 1,
  numNoncompliant: number = 1,
  saveFiles: boolean = true
) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/generate-claims-from-schema`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doc_type: docType,
        schema_version: schemaVersion,
        num_compliant: numCompliant,
        num_noncompliant: numNoncompliant,
        save_files: saveFiles
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate claims from schema');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating claims from schema:', error);
    throw error;
  }
}

/**
 * Generate matching SOP and Claim schemas from SOP text or uploaded file
 */
export async function generateSchemaPair(
  sopTextOrFile: string | File,
  schemaName: string,
  schemaVersion: string = '1.0',
  options: { documentType?: string; model?: string } = {}
) {
  try {
    let response: Response;
    const documentType = options.documentType || 'auto_detect';
    const model = options.model;

    if (sopTextOrFile instanceof File) {
      const formData = new FormData();
      formData.append('file', sopTextOrFile);
      formData.append('schema_name', schemaName);
      formData.append('schema_version', schemaVersion);
      formData.append('filename', sopTextOrFile.name);
      formData.append('document_type', documentType);
      if (model) formData.append('model', model);

      response = await fetch(`${API_BASE}/api/audit-oversight/generate-schema-pair`, {
        method: 'POST',
        body: formData,
      });
    } else {
      response = await fetch(`${API_BASE}/api/audit-oversight/generate-schema-pair`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sop_text: sopTextOrFile,
          schema_name: schemaName,
          schema_version: schemaVersion,
          document_type: documentType,
          model,
        }),
      });
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate schema pair');
    }
    
    return data;
  } catch (error) {
    console.error('Error generating schema pair:', error);
    throw error;
  }
}

export async function getDocumentTypesCatalog() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/document-types`);
  const data = await safeJson(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to load document types');
  }
  return data;
}

export async function updateSchemaPairRule(body: {
  sop_schema_file: string;
  rule_id: string;
  title?: string;
  rule_text?: string;
  description?: string;
}) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/schema-pair/rules/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await safeJson(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to update rule');
  }
  return data;
}

export async function loadSchemaPairReview(sopSchemaFile: string) {
  const response = await fetch(
    `${API_BASE}/api/audit-oversight/schema-pair/load?sop_schema_file=${encodeURIComponent(sopSchemaFile)}`
  );
  const data = await safeJson(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to restore extraction review');
  }
  return data;
}

// ==================== END CLAIM GENERATION API ====================

// ==================== GRAPH / EVIDENCE API ====================

export async function getGraphSubgraph(params: {
  playbook_id?: number;
  document_id?: number;
  policy_declaration_id?: number;
  team_checkpost_file_id?: number;
  validation_id?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.playbook_id) query.append('playbook_id', params.playbook_id.toString());
  if (params.document_id) query.append('document_id', params.document_id.toString());
  if (params.policy_declaration_id) query.append('policy_declaration_id', params.policy_declaration_id.toString());
  if (params.team_checkpost_file_id) query.append('team_checkpost_file_id', params.team_checkpost_file_id.toString());
  if (params.validation_id) query.append('validation_id', params.validation_id.toString());
  if (params.limit) query.append('limit', params.limit.toString());

  const url = `${API_BASE}/api/graph/subgraph?${query.toString()}`;
  console.log('🕸️ [API] Fetching graph from:', url);
  
  const response = await fetch(url);
  console.log('🕸️ [API] Response status:', response.status, response.statusText);
  
  const data = await response.json();
  console.log('🕸️ [API] Response data:', data);
  
  if (!response.ok) {
    throw new Error(data.error || `Failed to load evidence graph: ${response.status}`);
  }
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to load evidence graph');
  }
  
  return data;
}

// ==================== VALIDATIONS HISTORY API ====================

/**
 * Get recent validations for viewing validation history
 */
export async function getRecentValidations(limit: number = 50) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/validations/recent?limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch validations: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to load validations');
  }
  
  return data;
}

// ==================== GOLDEN EVALS ====================

export async function getGoldenSuite() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/evals/golden`);
  const data = await safeJson(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to load golden suite');
  }
  return data;
}

export async function runGoldenExtraction(body: { playbook_ids?: string[]; mode?: string } = {}) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/evals/run-extraction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await safeJson(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Extraction eval failed');
  }
  return data;
}

export async function runGoldenDecisions(body: { sample_ids?: string[] } = {}) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/evals/run-decisions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await safeJson(response);
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Decision eval failed');
  }
  return data;
}
