/**
 * Audit History Component
 * View all completed audits with detailed findings
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Factory
} from 'lucide-react';
import { listVendors, type Vendor, type VendorAudit, type VendorAuditFinding } from '../../services/vendorAuditApi';

interface AuditWithDetails extends VendorAudit {
  vendor?: Vendor;
  findings_detail?: VendorAuditFinding[];
}

const AuditHistory: React.FC = () => {
  const [audits, setAudits] = useState<AuditWithDetails[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState<AuditWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load vendors
      const vendorsResponse = await listVendors({});
      setVendors(vendorsResponse.vendors);

      // Load audits from all vendors
      const allAudits: AuditWithDetails[] = [];
      for (const vendor of vendorsResponse.vendors) {
        // Mock: In real implementation, would call getVendorAudits API
        // For now, we'll query the database via a new endpoint
        try {
          const response = await fetch(`http://localhost:5002/api/vendor-audit/vendors/${vendor.id}`, {
            headers: { 'X-User-Id': 'demo-user' }
          });
          const data = await response.json();
          if (data.success && data.audit_history) {
            const auditsWithVendor = data.audit_history.map((audit: VendorAudit) => ({
              ...audit,
              vendor
            }));
            allAudits.push(...auditsWithVendor);
          }
        } catch (error) {
          console.error(`Error loading audits for vendor ${vendor.id}:`, error);
        }
      }

      // Sort by date (newest first)
      allAudits.sort((a, b) => 
        new Date(b.audit_date).getTime() - new Date(a.audit_date).getTime()
      );

      setAudits(allAudits);
    } catch (error) {
      console.error('Error loading audit history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditDetails = async (audit: AuditWithDetails) => {
    try {
      const response = await fetch(`http://localhost:5002/api/vendor-audit/audits/${audit.id}`, {
        headers: { 'X-User-Id': 'demo-user' }
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedAudit({
          ...audit,
          findings_detail: data.findings
        });
      }
    } catch (error) {
      console.error('Error loading audit details:', error);
      setSelectedAudit(audit);
    }
  };

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = 
      audit.vendor?.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      audit.compliance_status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'status-pass';
      case 'conditional': return 'status-warning';
      case 'rejected': return 'status-fail';
      case 'pending': return 'status-na';
      default: return 'status-na';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'sev-critical';
      case 'major': return 'sev-major';
      case 'minor': return 'sev-minor';
      default: return 'status-na';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-rust animate-spin" />
      </div>
    );
  }

  if (selectedAudit) {
    // Detailed Findings View
    return (
      <div className="p-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedAudit(null)}
          className="btn-secondary mb-6"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span>Back to Audit History</span>
        </button>

        {/* Audit Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Factory className="w-6 h-6 text-rust" strokeWidth={1.75} />
                <h2 className="heading text-2xl text-gray-900">
                  {selectedAudit.vendor?.vendor_name}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedAudit.audit_date).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Audit ID: {selectedAudit.id.substring(0, 8)}...
                </span>
              </div>
            </div>
            <span className={`status-badge ${getStatusColor(selectedAudit.compliance_status)}`}>
              {selectedAudit.compliance_status.toUpperCase()}
            </span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="heading text-3xl tracking-tighter leading-none num text-neutral-950">{selectedAudit.overall_score?.toFixed(0)}%</div>
              <div className="overline mt-3">Overall Score</div>
            </div>
            <div className="text-center">
              <div className="heading text-3xl tracking-tighter leading-none num text-red-700">{selectedAudit.critical_findings}</div>
              <div className="overline mt-3">Critical</div>
            </div>
            <div className="text-center">
              <div className="heading text-3xl tracking-tighter leading-none num text-orange-700">{selectedAudit.major_findings}</div>
              <div className="overline mt-3">Major</div>
            </div>
            <div className="text-center">
              <div className="heading text-3xl tracking-tighter leading-none num text-yellow-700">{selectedAudit.minor_findings}</div>
              <div className="overline mt-3">Minor</div>
            </div>
          </div>
        </div>

        {/* Findings List */}
        <div className="card p-6">
          <h3 className="heading text-lg text-gray-900 mb-4">
            Detailed Findings ({selectedAudit.findings_detail?.length || 0})
          </h3>

          {!selectedAudit.findings_detail || selectedAudit.findings_detail.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>No findings - Fully compliant!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedAudit.findings_detail.map((finding, index) => (
                <div
                  key={finding.id}
                  className={`border rounded-sm p-4 ${getSeverityColor(finding.severity)}`}
                >
                  {/* Finding Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="pill">
                          {finding.severity}
                        </span>
                        <span className="text-sm text-gray-600">Finding #{index + 1}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900">{finding.rule_name}</h4>
                    </div>
                    <span className={`status-badge ${
                      finding.status === 'open' ? 'status-fail' :
                      finding.status === 'in_progress' ? 'status-warning' :
                      finding.status === 'closed' ? 'status-pass' :
                      'status-na'
                    }`}>
                      {finding.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Finding Description */}
                  <p className="text-sm text-gray-700 mb-3">{finding.finding_text}</p>

                  {/* Evidence */}
                  {finding.evidence_excerpt && (
                    <div className="bg-white border border-hair rounded-sm p-3 mb-3">
                      <div className="overline mb-1">Evidence</div>
                      <div className="text-sm text-gray-700 italic">"{finding.evidence_excerpt}"</div>
                      {finding.evidence_page_number && (
                        <div className="text-xs text-gray-500 mt-1">Page {finding.evidence_page_number}</div>
                      )}
                    </div>
                  )}

                  {/* CAPA Info */}
                  {finding.capa_required && (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-gray-700">CAPA Required</span>
                      {finding.capa_due_date && (
                        <span className="text-gray-600">
                          Due: {new Date(finding.capa_due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}

                  {/* CAPA Description (if exists) */}
                  {finding.capa_description && (
                    <div className="mt-3 pt-3 border-t border-hair">
                      <div className="overline mb-1">CAPA Plan</div>
                      <div className="text-sm text-gray-700">{finding.capa_description}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Audit List View
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="overline mb-2">Audit Archive</div>
        <h2 className="heading text-2xl text-gray-900 mb-2">Audit History</h2>
        <p className="text-gray-600">View all completed vendor compliance audits</p>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vendor name or audit ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field-input pl-10"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="field-input"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="conditional">Conditional</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audits List */}
      {filteredAudits.length === 0 ? (
        <div className="border border-dashed border-hair bg-white p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all' 
              ? 'No audits match your search criteria'
              : 'No audits found. Run your first vendor audit!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAudits.map((audit) => (
            <button
              key={audit.id}
              onClick={() => loadAuditDetails(audit)}
              className="w-full bg-white rounded-sm border border-hair p-4 hover:bg-neutral-50 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Factory className="w-5 h-5 text-rust" strokeWidth={1.75} />
                    <h3 className="font-semibold text-gray-900">{audit.vendor?.vendor_name}</h3>
                    <span className={`status-badge ${getStatusColor(audit.compliance_status)}`}>
                      {audit.compliance_status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(audit.audit_date).toLocaleDateString()}
                    </span>
                    <span>Score: {audit.overall_score?.toFixed(0)}%</span>
                    <span className="flex items-center gap-2">
                      <span className="text-red-600">{audit.critical_findings}C</span>
                      <span className="text-orange-600">{audit.major_findings}M</span>
                      <span className="text-yellow-600">{audit.minor_findings}m</span>
                    </span>
                    <span className="text-gray-400">ID: {audit.id.substring(0, 8)}...</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-sm p-4 border border-hair">
          <div className="heading text-3xl tracking-tighter leading-none num text-neutral-950">{audits.length}</div>
          <div className="overline mt-3">Total Audits</div>
        </div>
        <div className="bg-white rounded-sm p-4 border border-hair">
          <div className="heading text-3xl tracking-tighter leading-none num text-green-700">
            {audits.filter(a => a.compliance_status === 'approved').length}
          </div>
          <div className="overline mt-3">Approved</div>
        </div>
        <div className="bg-white rounded-sm p-4 border border-hair">
          <div className="heading text-3xl tracking-tighter leading-none num text-yellow-700">
            {audits.filter(a => a.compliance_status === 'conditional').length}
          </div>
          <div className="overline mt-3">Conditional</div>
        </div>
        <div className="bg-white rounded-sm p-4 border border-hair">
          <div className="heading text-3xl tracking-tighter leading-none num text-red-700">
            {audits.filter(a => a.compliance_status === 'rejected').length}
          </div>
          <div className="overline mt-3">Rejected</div>
        </div>
      </div>
    </div>
  );
};

export default AuditHistory;
