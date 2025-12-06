// API Service for GLIF Audit Oversight
// Updated to point to glif-platform-backend
const API_BASE = 'http://localhost:5002';

export async function testConnection() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/health`);
  return response.json();
}

export async function testAuditModule() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/health`);
  return response.json();
}

export async function listClaims() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/files/claims`);
  return response.json();
}

export async function listSOPs() {
  const response = await fetch(`${API_BASE}/api/audit-oversight/files/sops`);
  return response.json();
}

export async function startAudit(claims: string[], sops: string[]) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claims, sops })
  });
  return response.json();
}

export async function startExtraction(auditId: string) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return response.json();
}

export async function getAuditProgress(auditId: string) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/progress`);
  return response.json();
}

export async function runAuditCheck(auditId: string, claimFile: string, sopFile: string) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ claim_file: claimFile, sop_file: sopFile })
  });
  return response.json();
}

export async function getExtractedRules(auditId: string) {
  const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/rules`);
  return response.json();
}

// ==================== DAY 4 UPDATE: VALIDATION API ====================

/**
 * DAY 4: Start batch validation
 */
export async function startValidation(auditId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

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
    const data = await response.json();

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

    const data = await response.json();

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
export async function uploadPolicyDeclaration(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
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
export async function uploadDocument(file: File) {
  try {
    const formData = new FormData();
    formData.append('file', file);

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

// ==================== END CLAIM GENERATION API ====================
