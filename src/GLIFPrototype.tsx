import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  FileText, Database, Settings, BarChart3, FileSearch, Network, 
  CheckCircle2, AlertTriangle, XCircle, Download, Plus, Search,
  ChevronRight, Clock, TrendingUp, Shield, Users, Activity, Zap, DollarSign, ClipboardCheck
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  testConnection, testAuditModule, listClaims, listSOPs, startAudit, 
  startExtraction, getAuditProgress, runAuditCheck, getExtractedRules,
  startValidation, getValidationResults,  // DAY 4: Added validation imports
  saveRulesToJSON,  // MANUAL SAVE: Added save rules function
  listDocuments, getDocument, deleteDocument, // DOCUMENTS: Added document delete
  generateClaimsFromSOP,  // CLAIM GENERATION: Added claim generation function
  generateClaimsFromSchema,  // NEW: JSON Schema-based claim generation
  listSchemas,  // NEW: List available schemas
  listPolicyDeclarations, getPolicyDeclaration, deletePolicyDeclaration,  // POLICY DECLARATIONS
  getTeamCheckpostFile, deleteTeamCheckpostFile, // TEAM CHECKPOSTS
  deletePlaybook, // SOP delete
  listAuditPlaybooks, listTeamCheckpostFiles, // Audit corpus lists (DB-backed)
} from './services/api';
import SingleFileAudit from './SingleFileAudit';
import SingleFileAuditResults from './SingleFileAuditResults';
import TestD from './TestD';
import ProcessingVelocityDashboard from './ProcessingVelocityDashboard';
import LiveAuditMonitor from './LiveAuditMonitor';
import CostAnalytics from './components/CostAnalytics';
import MarketConductTab from './components/MarketConductTab';
import RulesEngineDashboard from './components/RulesEngineDashboard';
import AuditResults from './components/AuditResults';
import ViewExtractions from './components/ViewExtractions';
import DocumentViewer from './components/DocumentViewer';
import NarrativeValidationResults from './components/NarrativeValidationResults';
// Types
type GNode = { 
  id: string; 
  label: string; 
  type: 'claim'|'policy'|'document'|'metadata'; 
  status?: 'normal'|'missing' 
};
type GLink = { id: string; source: string; target: string; kind: 'doc'|'meta' };

// Mock Data - Link Graphs
const PREBUILT_GRAPHS: Record<string, { nodes: GNode[]; links: GLink[] }> = {
  C1234: {
    nodes: [
      { id: 'claim:C1234', label: 'C1234', type: 'claim' },
      { id: 'policy:P9876', label: 'P9876', type: 'policy' },
      { id: 'doc:PolicyDeclarations.pdf', label: 'PolicyDeclarations.pdf', type: 'document' },
      { id: 'doc:PaymentVoucher.xlsx', label: 'PaymentVoucher.xlsx', type: 'document' },
      { id: 'doc:ProofOfAge.pdf', label: 'ProofOfAge.pdf', type: 'document', status: 'missing' },
      { id: 'meta:AgeVerified', label: 'AgeVerified=false', type: 'metadata' },
    ],
    links: [
      { id: 'l1', source: 'claim:C1234', target: 'policy:P9876', kind: 'meta' },
      { id: 'l2', source: 'claim:C1234', target: 'doc:PolicyDeclarations.pdf', kind: 'doc' },
      { id: 'l3', source: 'claim:C1234', target: 'doc:PaymentVoucher.xlsx', kind: 'doc' },
      { id: 'l4', source: 'claim:C1234', target: 'doc:ProofOfAge.pdf', kind: 'doc' },
      { id: 'l5', source: 'claim:C1234', target: 'meta:AgeVerified', kind: 'meta' },
    ],
  },
  C1377: {
    nodes: [
      { id: 'claim:C1377', label: 'C1377', type: 'claim' },
      { id: 'policy:P9945', label: 'P9945', type: 'policy' },
      { id: 'doc:CoverageLetter.docx', label: 'CoverageLetter.docx', type: 'document' },
      { id: 'doc:PaymentVoucher.xlsx', label: 'PaymentVoucher.xlsx', type: 'document' },
      { id: 'meta:PaidNearLimit', label: 'PaidNearLimit=0.95', type: 'metadata' },
    ],
    links: [
      { id: 'l1', source: 'claim:C1377', target: 'policy:P9945', kind: 'meta' },
      { id: 'l2', source: 'claim:C1377', target: 'doc:CoverageLetter.docx', kind: 'doc' },
      { id: 'l3', source: 'claim:C1377', target: 'doc:PaymentVoucher.xlsx', kind: 'doc' },
      { id: 'l4', source: 'claim:C1377', target: 'meta:PaidNearLimit', kind: 'meta' },
    ],
  },
  C1411: {
    nodes: [
      { id: 'claim:C1411', label: 'C1411', type: 'claim' },
      { id: 'policy:P9960', label: 'P9960', type: 'policy' },
      { id: 'doc:AirlinePIR.pdf', label: 'AirlinePIR.pdf', type: 'document', status: 'missing' },
      { id: 'doc:Receipts.zip', label: 'Receipts.zip', type: 'document' },
      { id: 'meta:DelayHours', label: 'DelayHours=7', type: 'metadata' },
    ],
    links: [
      { id: 'l1', source: 'claim:C1411', target: 'policy:P9960', kind: 'meta' },
      { id: 'l2', source: 'claim:C1411', target: 'doc:AirlinePIR.pdf', kind: 'doc' },
      { id: 'l3', source: 'claim:C1411', target: 'doc:Receipts.zip', kind: 'doc' },
      { id: 'l4', source: 'claim:C1411', target: 'meta:DelayHours', kind: 'meta' },
    ],
  },
};

// Mock Claims Data
const MOCK_CLAIMS = [
  { 
    id: 'C1234', 
    policyId: 'P9876', 
    claimant: 'Jane Smith', 
    type: 'Auto', 
    amount: 4500, 
    status: 'Under Review',
    risk: 'high',
    triggered: 3,
    missing: 1,
    date: '2025-10-15'
  },
  { 
    id: 'C1377', 
    policyId: 'P9945', 
    claimant: 'Bob Johnson', 
    type: 'Home', 
    amount: 12000, 
    status: 'Approved',
    risk: 'medium',
    triggered: 2,
    missing: 0,
    date: '2025-10-18'
  },
  { 
    id: 'C1411', 
    policyId: 'P9960', 
    claimant: 'Alice Wong', 
    type: 'Travel', 
    amount: 800, 
    status: 'Pending Docs',
    risk: 'high',
    triggered: 2,
    missing: 1,
    date: '2025-10-20'
  },
];

