/**
 * Single Vendor Audit Workflow
 * 5-step compliance audit process
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Upload, 
  FileText, 
  AlertCircle,
  CheckSquare,
  Loader2,
  Factory,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { 
  listVendors, 
  createAudit, 
  runComplianceCheck,
  listRules,
  type Vendor,
  type GxPRule,
  type VendorAudit,
  type VendorAuditFinding 
} from '../../services/vendorAuditApi';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { number: 1, title: 'Select Vendor', description: 'Choose vendor to audit' },
  { number: 2, title: 'Upload Documents', description: 'Add vendor documentation' },
  { number: 3, title: 'Select Standards', description: 'Choose GxP compliance rules' },
  { number: 4, title: 'Run Check', description: 'Execute compliance validation' },
  { number: 5, title: 'Review Findings', description: 'Analyze results and CAPAs' }
];

interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface ComplianceResults {
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
  findings_detail?: VendorAuditFinding[];
}

const GXP_STANDARDS = [
  {
    id: '21_CFR_Part_11',
    name: '21 CFR Part 11',
    description: 'FDA Electronic Records & Signatures',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'EU_GMP_Annex_11',
    name: 'EU GMP Annex 11',
    description: 'EU Computerized Systems',
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'ICH_Q7',
    name: 'ICH Q7',
    description: 'API Manufacturing Quality',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'ALCOA_Plus',
    name: 'ALCOA+',
    description: 'Data Integrity Principles',
    color: 'bg-orange-100 text-orange-800'
  }
];

const SingleVendorAuditWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  
  // Step 1: Vendor Selection
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loadingVendors, setLoadingVendors] = useState(false);
  
  // Step 2: Documents
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  
  // Step 3: Standards
  const [selectedStandards, setSelectedStandards] = useState<string[]>([
    '21_CFR_Part_11',
    'EU_GMP_Annex_11',
    'ICH_Q7',
    'ALCOA_Plus'
  ]);
  
  // Step 4 & 5: Compliance Check
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [complianceResults, setComplianceResults] = useState<ComplianceResults | null>(null);
  const [createdAudit, setCreatedAudit] = useState<VendorAudit | null>(null);

  // Load vendors on mount
  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoadingVendors(true);
    try {
      const response = await listVendors({ status: 'active' });
      setVendors(response.vendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newDocs: UploadedDocument[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setUploadedDocs([...uploadedDocs, ...newDocs]);
  };

  const removeDocument = (docId: string) => {
    setUploadedDocs(uploadedDocs.filter(doc => doc.id !== docId));
  };

  const toggleStandard = (standardId: string) => {
    if (selectedStandards.includes(standardId)) {
      setSelectedStandards(selectedStandards.filter(s => s !== standardId));
    } else {
      setSelectedStandards([...selectedStandards, standardId]);
    }
  };

  const handleRunCheck = async () => {
    if (!selectedVendor) return;

    setIsRunningCheck(true);
    try {
      // Step 1: Create audit
      const auditResponse = await createAudit(selectedVendor.id, {
        audit_type: 'routine',
        compliance_status: 'pending',
        status: 'pending'
      });
      
      setCreatedAudit(auditResponse.audit);

      // Step 2: Get rules for selected standards
      const rulesResponse = await listRules({ active_only: true });
      const selectedRuleIds = rulesResponse.rules
        .filter(rule => selectedStandards.includes(rule.category))
        .map(rule => rule.id);

      // Step 3: Mock document IDs (in real implementation, these would come from actual uploads)
      const documentIds = uploadedDocs.map(doc => doc.id);

      // Step 4: Run compliance check
      const checkResponse = await runComplianceCheck(auditResponse.audit.id, {
        rule_ids: selectedRuleIds,
        document_ids: documentIds
      });

      setComplianceResults(checkResponse);
      setCurrentStep(5);
    } catch (error) {
      console.error('Error running compliance check:', error);
      alert('Failed to run compliance check. Check console for details.');
    } finally {
      setIsRunningCheck(false);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedVendor !== null;
      case 2:
        return uploadedDocs.length > 0;
      case 3:
        return selectedStandards.length > 0;
      case 4:
        return true;
      case 5:
        return false; // Last step
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Select Vendor to Audit</h3>
              <p className="text-sm text-gray-600 mt-1">Choose an existing vendor from your portfolio</p>
            </div>

            {loadingVendors ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-12">
                <Factory className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No vendors found. Create vendors in the Vendor Management tab first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {vendors.map(vendor => (
                  <button
                    key={vendor.id}
                    onClick={() => setSelectedVendor(vendor)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedVendor?.id === vendor.id
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">🏭</div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{vendor.vendor_name}</h4>
                            <p className="text-sm text-gray-600">{vendor.vendor_type.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className={`px-2 py-1 rounded-full ${
                            vendor.risk_tier === 'Critical' ? 'bg-red-100 text-red-800' :
                            vendor.risk_tier === 'High' ? 'bg-orange-100 text-orange-800' :
                            vendor.risk_tier === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {vendor.risk_tier} Risk
                          </span>
                          <span className="text-gray-600">📍 {vendor.location || 'Location not specified'}</span>
                        </div>
                      </div>
                      {selectedVendor?.id === vendor.id && (
                        <CheckCircle className="w-6 h-6 text-cyan-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upload Vendor Documents</h3>
              <p className="text-sm text-gray-600 mt-1">Upload validation reports, quality manuals, SOPs, and compliance documentation</p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-500 transition-colors">
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">PDF, TXT, DOC, DOCX (max 50MB each)</p>
              </label>
            </div>

            {/* Uploaded Documents List */}
            {uploadedDocs.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Uploaded Documents ({uploadedDocs.length})</h4>
                {uploadedDocs.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-cyan-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Suggested Documents */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Recommended Documents</h4>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• Validation Summary Reports</li>
                    <li>• Quality Management System Documentation</li>
                    <li>• Computer System Validation Protocols</li>
                    <li>• Training Records & Audit Trails</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Select GxP Compliance Standards</h3>
              <p className="text-sm text-gray-600 mt-1">Choose which regulatory standards to validate against</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GXP_STANDARDS.map(standard => (
                <button
                  key={standard.id}
                  onClick={() => toggleStandard(standard.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedStandards.includes(standard.id)
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckSquare className={`w-5 h-5 ${
                          selectedStandards.includes(standard.id) ? 'text-cyan-600' : 'text-gray-400'
                        }`} />
                        <h4 className="font-semibold text-gray-900">{standard.name}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{standard.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Selection Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Standards Selected:</span>
                  <span className="ml-2 font-semibold text-cyan-600">{selectedStandards.length} / {GXP_STANDARDS.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">Approximate Rules:</span>
                  <span className="ml-2 font-semibold text-cyan-600">~{selectedStandards.length * 12} rules</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Review & Run Compliance Check</h3>
              <p className="text-sm text-gray-600 mt-1">Review your selections and execute the compliance validation</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Vendor Summary */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="text-blue-600 mb-2">🏭</div>
                <h4 className="font-semibold text-gray-900">Vendor</h4>
                <p className="text-sm text-gray-700 mt-1">{selectedVendor?.vendor_name}</p>
                <p className="text-xs text-gray-600">{selectedVendor?.vendor_type.replace(/_/g, ' ')}</p>
              </div>

              {/* Documents Summary */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="text-green-600 mb-2">📄</div>
                <h4 className="font-semibold text-gray-900">Documents</h4>
                <p className="text-sm text-gray-700 mt-1">{uploadedDocs.length} files uploaded</p>
                <p className="text-xs text-gray-600">
                  {(uploadedDocs.reduce((sum, doc) => sum + doc.size, 0) / 1024).toFixed(1)} KB total
                </p>
              </div>

              {/* Standards Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="text-purple-600 mb-2">📋</div>
                <h4 className="font-semibold text-gray-900">Standards</h4>
                <p className="text-sm text-gray-700 mt-1">{selectedStandards.length} GxP standards</p>
                <p className="text-xs text-gray-600">~{selectedStandards.length * 12} rules total</p>
              </div>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Documents to Review</h4>
              <div className="space-y-2">
                {uploadedDocs.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <FileText className="w-4 h-4 text-cyan-600" />
                    <span>{doc.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Standards List */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Selected Standards</h4>
              <div className="flex flex-wrap gap-2">
                {selectedStandards.map(stdId => {
                  const std = GXP_STANDARDS.find(s => s.id === stdId);
                  return std ? (
                    <span key={stdId} className={`px-3 py-1 rounded-full text-sm font-medium ${std.color}`}>
                      {std.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Run Button */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6 text-center">
              <button
                onClick={handleRunCheck}
                disabled={isRunningCheck}
                className="px-8 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center gap-2"
              >
                {isRunningCheck ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Running Compliance Check...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Run Compliance Check
                  </>
                )}
              </button>
              <p className="text-sm text-gray-600 mt-3">
                This will analyze all documents against the selected GxP standards
              </p>
            </div>
          </div>
        );

      case 5:
        if (!complianceResults) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
            </div>
          );
        }

        const statusColor = 
          complianceResults.compliance_status === 'approved' ? 'green' :
          complianceResults.compliance_status === 'conditional' ? 'yellow' :
          complianceResults.compliance_status === 'rejected' ? 'red' : 'gray';

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Compliance Check Results</h3>
              <p className="text-sm text-gray-600 mt-1">Review findings and manage corrective actions</p>
            </div>

            {/* Overall Status */}
            <div className={`bg-gradient-to-br from-${statusColor}-50 to-${statusColor}-100 rounded-lg p-6 border-2 border-${statusColor}-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">
                    Compliance Score: {complianceResults.overall_score}%
                  </h4>
                  <p className={`text-lg font-semibold text-${statusColor}-700 mt-1`}>
                    Status: {complianceResults.compliance_status.toUpperCase()}
                  </p>
                </div>
                {complianceResults.compliance_status === 'approved' && (
                  <CheckCircle className="w-16 h-16 text-green-600" />
                )}
                {complianceResults.compliance_status === 'conditional' && (
                  <AlertTriangle className="w-16 h-16 text-yellow-600" />
                )}
                {complianceResults.compliance_status === 'rejected' && (
                  <XCircle className="w-16 h-16 text-red-600" />
                )}
              </div>
            </div>

            {/* Findings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="text-3xl font-bold text-red-600">{complianceResults.findings.critical}</div>
                <div className="text-sm font-medium text-red-900 mt-1">Critical Findings</div>
                <div className="text-xs text-red-700">Immediate action required</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-3xl font-bold text-orange-600">{complianceResults.findings.major}</div>
                <div className="text-sm font-medium text-orange-900 mt-1">Major Findings</div>
                <div className="text-xs text-orange-700">Requires CAPA</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">{complianceResults.findings.minor}</div>
                <div className="text-sm font-medium text-yellow-900 mt-1">Minor Findings</div>
                <div className="text-xs text-yellow-700">Recommendations</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{complianceResults.findings.total}</div>
                <div className="text-sm font-medium text-blue-900 mt-1">Total Findings</div>
                <div className="text-xs text-blue-700">{complianceResults.rules_checked} rules checked</div>
              </div>
            </div>

            {/* Check Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-3">Audit Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Audit ID:</span>
                  <span className="ml-2 font-mono text-cyan-600">{complianceResults.audit_id.substring(0, 8)}...</span>
                </div>
                <div>
                  <span className="text-gray-600">Vendor:</span>
                  <span className="ml-2 font-medium">{selectedVendor?.vendor_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rules Checked:</span>
                  <span className="ml-2 font-medium">{complianceResults.rules_checked}</span>
                </div>
                <div>
                  <span className="text-gray-600">Documents Reviewed:</span>
                  <span className="ml-2 font-medium">{complianceResults.documents_reviewed}</span>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h4 className="font-medium text-cyan-900 mb-2">Next Steps</h4>
              <ul className="text-sm text-cyan-800 space-y-1">
                <li>✓ Review all findings in detail</li>
                <li>✓ Create CAPAs for critical and major findings</li>
                <li>✓ Schedule follow-up audits as needed</li>
                <li>✓ Update vendor risk assessment</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium">
                View Detailed Findings
              </button>
              <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Create CAPA Plan
              </button>
              <button className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                Export Report
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center min-w-[120px]">
                <div 
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.number
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <span className="text-sm font-semibold">{step.number}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-cyan-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 min-h-[500px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as Step)}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Previous
          </button>
          <div className="text-sm text-gray-600">
            Step {currentStep} of {STEPS.length}
          </div>
          <button
            onClick={() => {
              if (currentStep === 4) {
                // Don't auto-advance on step 4 - let the "Run Check" button handle it
                return;
              }
              setCurrentStep(Math.min(5, currentStep + 1) as Step);
            }}
            disabled={currentStep === 4 || !canProceedToNextStep()}
            className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Next
          </button>
        </div>
      )}

      {/* Completion Actions (Step 5) */}
      {currentStep === 5 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => {
              // Reset workflow
              setCurrentStep(1);
              setSelectedVendor(null);
              setUploadedDocs([]);
              setSelectedStandards(['21_CFR_Part_11', 'EU_GMP_Annex_11', 'ICH_Q7', 'ALCOA_Plus']);
              setComplianceResults(null);
              setCreatedAudit(null);
            }}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Start New Audit
          </button>
          <div className="text-sm font-medium text-green-600">
            ✓ Audit Completed
          </div>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Print Report
          </button>
        </div>
      )}
    </div>
  );
};

export default SingleVendorAuditWorkflow;
