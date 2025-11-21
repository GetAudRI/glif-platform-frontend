/**
 * API Service Layer
 * Handles all backend API calls
 */

const API_BASE = 'http://localhost:5001';

export interface Claim {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface SOP {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Test backend connection
 */
export async function testConnection() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return await response.json();
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  }
}

/**
 * Test audit module health
 */
export async function testAuditModule() {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/health`);
    return await response.json();
  } catch (error) {
    console.error('Audit module test failed:', error);
    throw error;
  }
}

/**
 * List available claims
 */
export async function listClaims(): Promise<{ success: boolean; claims: Claim[]; count: number }> {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/files/claims`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to list claims:', error);
    throw error;
  }
}

/**
 * List available SOPs
 */
export async function listSOPs(): Promise<{ success: boolean; sops: SOP[]; count: number }> {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/files/sops`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to list SOPs:', error);
    throw error;
  }
}

/**
 * Start a new audit
 */
export async function startAudit(claims: string[], sops: string[]) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ claims, sops }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to start audit');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to start audit:', error);
    throw error;
  }
}

/**
 * Get audit progress
 */
export async function getAuditProgress(auditId: string) {
  try {
    const response = await fetch(`${API_BASE}/api/audit-oversight/audit/${auditId}/progress`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to get audit progress:', error);
    throw error;
  }
}
