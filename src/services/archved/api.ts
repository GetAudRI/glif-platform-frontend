// API Service for GLIF Audit Oversight
const API_BASE = 'http://localhost:5001';

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