export default function AudRIPrototype() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'single-audit'; // Default to single-audit instead of connect
  const [activeTab, setActiveTab] = useState(tabParam);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [connected, setConnected] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState('C1234');
  const [graphView, setGraphView] = useState<'basic' | 'enhanced'>('enhanced');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestClaimId, setRequestClaimId] = useState('');
  const [requestDocName, setRequestDocName] = useState('');
  const [auditStarted, setAuditStarted] = useState(false);
  const [availableClaims, setAvailableClaims] = useState<any[]>([]);
  const [availableSOPs, setAvailableSOPs] = useState<any[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [selectedSOPs, setSelectedSOPs] = useState<string[]>([]);
  const [selectedCheckpostFile, setSelectedCheckpostFile] = useState<number | null>(null);
  const [auditId, setAuditId] = useState<string>('');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string>('');
  const [extracting, setExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [rulesCount, setRulesCount] = useState(0);
  const [claimsExtracted, setClaimsExtracted] = useState(0);
  const [showAuditCheck, setShowAuditCheck] = useState(false);
  const [auditCheckClaim, setAuditCheckClaim] = useState('');
  const [auditCheckSOP, setAuditCheckSOP] = useState('');
  const [auditCheckResult, setAuditCheckResult] = useState<any>(null);
  const [auditCheckLoading, setAuditCheckLoading] = useState(false);
  
  // ==================== DAY 4 UPDATE: VALIDATION STATE ====================
  const [validating, setValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationSummary, setValidationSummary] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  // ==================== END DAY 4 UPDATE ====================
  
  // ==================== MANUAL SAVE RULES STATE ====================
  const [savingRules, setSavingRules] = useState(false);
  const [rulesSaved, setRulesSaved] = useState(false);
  const [savedFiles, setSavedFiles] = useState<string[]>([]);
  // ==================== END MANUAL SAVE RULES ====================

  const selectedSopName =
    selectedSOPs.length === 1
      ? availableSOPs.find((s) => s.id === selectedSOPs[0])?.name || ''
      : '';
  const selectedSopIsJson =
    typeof selectedSopName === 'string' && selectedSopName.endsWith('.json');
  
  // ==================== DAY 5: DRILL-DOWN MODAL STATE ====================
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownClaim, setDrillDownClaim] = useState<any>(null);
  // ==================== END DAY 5 STATE ====================
  
  // ==================== CORPUS TAB STATE ====================
  const [documents, setDocuments] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [teamCheckpostFiles, setTeamCheckpostFiles] = useState<any[]>([]);
  const [policyDeclarations, setPolicyDeclarations] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [selectedPolicyDeclaration, setSelectedPolicyDeclaration] = useState<any | null>(null);
  const [selectedTeamCheckpostFile, setSelectedTeamCheckpostFile] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'document' | 'extractions' | null>(null);
  const [corpusView, setCorpusView] = useState<'claims' | 'sops' | 'checkposts' | 'policies'>('claims');
  const [selectedConcept, setSelectedConcept] = useState('concept1_validation_story.html');
  // ==================== END CORPUS TAB STATE ====================
  
  // ==================== OLD CLAIM GENERATOR (SOP-based) ====================
  function ClaimGenerator() {
    const [sopFile, setSopFile] = useState<File | null>(null);
    const [numClaims, setNumClaims] = useState(5);
    const [compliantRatio, setCompliantRatio] = useState(0.5);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
      if (!sopFile) {
        setError('Please select a SOP file');
        return;
      }

      setGenerating(true);
      setError('');
      setResult(null);

      try {
        const data = await generateClaimsFromSOP(sopFile, numClaims, compliantRatio);
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'Failed to generate claims');
      } finally {
        setGenerating(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload SOP File
            </label>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setSopFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Claims (1-20)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numClaims}
              onChange={(e) => setNumClaims(parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compliant Ratio (0.0 - 1.0)
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={compliantRatio}
              onChange={(e) => setCompliantRatio(parseFloat(e.target.value) || 0.5)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !sopFile}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              Generating Claims...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Generate Claims
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-1">
                  Successfully generated {result.generated_count} claims!
                </p>
                <p className="text-sm text-green-700">
                  Files saved to: <code className="bg-green-100 px-2 py-1 rounded">{result.output_folder}</code>
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Compliant: {result.files.filter((f: any) => f.compliance_status === 'compliant').length} | 
                  Non-compliant: {result.files.filter((f: any) => f.compliance_status === 'non_compliant').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  // ==================== END OLD CLAIM GENERATOR ====================

  // ==================== NEW: SCHEMA-BASED CLAIM GENERATOR ====================
  function SchemaBasedClaimGenerator() {
    const [docType, setDocType] = useState('claim');
    const [schemaVersion, setSchemaVersion] = useState('claim_schema_v1.0.json');
    const [availableSchemas, setAvailableSchemas] = useState<string[]>([]);
    const [numCompliant, setNumCompliant] = useState(1);
    const [numNoncompliant, setNumNoncompliant] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    // Load available schemas on mount
    useEffect(() => {
      const loadSchemas = async () => {
        try {
          const data = await listSchemas(docType);
          if (data.success && data.schema_files) {
            setAvailableSchemas(data.schema_files);
            // Set first schema as default if available
            if (data.schema_files.length > 0) {
              setSchemaVersion(data.schema_files[0]);
            }
          }
        } catch (err) {
          console.error('Error loading schemas:', err);
        }
      };
      loadSchemas();
    }, [docType]);

    const handleGenerate = async () => {
      setGenerating(true);
      setError('');
      setResult(null);

      try {
        const data = await generateClaimsFromSchema(
          docType,
          schemaVersion,
          numCompliant,
          numNoncompliant,
          true
        );
        setResult(data);
      } catch (err: any) {
        setError(err.message || 'Failed to generate claims from schema');
      } finally {
        setGenerating(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={generating}
            >
              <option value="claim">Claim</option>
              <option value="policy">Policy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schema File
            </label>
            <select
              value={schemaVersion}
              onChange={(e) => setSchemaVersion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={generating}
            >
              {availableSchemas.map((schemaFile) => (
                <option key={schemaFile} value={schemaFile}>
                  {schemaFile}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Actual file from: config/extraction_schemas/
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compliant Claims (✅ Will PASS)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              value={numCompliant}
              onChange={(e) => setNumCompliant(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={generating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Non-Compliant Claims (❌ Will FAIL)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              value={numNoncompliant}
              onChange={(e) => setNumNoncompliant(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={generating}
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Clock className="w-5 h-5 animate-spin" />
              Generating Claims from Schema...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              🎯 Generate Claims
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 mb-2">
                  ✅ Successfully generated {result.num_claims_generated} claims!
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Schema: <code className="bg-green-100 px-2 py-1 rounded">{docType}_schema_v{result.schema_version}.json</code>
                </p>
                
                {result.saved_files && result.saved_files.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-800">Generated Files:</p>
                    {result.saved_files.map((file: any, idx: number) => (
                      <div key={idx} className="bg-white p-3 rounded border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          {file.compliance_status === 'compliant' ? (
                            <span className="text-green-600">✅</span>
                          ) : (
                            <span className="text-red-600">❌</span>
                          )}
                          <code className="text-xs font-mono text-gray-700">{file.filename}</code>
                        </div>
                        <p className="text-xs text-gray-600">
                          Claim: {file.claim_number} | 
                          Status: {file.compliance_status === 'compliant' ? 'PASS' : 'FAIL'}
                        </p>
                        {file.expected_violations && file.expected_violations.length > 0 && (
                          <div className="mt-2 text-xs text-red-600">
                            <p className="font-medium">Expected Violations:</p>
                            <ul className="list-disc list-inside ml-2">
                              {file.expected_violations.map((v: string, i: number) => (
                                <li key={i}>{v}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm font-medium text-blue-900 mb-2">🎯 Next Steps:</p>
                  <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to <strong>Single File Audit</strong> tab</li>
                    <li>Upload the generated claims (from: {result.output_directory})</li>
                    <li>Use the <strong>same schema version</strong> for validation</li>
                    <li>Verify compliant claims PASS ✅ and non-compliant claims FAIL ❌</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  // ==================== END SCHEMA-BASED CLAIM GENERATOR ====================
  
  // ==================== FINAL SUMMARY STATE ====================
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  // ==================== END FINAL SUMMARY STATE ====================

  // Load files when audit tab is clicked
  useEffect(() => {
    if (auditStarted && availableClaims.length === 0) {
      loadFiles();
    }
  }, [auditStarted]);

  // Poll extraction progress
  useEffect(() => {
    if (!auditId || !extracting) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const progress = await getAuditProgress(auditId);
        setExtractionProgress(progress.progress || 0);
        setCurrentTask(progress.current_task || '');
        setRulesCount(progress.rules_count || 0);
        setClaimsExtracted(progress.claims_extracted || 0);
        
        if (progress.status === 'extracted') {
          setExtracting(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Failed to poll progress:', err);
      }
    }, 2000);
    
    return () => clearInterval(pollInterval);
  }, [auditId, extracting]);

  async function loadFiles() {
    setLoadingFiles(true);
    setError('');
    try {
      const [claimsData, sopsData, checkpostsData] = await Promise.all([
        listClaims(100),
        listSOPs(),
        listTeamCheckpostFiles()
      ]);
      setAvailableClaims((claimsData as any).documents || (claimsData as any).claims || []);
      setAvailableSOPs((sopsData as any).playbooks || (sopsData as any).sops || []);
      setTeamCheckpostFiles((checkpostsData as any).team_checkpost_files || checkpostsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  }

  // Load documents when corpus tab is active
  useEffect(() => {
    if (activeTab === 'corpus') {
      loadDocuments();
    }
  }, [activeTab]);

  async function loadDocuments() {
    setLoadingDocuments(true);
    try {
      // Load claims (documents), playbooks (SOPs), team checkpost files, and policy declarations
      const [documentsData, playbooksData, checkpostsData, policyDeclarationsData] = await Promise.all([
        listDocuments({ docType: 'claim', limit: 100 }),
        listAuditPlaybooks(),
        listTeamCheckpostFiles(),
        listPolicyDeclarations()
      ]);
      
      setDocuments(documentsData.documents || []);
      setPlaybooks((playbooksData as any).playbooks || playbooksData || []);
      setTeamCheckpostFiles((checkpostsData as any).team_checkpost_files || checkpostsData || []);
      if ((policyDeclarationsData as any).success) {
        setPolicyDeclarations((policyDeclarationsData as any).policy_declarations || []);
      } else {
        setPolicyDeclarations((policyDeclarationsData as any).policy_declarations || []);
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoadingDocuments(false);
    }
  }

  // Corpus delete handlers
  const withConfirm = (message: string, action: () => Promise<void>) => {
    if (!window.confirm(message)) return;
    action().catch((err) => {
      console.error(err);
      setError(err.message || 'Delete failed');
    });
  };

  const handleDeleteDocument = (id: number, name?: string) =>
    withConfirm(`Delete document${name ? `: ${name}` : ''}?`, async () => {
      await deleteDocument(id);
      await loadDocuments();
    });

  const handleDeletePlaybook = (id: number, name?: string) =>
    withConfirm(`Delete SOP${name ? `: ${name}` : ''}?`, async () => {
      await deletePlaybook(id);
      await loadDocuments();
    });

  const handleDeleteTeamCheckpostFile = (id: number, name?: string) =>
    withConfirm(`Delete team checkpost file${name ? `: ${name}` : ''}?`, async () => {
      await deleteTeamCheckpostFile(id);
      await loadDocuments();
    });

  const handleDeletePolicyDeclaration = (id: number, name?: string) =>
    withConfirm(`Delete policy declaration${name ? `: ${name}` : ''}?`, async () => {
      await deletePolicyDeclaration(id);
      await loadDocuments();
    });

  async function handleViewDocument(documentId: number, mode: 'document' | 'extractions') {
    try {
      const data = await getDocument(documentId);
      setSelectedDocument(data.document);
      setSelectedPolicyDeclaration(null);
      setViewMode(mode);
    } catch (err: any) {
      console.error('Failed to load document:', err);
      setError(err.message || 'Failed to load document');
    }
  }

  async function handleViewPlaybook(playbookId: number, mode: 'document' | 'extractions') {
    try {
      // Find playbook in the list
      const playbook = playbooks.find(p => p.id === playbookId);
      if (!playbook) {
        setError('Playbook not found');
        return;
      }
      
      // Create a document-like object for the viewer
      const playbookDoc = {
        id: playbook.id,
        name: playbook.name,
        document_type: 'playbook',
        file_path: playbook.file_path,
        extracted_data: playbook.extracted_rules,
        ai_model_used: playbook.ai_model_used,
        input_tokens: playbook.input_tokens,
        output_tokens: playbook.output_tokens,
        total_cost: playbook.total_cost,
        processing_time: playbook.processing_time,
        has_extracted_data: playbook.extracted_rules !== null
      };
      
      setSelectedDocument(playbookDoc);
      setSelectedPolicyDeclaration(null);
      setViewMode(mode);
    } catch (err: any) {
      console.error('Failed to load playbook:', err);
      setError(err.message || 'Failed to load playbook');
    }
  }

  async function handleViewPolicyDeclaration(policyDeclarationId: number, mode: 'document' | 'extractions') {
    try {
      const data = await getPolicyDeclaration(policyDeclarationId);
      setSelectedPolicyDeclaration(data.policy_declaration);
      setSelectedDocument(null);
      setSelectedTeamCheckpostFile(null);
      setViewMode(mode);
    } catch (err: any) {
      console.error('Failed to load policy declaration:', err);
      setError(err.message || 'Failed to load policy declaration');
    }
  }

  async function handleViewTeamCheckpostFile(teamCheckpostFileId: number, mode: 'document' | 'extractions') {
    try {
      const teamCheckpostFile = await getTeamCheckpostFile(teamCheckpostFileId);
      
      // Create a document-like object for the viewer
      const checkpostDoc = {
        id: teamCheckpostFile.id,
        name: teamCheckpostFile.name,
        document_type: 'team_checkpost',
        file_path: teamCheckpostFile.file_path,
        extracted_data: teamCheckpostFile.checkposts_data,
        ai_model_used: teamCheckpostFile.ai_model_used,
        input_tokens: teamCheckpostFile.input_tokens,
        output_tokens: teamCheckpostFile.output_tokens,
        total_cost: teamCheckpostFile.total_cost,
        processing_time: teamCheckpostFile.processing_time,
        has_extracted_data: teamCheckpostFile.checkposts_data !== null && teamCheckpostFile.checkposts_data.length > 0,
        uploaded_at: teamCheckpostFile.created_at
      };
      
      setSelectedTeamCheckpostFile(checkpostDoc);
      setSelectedDocument(null);
      setSelectedPolicyDeclaration(null);
      setViewMode(mode);
    } catch (err: any) {
      console.error('Failed to load team checkpost file:', err);
      setError(err.message || 'Failed to load team checkpost file');
    }
  }

  function closeViewer() {
    setSelectedDocument(null);
    setSelectedPolicyDeclaration(null);
    setSelectedTeamCheckpostFile(null);
    setViewMode(null);
  }

  async function handleStartAudit() {
    if (selectedClaims.length === 0) {
      setError('Please select at least 1 claim');
      return;
    }
    if (selectedSOPs.length === 0) {
      setError('Please select at least 1 SOP');
      return;
    }
    
    try {
      const result = await startAudit(
        selectedClaims,
        selectedSOPs,
        selectedCheckpostFile || undefined
      );
      setAuditId(result.audit_id);
      
      // Auto-trigger extraction
      setExtracting(true);
      setExtractionProgress(0);
      setCurrentTask('Starting extraction...');
      
      await startExtraction(result.audit_id);
    } catch (err: any) {
      setError(err.message || 'Failed to start audit');
      setExtracting(false);
    }
  }

  async function handleRunAuditCheck() {
    if (!auditCheckClaim || !auditCheckSOP) {
      setError('Please select a claim and SOP to test');
      return;
    }
    
    setAuditCheckLoading(true);
    setError('');
    
    try {
      let tempAuditId = auditId;
      if (!tempAuditId) {
        const result = await startAudit([auditCheckClaim], [auditCheckSOP]);
        tempAuditId = result.audit_id;
        setAuditId(tempAuditId);
      }
      
      const result = await runAuditCheck(tempAuditId, auditCheckClaim, auditCheckSOP);
      setAuditCheckResult(result);
    } catch (err: any) {
      setError(err.message || 'Audit check failed');
    } finally {
      setAuditCheckLoading(false);
    }
  }

  function closeAuditCheck() {
    setShowAuditCheck(false);
    setAuditCheckResult(null);
    setAuditCheckClaim('');
    setAuditCheckSOP('');
  }

  // ==================== DAY 4 UPDATE: VALIDATION HANDLER ====================
  async function handleStartValidation() {
    if (!auditId) {
      setError('No audit ID available');
      return;
    }
    
    setValidating(true);
    setError('');
    
    try {
      // Start validation
      const result = await startValidation(auditId);
      
      // Get detailed results
      const resultsData = await getValidationResults(auditId);
      
      setValidationSummary(resultsData.summary);
      setValidationResults(resultsData.results);
      setValidationComplete(true);
      
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  }
  // ==================== END DAY 4 UPDATE ====================

  // ==================== MANUAL SAVE RULES HANDLER ====================
  async function handleSaveRules() {
    if (!auditId) {
      setError('No audit ID available');
      return;
    }
    
    setSavingRules(true);
    setError('');
    
    try {
      const result = await saveRulesToJSON(auditId);
      setSavedFiles(result.files_saved || []);
      setRulesSaved(true);
      
      // Reload SOP files to show new JSON files
      loadFiles();
      
    } catch (err: any) {
      setError(err.message || 'Failed to save rules');
    } finally {
      setSavingRules(false);
    }
  }
  // ==================== END MANUAL SAVE RULES ====================

  // Load files when audit tab is clicked
  useEffect(() => {
    if (auditStarted && availableClaims.length === 0) {
      loadAuditFiles();
    }
  }, [auditStarted]);

  async function loadAuditFiles() {
    setLoadingFiles(true);
    setError('');
    try {
      const [claimsData, sopsData] = await Promise.all([
        listClaims(100),
        listSOPs()
      ]);
      setAvailableClaims((claimsData as any).documents || (claimsData as any).claims || []);
      setAvailableSOPs((sopsData as any).playbooks || (sopsData as any).sops || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoadingFiles(false);
    }
  }

  function toggleClaimSelection(claimId: string) {
    if (selectedClaims.includes(claimId)) {
      setSelectedClaims(selectedClaims.filter(id => id !== claimId));
    } else {
      if (selectedClaims.length >= 25) {
        setError('Maximum 25 claims allowed');
        return;
      }
      setSelectedClaims([...selectedClaims, claimId]);
    }
  }

  function toggleCheckpostSelection(checkpostId: number) {
    if (selectedCheckpostFile === checkpostId) {
      setSelectedCheckpostFile(null);
    } else {
      setSelectedCheckpostFile(checkpostId);
    }
  }

  function toggleSOPSelection(sopId: string) {
    if (selectedSOPs.includes(sopId)) {
      setSelectedSOPs(selectedSOPs.filter(id => id !== sopId));
    } else {
      if (selectedSOPs.length >= 2) {
        setError('Maximum 2 SOPs allowed');
        return;
      }
      setSelectedSOPs([...selectedSOPs, sopId]);
    }
  }

  // Portfolio KPIs
  const portfolioData = [
    { name: 'Compliant', value: 850, color: '#10b981' },
    { name: 'Pending Review', value: 120, color: '#f59e0b' },
    { name: 'Non-Compliant', value: 30, color: '#ef4444' },
  ];

  const riskData = [
    { name: 'Low Risk', value: 600, color: '#10b981' },
    { name: 'Medium Risk', value: 300, color: '#f59e0b' },
    { name: 'High Risk', value: 100, color: '#ef4444' },
  ];

  const auditComplianceData = [
    { name: 'Compliant', value: 82, color: '#10b981' },
    { name: 'Non-Compliant', value: 18, color: '#ef4444' },
  ];

  // Tab Navigation Component - Now handled by sidebar
  // const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
  //   <button
  //     onClick={() => setActiveTab(id)}
  //     className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
  //       activeTab === id
  //         ? 'bg-blue-600 text-white shadow-md'
  //         : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
  //     }`}
  //   >
  //     <Icon className="w-4 h-4" />
  //     {label}
  //   </button>
  // );

  // Card Component
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="px-6 py-4 border-b border-gray-100">
      {children}
    </div>
  );

  const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );

  // Stat Card Component
  const StatCard = ({ label, value, icon: Icon, trend, color = 'blue' }: any) => (
    <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  // Get dynamic page title based on active tab
  const getPageTitle = () => {
    const titles: Record<string, { title: string; subtitle: string }> = {
      'single-audit': { title: 'Single File Audit', subtitle: 'Audit individual documents against policy rules' },
      'single-audit-results': { title: 'Audit Results', subtitle: 'View and analyze audit outcomes' },
      'batch-audits': { title: 'Batch Audits', subtitle: 'Process multiple audits at scale' },
      'connect': { title: 'Connectors', subtitle: 'Connect AudRI to your data sources' },
      'corpus': { title: 'Corpus Management', subtitle: 'Manage policies, rules, and documents' },
      'rules': { title: 'Rules Engine', subtitle: 'Configure and manage audit rules' },
      'graph': { title: 'Link Graph', subtitle: 'Visualize document relationships' },
      'claims': { title: 'Claim Drilldown', subtitle: 'Detailed claim analysis and investigation' },
      'testd': { title: 'TestD', subtitle: 'Test and validate audit configurations' },
      'cost-analytics': { title: 'Cost Analytics', subtitle: 'Monitor and optimize processing costs' },
      'portfolio': { title: 'Portfolio Dashboard', subtitle: 'Overview of all audit activities' },
      'market-conduct': { title: 'Market Conduct Readiness', subtitle: 'Continuous exam preparedness · Aligned to NAIC Unfair Claims Settlement Practices Act' },
      'audit-process': { title: 'Audit Process', subtitle: 'Manage audit workflow and pipeline' },
      'audit-concepts': { title: 'Audit Concepts', subtitle: 'View audit results and insights' }
    };
    return titles[activeTab] || { title: 'Audit Oversight', subtitle: 'Intelligent Insurance Audit Platform v2.1' };
  };

  const pageInfo = getPageTitle();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              {pageInfo.title}
            </h1>
            <p className="text-sm text-neutral-600 mt-1">{pageInfo.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Active Tab Indicator - Shows current selection */}
        <div className="mb-6 card bg-blue-50/30 border-2 border-blue-100">
          <div className="px-6 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Currently Working On</div>
              <div className="text-base font-semibold text-neutral-900">{pageInfo.title}</div>
            </div>
            <div className="text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-full border border-neutral-200">
              Active
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'connect' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Storage Connectors</h2>
                <p className="text-sm text-gray-600 mt-1">Connect AudRI to your data sources</p>
              </CardHeader>
              <CardContent>
                {!connected ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setConnected(true)}
                        className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                      >
                        <Database className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
                        <p className="font-semibold text-gray-900">AWS S3</p>
                        <p className="text-sm text-gray-500 mt-1">Connect to S3 bucket</p>
                      </button>
                      <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                        <Database className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
                        <p className="font-semibold text-gray-900">Google Cloud</p>
                        <p className="text-sm text-gray-500 mt-1">Connect to GCP storage</p>
                      </button>
                      <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                        <Database className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
                        <p className="font-semibold text-gray-900">SharePoint</p>
                        <p className="text-sm text-gray-500 mt-1">Connect to SharePoint</p>
                      </button>
                      <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                        <Database className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
                        <p className="font-semibold text-gray-900">Azure</p>
                        <p className="text-sm text-gray-500 mt-1">Connect to Azure Blob</p>
                      </button>
                      <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group">
                        <Database className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
                        <p className="font-semibold text-gray-900">Local / Network Storage</p>
                        <p className="text-sm text-gray-500 mt-1">Connect to local drive</p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900">AWS S3 Connected</p>
                        <p className="text-sm text-green-700">Bucket: audri-insurance-data-prod</p>
                      </div>
                      <button className="text-sm text-green-700 hover:text-green-900 font-medium">
                        Disconnect
                      </button>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <StatCard label="Documents Indexed" value="12,459" icon={FileText} trend="+8% this week" color="blue" />
                      <StatCard label="Storage Used" value="234 GB" icon={Database} trend="+12 GB" color="purple" />
                      <StatCard label="Last Sync" value="2 min ago" icon={Activity} color="green" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'testd' && (
          <TestD />
        )}

        {activeTab === 'corpus' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Corpus Intelligence</h2>
                    <p className="text-sm text-gray-600 mt-1">AI-classified documents and extracted metadata</p>
                  </div>
                  <button
                    onClick={loadDocuments}
                    disabled={loadingDocuments}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {loadingDocuments ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Tab Switcher */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                  <button
                    onClick={() => setCorpusView('claims')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      corpusView === 'claims'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Claims ({documents.length})
                  </button>
                  <button
                    onClick={() => setCorpusView('sops')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      corpusView === 'sops'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    SOPs ({playbooks.length})
                  </button>
                  <button
                    onClick={() => setCorpusView('checkposts')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      corpusView === 'checkposts'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Checkposts ({teamCheckpostFiles.length})
                  </button>
                  <button
                    onClick={() => setCorpusView('policies')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      corpusView === 'policies'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Policies ({policyDeclarations.length})
                  </button>
                </div>

                {loadingDocuments ? (
                  <div className="text-center py-8 text-gray-500">Loading documents...</div>
                ) : corpusView === 'claims' ? (
                  documents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No claims found. Upload claims to see them here.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Document</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Type</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Uploaded</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Extraction</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Cost</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documents.map((doc) => (
                            <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900 font-medium">{doc.name}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  {doc.document_type ? doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1) : 'Claim'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-4">
                                {doc.extracted_data || doc.has_extracted_data ? (
                                  <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Extracted
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {doc.total_cost ? `$${doc.total_cost.toFixed(4)}` : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewDocument(doc.id, 'document')}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                    title="View Document"
                                  >
                                    <FileText className="w-3 h-3" />
                                    View Document
                                  </button>
                                  {(doc.extracted_data || doc.has_extracted_data) && (
                                    <button
                                      onClick={() => handleViewDocument(doc.id, 'extractions')}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                      title="View Extractions"
                                    >
                                      <FileText className="w-3 h-3" />
                                      View Extractions
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id, doc.name)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                    title="Delete Document"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : corpusView === 'sops' ? (
                  playbooks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No SOPs found. Upload SOPs to see them here.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">SOP Name</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Rules Count</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Uploaded</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Cost</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playbooks.map((playbook) => (
                            <tr key={playbook.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900 font-medium">{playbook.name}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {playbook.rules_count || (playbook.extracted_rules ? (Array.isArray(playbook.extracted_rules) ? playbook.extracted_rules.length : Object.keys(playbook.extracted_rules || {}).length) : 0)}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {playbook.uploaded_at ? new Date(playbook.uploaded_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  playbook.status === 'active' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {playbook.status || 'active'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {playbook.total_cost ? `$${playbook.total_cost.toFixed(4)}` : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewPlaybook(playbook.id, 'document')}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                    title="View Document"
                                  >
                                    <FileText className="w-3 h-3" />
                                    View Document
                                  </button>
                                  {playbook.extracted_rules && (
                                    <button
                                      onClick={() => handleViewPlaybook(playbook.id, 'extractions')}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                      title="View Extractions"
                                    >
                                      <FileText className="w-3 h-3" />
                                      View Extractions
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeletePlaybook(playbook.id, playbook.name)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                    title="Delete SOP"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : corpusView === 'checkposts' ? (
                  teamCheckpostFiles.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No checkpost files found. Upload checkposts to see them here.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Checkpost File</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Checkposts Count</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Uploaded</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Extraction</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Linked SOP</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Cost</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teamCheckpostFiles.map((file) => (
                            <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900 font-medium">{file.name}</td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {file.checkposts_count || 0}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {file.created_at ? new Date(file.created_at).toLocaleDateString() : '-'}
                              </td>
                              <td className="py-3 px-4">
                                {file.checkposts_data && file.checkposts_data.length > 0 ? (
                                  <span className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Extracted
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {file.linked_playbook ? (
                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                    {file.linked_playbook}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400">Not linked</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-900">
                                {file.total_cost ? `$${file.total_cost.toFixed(4)}` : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewTeamCheckpostFile(file.id, 'document')}
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                    title="View Document"
                                  >
                                    <FileText className="w-3 h-3" />
                                    View Document
                                  </button>
                                  {file.checkposts_data && file.checkposts_data.length > 0 && (
                                    <button
                                      onClick={() => handleViewTeamCheckpostFile(file.id, 'extractions')}
                                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                      title="View Extractions"
                                    >
                                      <FileText className="w-3 h-3" />
                                      View Extractions
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteTeamCheckpostFile(file.id, file.name)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                    title="Delete Checkpost File"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : policyDeclarations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No policy declarations found. Upload policy declarations to see them here.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Document</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Uploaded</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Extraction</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Declarations</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Cost</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policyDeclarations.map((pd) => (
                          <tr key={pd.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">{pd.name}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                                Policy Declaration
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {pd.uploaded_at ? new Date(pd.uploaded_at).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4">
                              {pd.extracted_declarations || pd.has_extracted_declarations ? (
                                <span className="flex items-center gap-1 text-sm text-green-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Extracted
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-sm text-yellow-600">
                                  <AlertTriangle className="w-4 h-4" />
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {pd.declarations_count || 0}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {pd.total_cost ? `$${pd.total_cost.toFixed(4)}` : '-'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewPolicyDeclaration(pd.id, 'document')}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                  title="View Document"
                                >
                                  <FileText className="w-3 h-3" />
                                  View Document
                                </button>
                                {(pd.extracted_declarations || pd.has_extracted_declarations) && (
                                  <button
                                    onClick={() => handleViewPolicyDeclaration(pd.id, 'extractions')}
                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                    title="View Extractions"
                                  >
                                    <FileText className="w-3 h-3" />
                                    View Extractions
                                  </button>
                                )}
                                  <button
                                    onClick={() => handleDeletePolicyDeclaration(pd.id, pd.name)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1"
                                    title="Delete Policy"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    Delete
                                  </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* View Document Side Pane */}
        {selectedDocument && viewMode === 'document' && (
          <DocumentViewer
            document={selectedDocument}
            onClose={closeViewer}
          />
        )}

        {/* View Policy Declaration Document */}
        {selectedPolicyDeclaration && viewMode === 'document' && (
          <DocumentViewer
            document={{
              id: selectedPolicyDeclaration.id,
              name: selectedPolicyDeclaration.name,
              document_type: 'policy_declaration',
              file_path: selectedPolicyDeclaration.file_path
            }}
            onClose={closeViewer}
          />
        )}

        {/* View Playbook Document */}
        {selectedDocument && viewMode === 'document' && selectedDocument.document_type === 'playbook' && (
          <DocumentViewer
            document={selectedDocument}
            onClose={closeViewer}
          />
        )}

        {/* View Playbook Extractions */}
        {selectedDocument && viewMode === 'extractions' && selectedDocument.document_type === 'playbook' && (
          <ViewExtractions
            document={selectedDocument}
            onClose={closeViewer}
          />
        )}

        {/* View Extractions Modal */}
        {selectedDocument && viewMode === 'extractions' && (
          <ViewExtractions
            document={selectedDocument}
            onClose={closeViewer}
          />
        )}

        {/* View Policy Declaration Extractions */}
        {selectedPolicyDeclaration && viewMode === 'extractions' && (
          <ViewExtractions
            document={{
              id: selectedPolicyDeclaration.id,
              name: selectedPolicyDeclaration.name,
              document_type: 'policy_declaration',
              uploaded_at: selectedPolicyDeclaration.uploaded_at,
              extracted_data: selectedPolicyDeclaration.extracted_declarations,
              ai_model_used: selectedPolicyDeclaration.ai_model_used,
              input_tokens: selectedPolicyDeclaration.input_tokens,
              output_tokens: selectedPolicyDeclaration.output_tokens,
              total_cost: selectedPolicyDeclaration.total_cost,
              processing_time: selectedPolicyDeclaration.processing_time,
              has_extracted_data: selectedPolicyDeclaration.extracted_declarations !== null
            }}
            onClose={closeViewer}
          />
        )}

        {/* View Team Checkpost File Document */}
        {selectedTeamCheckpostFile && viewMode === 'document' && (
          <DocumentViewer
            document={selectedTeamCheckpostFile}
            onClose={closeViewer}
          />
        )}

        {/* View Team Checkpost File Extractions */}
        {selectedTeamCheckpostFile && viewMode === 'extractions' && (
          <ViewExtractions
            document={selectedTeamCheckpostFile}
            onClose={closeViewer}
          />
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            <RulesEngineDashboard />
          </div>
        )}

{/*// 2. Then replace the entire Portfolio section with this:
*/}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Existing StatCards 
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard label="Total Policies" value="1,000" icon={FileText} trend="+5.2%" color="blue" />
              <StatCard label="Compliant" value="850" icon={CheckCircle2} trend="+2.1%" color="green" />
              <StatCard label="Under Review" value="120" icon={Clock} color="yellow" />
              <StatCard label="Exceptions" value="30" icon={AlertTriangle} trend="-3%" color="red" />
            </div>
*/}
            {/* 🆕 NEW DASHBOARD 1: Processing Velocity */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-blue-600" />
                  Processing Velocity & Throughput
                </h2>
                <p className="text-sm text-gray-600">
                  Real-time audit processing metrics demonstrating 100% coverage at unprecedented speed
                </p>
              </div>
              <ProcessingVelocityDashboard />
            </div>

            {/* 🆕 NEW DASHBOARD 2: Live Audit Monitor */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 border-2 border-slate-300 shadow-lg">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-3">
                  <Activity className="w-8 h-8 text-orange-600" />
                  Live Audit Command Center
                </h2>
                <p className="text-sm text-gray-600">
                  Real-time surveillance of ongoing audits across all auto claims
                </p>
              </div>
              <LiveAuditMonitor />
            </div>

            {/* EXISTING: Compliance Status and Risk Distribution (unchanged) 
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Risk Distribution</h3>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {riskData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
             */}
          </div>
        )}
        
        {activeTab === 'audit-process' && (
          <AuditResults />
        )}

        {activeTab === 'audit-concepts' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Audit Results Concepts (Demo)</h2>
                  <p className="text-sm text-gray-600">Preview four concept mocks to gather feedback.</p>
                </div>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {[
                  { label: 'concept1_validation_story', file: 'concept1_validation_story.html' },
                  { label: 'concept2_evidence_map', file: 'concept2_evidence_map.html' },
                  { label: 'concept3_audit_trail', file: 'concept3_audit_trail.html' },
                  { label: 'concept4_executive_dashboard', file: 'concept4_executive_dashboard.html' },
                ].map((c) => (
                  <button
                    key={c.file}
                    onClick={() => setSelectedConcept(c.file)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                      selectedConcept === c.file
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="p-4">
                <div className="w-full h-[70vh] border border-gray-200 rounded-lg overflow-hidden">
                  <iframe
                    key={selectedConcept}
                    src={`http://localhost:5002/validation-concepts/${selectedConcept}`}
                    title="Audit Concept"
                    className="w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'claims' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Claim Drilldown</h2>
                <p className="text-sm text-gray-600 mt-1">Detailed analysis of individual claims</p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Claim</label>
                  <select
                    value={selectedClaim}
                    onChange={(e) => setSelectedClaim(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {MOCK_CLAIMS.map(claim => (
                      <option key={claim.id} value={claim.id}>
                        {claim.id} - {claim.claimant} ({claim.type})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedClaim && (() => {
                  const claim = MOCK_CLAIMS.find(c => c.id === selectedClaim)!;
                  return (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Claimant</p>
                          <p className="font-semibold text-gray-900 mt-1">{claim.claimant}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Policy ID</p>
                          <p className="font-semibold text-gray-900 mt-1">{claim.policyId}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-semibold text-gray-900 mt-1">${claim.amount.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-semibold text-gray-900 mt-1">{claim.status}</p>
                        </div>
                      </div>

                      <Card>
                        <CardHeader>
                          <h3 className="text-lg font-semibold text-gray-900">Triggered Rules ({claim.triggered})</h3>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedClaim === 'C1234' && (
                              <>
                                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-red-900">Proof of Age Missing</p>
                                    <p className="text-sm text-red-700 mt-1">Required document not found in system</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-yellow-900">Premium Validation Alert</p>
                                    <p className="text-sm text-yellow-700 mt-1">Premium vs coverage ratio requires review</p>
                                  </div>
                                </div>
                              </>
                            )}
                            {selectedClaim === 'C1377' && (
                              <>
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-yellow-900">Payment Near Limit</p>
                                    <p className="text-sm text-yellow-700 mt-1">Payment amount is 95% of policy limit</p>
                                  </div>
                                </div>
                              </>
                            )}
                            {selectedClaim === 'C1411' && (
                              <>
                                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-red-900">Airline PIR Missing</p>
                                    <p className="text-sm text-red-700 mt-1">Required travel delay documentation not provided</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-semibold text-yellow-900">Delay Exclusion Check</p>
                                    <p className="text-sm text-yellow-700 mt-1">7-hour delay may trigger policy exclusions</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {claim.missing > 0 && (
                        <Card>
                          <CardHeader>
                            <h3 className="text-lg font-semibold text-gray-900">Missing Documents ({claim.missing})</h3>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {selectedClaim === 'C1234' && (
                                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <p className="font-medium text-gray-900">ProofOfAge.pdf</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setRequestClaimId(claim.id);
                                      setRequestDocName('ProofOfAge.pdf');
                                      setShowRequestModal(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                  >
                                    Request Document
                                  </button>
                                </div>
                              )}
                              {selectedClaim === 'C1411' && (
                                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <p className="font-medium text-gray-900">AirlinePIR.pdf</p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setRequestClaimId(claim.id);
                                      setRequestDocName('AirlinePIR.pdf');
                                      setShowRequestModal(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                  >
                                    Request Document
                                  </button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">Link Graphs: Document Corpus Visualization</h2>
                    <p className="text-sm text-gray-600 mt-1">Visualize the complex interconnected network of rules across Policies, SOPs, and Checkposts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setGraphView('basic')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          graphView === 'basic'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Basic View
                      </button>
                      <button
                        onClick={() => setGraphView('enhanced')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          graphView === 'enhanced'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Enhanced View
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full" style={{ height: 'calc(100vh - 300px)', minHeight: '800px' }}>
                  {graphView === 'basic' ? (
                    <iframe
                      src="http://localhost:5002/templates/graphs_tab_mockup.html"
                      className="w-full h-full border-0"
                      title="Basic Link Graphs Visualization"
                      style={{ minHeight: '800px' }}
                    />
                  ) : (
                    <iframe
                      src="http://localhost:5002/templates/graphs_tab_mockup_enhanced.html"
                      className="w-full h-full border-0"
                      title="Enhanced Link Graphs Visualization"
                      style={{ minHeight: '800px' }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}


        {activeTab === 'single-audit' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">⚡ Single File Audit</h2>
                  <p className="text-sm text-gray-600 mt-1">Fast validation of one claim against one SOP - See every step</p>
                </div>
              </CardHeader>
              <CardContent>
                <SingleFileAudit />
              </CardContent>
            </Card>
          </div>
        )}


        {activeTab === 'single-audit-results' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">📊 Single File Audit Results</h2>
                  <p className="text-sm text-gray-600 mt-1">View past validations and evidence graphs</p>
                </div>
              </CardHeader>
              <CardContent>
                <SingleFileAuditResults />
              </CardContent>
            </Card>
          </div>
        )}


        {activeTab === 'cost-analytics' && (
          <div className="p-6">
            <CostAnalytics />
          </div>
        )}

        {activeTab === 'market-conduct' && (
          <div className="p-6">
            <MarketConductTab />
          </div>
        )}

        {activeTab === 'batch-audits' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">📊 Batch Claims Audit</h2>
                    <p className="text-sm text-gray-600 mt-1">Process multiple claims (up to 25) against SOPs - Bulk workflow</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!auditStarted) {
                        setAuditStarted(true);
                      } else {
                        setAuditStarted(false);
                        setSelectedClaims([]);
                        setSelectedSOPs([]);
                        setAuditId('');
                        setError('');
                        setExtracting(false);
                        setExtractionProgress(0);
                        setRulesCount(0);
                        setClaimsExtracted(0);
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {auditStarted ? 'Reset' : 'Start New Audit'}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {!auditStarted ? (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Click "Start New Audit" to begin</p>
                    <p className="text-sm text-gray-500">Select claims and SOPs from your uploaded files</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                      </div>
                    )}

                    {!auditId && !extracting && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Step 1: Select Files
                        </h3>
                        
                        {loadingFiles ? (
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                            <p className="text-gray-600 mt-2">Loading files...</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">
                                  Select Claims (max 25)
                                </h4>
                                <span className="text-sm text-gray-600">
                                  {selectedClaims.length} / 25 selected
                                </span>
                              </div>
                              
                              {availableClaims.length === 0 ? (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                                  No claims found in database
                                </div>
                              ) : (
                                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                  {availableClaims.map((claim) => (
                                    <label
                                      key={claim.id}
                                      className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedClaims.includes(claim.id)}
                                        onChange={() => toggleClaimSelection(claim.id)}
                                        className="w-4 h-4 text-blue-600 rounded mr-3"
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{claim.name || claim.id}</div>
                                        <div className="text-xs text-gray-500">
                                          {(claim.uploaded_at ? new Date(claim.uploaded_at).toLocaleDateString() : '') ||
                                            claim.document_type ||
                                            ''}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">
                                  Select SOPs (max 2)
                                </h4>
                                <span className="text-sm text-gray-600">
                                  {selectedSOPs.length} / 2 selected
                                </span>
                              </div>
                              
                              {/* FEATURE: JSON SOP Support
                                  - Backend now accepts .json files (pre-extracted SOPs)
                                  - JSON files skip AI extraction for faster batch audits
                                  - Workflow: Single Audit (≤3 claims) → Auto-saves JSON → Batch Audit (select JSON)
                                  - JSON files are saved to both SingleAuditOutput/ and sops/ directories
                                  - File format: {SOPfilename}-audextract.json
                              */}
                              
                              {availableSOPs.length === 0 ? (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                                  No SOPs found in database
                                </div>
                              ) : (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                  {availableSOPs.map((sop) => (
                                    <label
                                      key={sop.id}
                                      className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedSOPs.includes(sop.id)}
                                        onChange={() => toggleSOPSelection(sop.id)}
                                        className="w-4 h-4 text-blue-600 rounded mr-3"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <div className="font-medium text-gray-900">{sop.name || sop.id}</div>
                                          {sop.name && sop.name.endsWith('.json') && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                              ⚡ Pre-extracted
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {sop.uploaded_at ? new Date(sop.uploaded_at).toLocaleDateString() : ''}
                                        </div>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              Select Checkpost File (optional)
                            </h4>
                            <span className="text-sm text-gray-600">
                              {selectedCheckpostFile ? '1 selected' : 'None selected'}
                            </span>
                          </div>
                          
                          {teamCheckpostFiles.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                              No checkpost files found in uploads/checkposts/ directory
                            </div>
                          ) : (
                            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                              {teamCheckpostFiles.map((file) => (
                                <label
                                  key={file.id}
                                  className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    checked={selectedCheckpostFile === file.id}
                                    onChange={() => toggleCheckpostSelection(file.id)}
                                    className="w-4 h-4 text-blue-600 rounded mr-3"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{file.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {file.created_at ? new Date(file.created_at).toLocaleDateString() : ''}
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {file.total_cost ? `$${file.total_cost.toFixed(4)}` : ''}
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                            {selectedClaims.length > 0 && selectedSOPs.length > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-semibold text-blue-900">Ready to Audit</h4>
                                    <p className="text-sm text-blue-700">
                                  {selectedClaims.length} claims • {selectedSOPs.length} SOPs selected
                                  {selectedCheckpostFile ? ' • 1 checkpost file' : ''}
                                    </p>
                                  </div>
                                  {/* WORKFLOW: Removed "Audit Check" button from batch audit
                                      Users should test with Single Audit tab first, then run batch.
                                      This simplifies the batch audit workflow to one clear action. */}
                                  <button
                                    onClick={handleStartAudit}
                                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                                  >
                                    Begin Full Audit →
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {extracting && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Step 2: Data Gathering
                        </h3>
                        
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>{currentTask}</span>
                              <span>{extractionProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${extractionProgress}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="text-2xl font-bold text-green-700">{rulesCount}</div>
                              <div className="text-sm text-green-600">Rules Extracted</div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="text-2xl font-bold text-blue-700">{claimsExtracted}</div>
                              <div className="text-sm text-blue-600">Claims Processed</div>
                            </div>
                          </div>
                          
                          <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                            <p className="text-gray-600 mt-3">Extracting data with AI...</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* DAY 4 UPDATE: Extraction Complete + Validation Button */}
                    {auditId && !extracting && rulesCount > 0 && !validating && !validationComplete && (
                      <div>
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                          <p className="font-semibold">✅ Extraction Complete!</p>
                          <p className="text-sm mt-1">
                            Audit ID: {auditId} | {rulesCount} rules | {claimsExtracted} claims extracted
                          </p>
                        </div>

                        {/* MANUAL SAVE RULES: Show button for single audits (1 claim + 1 SOP) */}
                        {claimsExtracted === 1 && selectedSOPs.length === 1 && !selectedSopIsJson && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-2">
                              💾 Save Extracted Rules
                            </h3>
                            <p className="text-sm text-blue-700 mb-4">
                              Single audit detected! Save these extracted rules as JSON for faster batch audits.
                              Saves to: <span className="font-mono">uploads/sops/</span>
                            </p>
                            
                            {!rulesSaved ? (
                              <button
                                onClick={handleSaveRules}
                                disabled={savingRules}
                                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {savingRules ? '💾 Saving Rules...' : '💾 Save Rules to JSON'}
                              </button>
                            ) : (
                              <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
                                <p className="font-semibold">✅ Rules Saved Successfully!</p>
                                <p className="text-sm mt-1">
                                  Saved: {savedFiles.join(', ')}
                                </p>
                                <p className="text-xs mt-2 text-green-700">
                                  📁 Location: uploads/sops/ - You can now select this JSON file in batch audits!
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Ready to Validate Claims
                          </h3>
                          <p className="text-gray-600 mb-4">
                            All claims and rules have been extracted. Click below to validate all {claimsExtracted} claims against {rulesCount} rules.
                          </p>
                          <button
                            onClick={handleStartValidation}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                          >
                            ⚡ Validate All Claims
                          </button>
                        </div>
                      </div>
                    )}

                    {/* DAY 4 UPDATE: Validation Progress */}
                    {validating && (
                      <div>
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6">
                          <p className="font-semibold">⚡ Validating Claims...</p>
                          <p className="text-sm mt-1">
                            Running compliance checks on {claimsExtracted} claims
                          </p>
                        </div>

                        <div className="text-center py-12">
                          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
                          <p className="text-gray-600">Validating claims against policy rules...</p>
                          <p className="text-sm text-gray-500 mt-2">This usually takes 5-10 seconds</p>
                        </div>
                      </div>
                    )}

                    {/* DAY 4 UPDATE: Validation Results Dashboard */}
                    {validationComplete && validationSummary && (
                      <div>
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6 mb-6">
                          <h3 className="text-2xl font-bold mb-2">✅ Validation Complete</h3>
                          <p className="text-blue-100">
                            Audit ID: {auditId} | {validationSummary.total_claims} claims validated
                          </p>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                              {validationSummary.total_claims}
                            </div>
                            <div className="text-sm text-gray-600">Total Claims</div>
                          </div>
                          
                          <div className="bg-white rounded-lg border border-green-200 p-4">
                            <div className="text-3xl font-bold text-green-600 mb-1">
                              {validationSummary.valid_claims}
                            </div>
                            <div className="text-sm text-gray-600">Valid Claims</div>
                          </div>
                          
                          <div className="bg-white rounded-lg border border-red-200 p-4">
                            <div className="text-3xl font-bold text-red-600 mb-1">
                              {validationSummary.invalid_claims}
                            </div>
                            <div className="text-sm text-gray-600">Invalid Claims</div>
                          </div>
                          
                          <div className="bg-white rounded-lg border border-blue-200 p-4">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                              {validationSummary.avg_compliance_score}%
                            </div>
                            <div className="text-sm text-gray-600">Avg Compliance</div>
                          </div>
                        </div>

                        {/* Results Table */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h4 className="text-lg font-semibold text-gray-900">Claim-by-Claim Results</h4>
                            <p className="text-sm text-gray-600 mt-1">Click any claim ID to see detailed breakdown</p>
                          </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                    Claim ID
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                                    File
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                                    Score
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                                    Status
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">
                                    Rules Passed
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {validationResults.map((result, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                      <button
                                        onClick={() => {
                                          // DAY 5: Open drill-down modal on same page
                                          console.log('Clicked claim data:', result);
                                          console.log('Has rule_checks?', result.rule_checks);
                                          setDrillDownClaim(result);
                                          setShowDrillDown(true);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                      >
                                        {result.claim_id}
                                      </button>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                      {result.file}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-block px-3 py-1 rounded font-semibold text-sm ${
                                        result.is_valid
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-red-100 text-red-700'
                                      }`}>
                                        {result.compliance_score}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                                        result.is_valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                        {result.is_valid ? '✓ Valid' : '✗ Invalid'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                                      {result.rules_passed} / {result.rules_total}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-6">
                          <button
                            onClick={() => setShowFinalSummary(true)}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium text-lg shadow-lg"
                          >
                            Next: View Audit Summary & Recommendations →
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* FINAL SUMMARY PAGE */}
                    {showFinalSummary && (
                      <div>
                        {/* Back Button */}
                        <button
                          onClick={() => setShowFinalSummary(false)}
                          className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
                        >
                          ← Back to Results
                        </button>

                        {/* Step 5 Header */}
                        <div className="bg-gradient-to-r from-green-600 to-green-800 text-white rounded-lg p-6 mb-6">
                          <h3 className="text-2xl font-bold mb-2">Step 5 – Feedback & Remediation Actions</h3>
                          <p className="text-green-100">
                            Audit findings are shared with underwriters. Action plans are created for training, process refinement, and guideline updates.
                          </p>
                        </div>

                        {/* Audit Summary Dashboard */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                          <h4 className="text-xl font-semibold text-gray-900 mb-6">Audit Summary Dashboard</h4>
                          
                          <div className="grid grid-cols-2 gap-8">
                            {/* Compliance Rate - Pie Chart */}
                            <div>
                              <h5 className="text-lg font-semibold text-gray-900 mb-4">Compliance Rate</h5>
                              <div className="flex items-center justify-center">
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Compliant', value: 82, fill: '#10b981' },
                                        { name: 'Non-Compliant', value: 18, fill: '#ef4444' }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={90}
                                      dataKey="value"
                                      label={(entry) => `${entry.name}: ${entry.value}%`}
                                    >
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Average Scores by Line - Bar Chart */}
                            <div>
                              <h5 className="text-lg font-semibold text-gray-900 mb-4">Average Scores by Line</h5>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-700">Auto</span>
                                    <span className="font-bold text-gray-900">88%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '88%' }}></div>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-700">Home</span>
                                    <span className="font-bold text-gray-900">83%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className="bg-orange-500 h-3 rounded-full" style={{ width: '83%' }}></div>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-700">Travel</span>
                                    <span className="font-bold text-gray-900">79%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className="bg-red-500 h-3 rounded-full" style={{ width: '79%' }}></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Key Recommendations */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <h4 className="text-xl font-semibold text-gray-900 mb-4">Key Recommendations</h4>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                                ✓
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800 font-medium">Implement additional training for Travel policy underwriting</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                                ✓
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800 font-medium">Update documentation checklist for proof-of-age requirements</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                                ✓
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800 font-medium">Review premium calculation guidelines for Auto policies</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold mt-0.5">
                                ✓
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-800 font-medium">Standardize payment limit validation across all lines</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Complete Button */}
                        <div className="mt-6 flex gap-4">
                          <button
                            onClick={() => {
                              // Reset everything
                              setShowFinalSummary(false);
                              setValidationComplete(false);
                              setValidationResults([]);
                              setValidationSummary(null);
                              setAuditStarted(false);
                              setSelectedClaims([]);
                              setSelectedSOPs([]);
                              setAuditId('');
                            }}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 font-medium text-lg shadow-lg"
                          >
                            ✓ Complete Audit & Start New
                          </button>
                        </div>
                      </div>
                    )}
                    {/* END FINAL SUMMARY */}
                    {/* END DAY 4 UPDATE */}
                  </div>
                )}
              </CardContent>
            </Card>

            {showAuditCheck && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">🔍 Audit Check</h3>
                        <p className="text-sm text-gray-600 mt-1">Test validation with 1 claim and 1 SOP</p>
                      </div>
                      <button 
                        onClick={closeAuditCheck}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    {!auditCheckResult ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Claim to Test
                          </label>
                          <select
                            value={auditCheckClaim}
                            onChange={(e) => setAuditCheckClaim(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                          >
                            <option value="">Choose a claim...</option>
                            {selectedClaims.map(claimId => (
                              <option key={claimId} value={claimId}>{claimId}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select SOP to Test
                          </label>
                          <select
                            value={auditCheckSOP}
                            onChange={(e) => setAuditCheckSOP(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                          >
                            <option value="">Choose a SOP...</option>
                            {selectedSOPs.map(sopId => (
                              <option key={sopId} value={sopId}>{sopId}</option>
                            ))}
                          </select>
                        </div>

                        <button
                          onClick={handleRunAuditCheck}
                          disabled={!auditCheckClaim || !auditCheckSOP || auditCheckLoading}
                          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {auditCheckLoading ? 'Running Test...' : 'Run Audit Check'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className={`border-2 rounded-lg p-6 ${
                          auditCheckResult.is_valid ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                        }`}>
                          <div className="text-center mb-4">
                            <div className="text-4xl mb-2">{auditCheckResult.is_valid ? '✅' : '❌'}</div>
                            <div className="text-2xl font-bold">
                              {auditCheckResult.compliance_score}% Compliant
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Claim: {auditCheckResult.claim_id}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-xl font-bold text-green-600">
                                {auditCheckResult.rules_passed}
                              </div>
                              <div className="text-xs text-gray-600">Passed</div>
                            </div>
                            <div>
                              <div className="text-xl font-bold text-red-600">
                                {auditCheckResult.rules_total - auditCheckResult.rules_passed}
                              </div>
                              <div className="text-xs text-gray-600">Failed</div>
                            </div>
                            <div>
                              <div className="text-xl font-bold text-yellow-600">
                                {auditCheckResult.warnings_count}
                              </div>
                              <div className="text-xs text-gray-600">Warnings</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={closeAuditCheck}
                            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Close
                          </button>
                          <button
                            onClick={handleStartAudit}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Proceed with Full Audit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Default fallback view - shows greyed card for active selection */}
        {!['connect', 'testd', 'corpus', 'single-audit', 'single-audit-results', 'batch-audits', 'rules', 'graph', 'claims', 'cost-analytics', 'portfolio', 'market-conduct', 'audit-process', 'audit-concepts'].includes(activeTab) && (
          <div className="max-w-4xl mx-auto">
            <div className="card overflow-hidden">
              {/* Greyed header showing active selection */}
              <div className="bg-neutral-100 border-b border-neutral-200 px-6 py-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-neutral-200 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-neutral-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-neutral-700">
                      {pageInfo.title}
                    </h2>
                    <p className="text-sm text-neutral-500 mt-1">
                      {pageInfo.subtitle}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Content area */}
              <div className="p-8 text-center">
                <div className="max-w-md mx-auto">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
                    <Activity className="w-8 h-8 text-neutral-400 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">
                    Working on {pageInfo.title}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-6">
                    This feature is currently being developed. Check back soon for updates.
                  </p>
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-left">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-neutral-900 mb-1">In Development</p>
                        <p className="text-xs text-neutral-600">
                          Features and functionality will be added to this section in an upcoming release.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Request Document Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Request Document</h3>
              <p className="text-sm text-gray-600 mt-1">Send document request to claims supervisor</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Claim ID</label>
                <input
                  type="text"
                  value={requestClaimId}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
                <input
                  type="text"
                  value={requestDocName}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Claims Supervisor</option>
                  <option>Underwriting Manager</option>
                  <option>Document Control</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={3}
                  defaultValue="Please upload the requested document to complete audit requirements."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  alert('Document request sent successfully!');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAY 5: Drill-Down Modal - Shows detailed rule checks for selected claim */}
      {showDrillDown && drillDownClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Claim Details: {drillDownClaim.claim_id || 'Unknown'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    File: {drillDownClaim.file || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDrillDown(false);
                    setDrillDownClaim(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* Summary Section */}
              <div className={`rounded-lg p-6 mb-6 ${
                drillDownClaim.is_valid 
                  ? 'bg-green-50 border-2 border-green-300' 
                  : 'bg-red-50 border-2 border-red-300'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-4xl font-bold mb-1">
                      {drillDownClaim.compliance_score || 0}%
                    </div>
                    <div className="text-lg font-semibold">
                      Compliance Score
                    </div>
                  </div>
                  <div className={`text-6xl ${
                    drillDownClaim.is_valid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {drillDownClaim.is_valid ? '✅' : '❌'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {drillDownClaim.rules_passed || 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Rules Passed</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600">
                      {(drillDownClaim.rules_total || 0) - (drillDownClaim.rules_passed || 0)}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Rules Failed</div>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-gray-700">
                      {drillDownClaim.rules_total || 0}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">Total Rules</div>
                  </div>
                </div>

                <div className={`mt-4 text-center font-semibold text-lg ${
                  drillDownClaim.is_valid ? 'text-green-700' : 'text-red-700'
                }`}>
                  {drillDownClaim.is_valid ? '✓ VALID CLAIM' : '✗ INVALID CLAIM'}
                </div>
              </div>

              {/* Rule Checks Section - Using Narrative Component */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Rule-by-Rule Breakdown
                </h3>

                {drillDownClaim.rule_checks && Array.isArray(drillDownClaim.rule_checks) && drillDownClaim.rule_checks.length > 0 ? (
                  <NarrativeValidationResults results={drillDownClaim} compact={true} />
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                    <p className="text-blue-900 font-semibold mb-2">📋 Rule Details Not Available</p>
                    <p className="text-sm text-blue-700">
                      The detailed rule breakdown is not available for this claim.
                      {drillDownClaim.rules_total && (
                        <> However, you can see that {drillDownClaim.rules_passed} out of {drillDownClaim.rules_total} rules passed.</>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Errors and Warnings Section */}
              {(drillDownClaim.errors?.length > 0 || drillDownClaim.warnings?.length > 0) && (
                <div className="mt-6 space-y-4">
                  {drillDownClaim.errors && drillDownClaim.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <span className="text-xl">🚫</span>
                        Errors ({drillDownClaim.errors.length})
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {drillDownClaim.errors.map((error: any, idx: number) => (
                          <li key={idx} className="text-sm text-red-700">
                            {typeof error === 'string' ? error : `${error.check}: ${error.message}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {drillDownClaim.warnings && drillDownClaim.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        Warnings ({drillDownClaim.warnings.length})
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {drillDownClaim.warnings.map((warning: any, idx: number) => (
                          <li key={idx} className="text-sm text-yellow-700">
                            {typeof warning === 'string' ? warning : `${warning.check}: ${warning.message}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDrillDown(false);
                    setDrillDownClaim(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Future: Navigate to remediation
                    alert('Remediation feature coming in Day 6!');
                  }}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  🔧 Start Remediation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}