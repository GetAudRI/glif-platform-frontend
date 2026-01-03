/**
 * Vendor Audit API Service
 * API client for vendor audit operations
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const VENDOR_AUDIT_BASE = `${API_BASE_URL}/api/vendor-audit`;

// Types
export interface Vendor {
  id: string;
  organization_id?: string;
  vendor_name: string;
  vendor_type: 'CMO' | 'API_Supplier' | 'Testing_Lab' | 'Software_Vendor' | 'Equipment_Supplier';
  risk_tier: 'Critical' | 'High' | 'Moderate' | 'Low';
  location?: string;
  products_supplied?: string[];
  certifications?: string[];
  last_audit_date?: string;
  next_audit_due?: string;
  audit_frequency_months?: number;
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, any>;
}

export interface VendorAudit {
  id: string;
  vendor_id: string;
  audit_date: string;
  audit_type: 'initial' | 'routine' | 'for_cause' | 're_audit';
  auditor_id?: string;
  overall_score?: number;
  compliance_status: 'approved' | 'conditional' | 'rejected' | 'pending';
  critical_findings: number;
  major_findings: number;
  minor_findings: number;
  audit_report_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface VendorAuditFinding {
  id: string;
  audit_id: string;
  rule_id: string;
  rule_name: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'open' | 'in_progress' | 'closed' | 'verified';
  finding_text?: string;
  evidence_doc_id?: string;
  evidence_page_number?: number;
  evidence_excerpt?: string;
  capa_required: boolean;
  capa_due_date?: string;
  capa_completion_date?: string;
  capa_description?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface GxPRule {
  id: string;
  category: '21_CFR_Part_11' | 'EU_GMP_Annex_11' | 'ICH_Q7' | 'ALCOA_Plus';
  rule_name: string;
  description?: string;
  regulation_reference?: string;
  severity_if_missing: 'critical' | 'major' | 'minor';
  applicable_vendor_types: string[];
  validation_logic?: Record<string, any>;
  auto_checkable: boolean;
  active: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface PortfolioMetrics {
  total_vendors: number;
  by_status: Record<string, number>;
  by_risk_tier: Record<string, number>;
  by_vendor_type: Record<string, number>;
  audits_due_30_days: number;
  audits_overdue: number;
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': 'demo-user', // TODO: Replace with actual auth
    ...options.headers,
  };

  const response = await fetch(`${VENDOR_AUDIT_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// VENDOR MANAGEMENT
// ============================================================================

export const createVendor = async (data: Partial<Vendor>): Promise<{ success: boolean; vendor: Vendor }> => {
  return apiCall('/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const listVendors = async (filters?: {
  organization_id?: string;
  status?: string;
  risk_tier?: string;
  vendor_type?: string;
}): Promise<{ success: boolean; vendors: Vendor[]; count: number }> => {
  const params = new URLSearchParams(filters as any);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiCall(`/vendors${queryString}`);
};

export const getVendor = async (vendorId: string): Promise<{ 
  success: boolean; 
  vendor: Vendor; 
  audit_history: VendorAudit[] 
}> => {
  return apiCall(`/vendors/${vendorId}`);
};

export const updateVendor = async (
  vendorId: string, 
  data: Partial<Vendor>
): Promise<{ success: boolean; vendor: Vendor }> => {
  return apiCall(`/vendors/${vendorId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteVendor = async (vendorId: string): Promise<{ success: boolean; message: string }> => {
  return apiCall(`/vendors/${vendorId}`, {
    method: 'DELETE',
  });
};

// ============================================================================
// AUDIT MANAGEMENT
// ============================================================================

export const createAudit = async (
  vendorId: string,
  data: Partial<VendorAudit>
): Promise<{ success: boolean; audit: VendorAudit }> => {
  return apiCall(`/vendors/${vendorId}/audits`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getAudit = async (auditId: string): Promise<{ 
  success: boolean;
  audit: VendorAudit;
  vendor: Vendor;
  findings: VendorAuditFinding[];
  summary: {
    total_findings: number;
    open_capas: number;
    overdue_capas: number;
  };
}> => {
  return apiCall(`/audits/${auditId}`);
};

export const runComplianceCheck = async (
  auditId: string,
  data: {
    rule_ids: string[];
    document_ids: string[];
  }
): Promise<{
  success: boolean;
  audit_id: string;
  overall_score: number;
  compliance_status: string;
  findings: {
    critical: number;
    major: number;
    minor: number;
    total: number;
  };
  rules_checked: number;
  documents_reviewed: number;
}> => {
  return apiCall(`/audits/${auditId}/compliance`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getAuditFindings = async (
  auditId: string,
  filters?: {
    severity?: string;
    status?: string;
  }
): Promise<{ success: boolean; findings: VendorAuditFinding[]; count: number }> => {
  const params = new URLSearchParams(filters as any);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiCall(`/audits/${auditId}/findings${queryString}`);
};

export const getFinding = async (findingId: string): Promise<{ 
  success: boolean; 
  finding: VendorAuditFinding 
}> => {
  return apiCall(`/findings/${findingId}`);
};

export const updateFinding = async (
  findingId: string,
  data: Partial<VendorAuditFinding>
): Promise<{ success: boolean; finding: VendorAuditFinding }> => {
  return apiCall(`/findings/${findingId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const submitCAPA = async (
  findingId: string,
  data: {
    capa_description: string;
    capa_completion_date?: string;
  }
): Promise<{ success: boolean; finding: VendorAuditFinding }> => {
  return apiCall(`/findings/${findingId}/capa`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// ============================================================================
// GXP RULES
// ============================================================================

export const listRules = async (filters?: {
  category?: string;
  vendor_type?: string;
  severity?: string;
  active_only?: boolean;
}): Promise<{ success: boolean; rules: GxPRule[]; count: number }> => {
  const params = new URLSearchParams(filters as any);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return apiCall(`/rules${queryString}`);
};

export const getRule = async (ruleId: string): Promise<{ success: boolean; rule: GxPRule }> => {
  return apiCall(`/rules/${ruleId}`);
};

export const getRuleCategories = async (): Promise<{ 
  success: boolean; 
  categories: Record<string, {
    total: number;
    critical: number;
    major: number;
    minor: number;
    auto_checkable: number;
  }> 
}> => {
  return apiCall('/rules/categories');
};

export const searchRules = async (searchTerm: string): Promise<{ 
  success: boolean; 
  rules: GxPRule[]; 
  count: number 
}> => {
  const params = new URLSearchParams({ q: searchTerm });
  return apiCall(`/rules/search?${params.toString()}`);
};

export const getRecommendedRules = async (vendorId: string): Promise<{ 
  success: boolean; 
  rules: GxPRule[]; 
  count: number 
}> => {
  return apiCall(`/vendors/${vendorId}/recommended-rules`);
};

// ============================================================================
// DASHBOARD
// ============================================================================

export const getPortfolioDashboard = async (organizationId?: string): Promise<{
  success: boolean;
  metrics: PortfolioMetrics;
  vendors_due_for_audit: Vendor[];
}> => {
  const params = organizationId ? `?organization_id=${organizationId}` : '';
  return apiCall(`/dashboard/portfolio${params}`);
};

// ============================================================================
// REPORTING
// ============================================================================

export const generateAuditReport = async (auditId: string): Promise<any> => {
  return apiCall(`/audits/${auditId}/report`);
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

export const healthCheck = async (): Promise<{ 
  success: boolean; 
  module: string; 
  status: string 
}> => {
  return apiCall('/health');
};

export default {
  // Vendors
  createVendor,
  listVendors,
  getVendor,
  updateVendor,
  deleteVendor,
  
  // Audits
  createAudit,
  getAudit,
  runComplianceCheck,
  getAuditFindings,
  getFinding,
  updateFinding,
  submitCAPA,
  
  // Rules
  listRules,
  getRule,
  getRuleCategories,
  searchRules,
  getRecommendedRules,
  
  // Dashboard
  getPortfolioDashboard,
  generateAuditReport,
  
  // Utils
  healthCheck,
};
