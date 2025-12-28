import { useState, useEffect } from 'react';
import { getRecentValidations } from './services/api';
import { BarChart3, Calendar, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Download } from 'lucide-react';
import EvidenceGraphSankey from './components/EvidenceGraphSankey';

interface Validation {
  id: number;
  validated_at: string;
  document_id: number;
  document_name: string;
  playbook_id: number;
  playbook_name: string;
  policy_declaration_id: number | null;
  policy_declaration_name: string | null;
  team_checkpost_file_id: number | null;
  compliance_score: number;
  is_compliant: boolean;
  status: string;
  pass_count: number;
  warning_count: number;
  fail_count: number;
  total_cost: number;
  confidence_score: number;
}

export default function SingleFileAuditResults() {
  const [validations, setValidations] = useState<Validation[]>([]);
  const [selectedValidationId, setSelectedValidationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadValidations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getRecentValidations(50);
      
      if (data.success && data.validations) {
        setValidations(data.validations);
        
        // Check if there's a validation ID from SingleFileAudit (via localStorage)
        const savedValidationId = localStorage.getItem('glif_selected_validation_id');
        if (savedValidationId) {
          const validationId = parseInt(savedValidationId, 10);
          // Check if this validation exists in the list
          const exists = data.validations.some((v: Validation) => v.id === validationId);
          if (exists) {
            setSelectedValidationId(validationId);
            console.log('✅ Auto-selected validation ID from SingleFileAudit:', validationId);
          }
          // Clear it so it doesn't persist
          localStorage.removeItem('glif_selected_validation_id');
        } else if (data.validations.length > 0 && !selectedValidationId) {
          // Auto-select most recent validation if no saved ID
          setSelectedValidationId(data.validations[0].id);
        }
      } else {
        setError(data.error || 'Failed to load validations');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading validations');
      console.error('Error loading validations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadValidations();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadValidations();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading validations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <XCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Error Loading Validations</h3>
        </div>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (validations.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
        <BarChart3 className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-amber-900 mb-2">No Validations Found</h3>
        <p className="text-sm text-amber-700 mb-4">
          Run a Single File Audit to see validation results and evidence graphs here.
        </p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>
    );
  }

  const selectedValidation = validations.find(v => v.id === selectedValidationId);

  return (
    <div className="space-y-6">
      {/* Validation Selector */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-700">
            Select Validation to View:
          </label>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        <select
          value={selectedValidationId || ''}
          onChange={(e) => setSelectedValidationId(Number(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {validations.map(v => {
            const date = new Date(v.validated_at);
            const timeAgo = getTimeAgo(date);
            return (
              <option key={v.id} value={v.id}>
                {v.document_name} vs {v.playbook_name} • {timeAgo} • Score: {v.compliance_score}% • {v.pass_count} PASS, {v.warning_count} WARN, {v.fail_count} FAIL
              </option>
            );
          })}
        </select>
        
        <div className="mt-2 text-xs text-gray-500">
          Showing {validations.length} recent validation{validations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Validation Metadata */}
      {selectedValidation && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Validation Details</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="w-4 h-4" />
              {new Date(selectedValidation.validated_at).toLocaleString()}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
              <div className="text-xs text-indigo-600 font-semibold mb-1">Compliance Score</div>
              <div className="text-3xl font-bold text-indigo-900">{selectedValidation.compliance_score}%</div>
              <div className="text-xs text-indigo-700 mt-1">
                {selectedValidation.is_compliant ? '✓ Compliant' : '✗ Non-compliant'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-xs text-green-600 font-semibold mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Pass / Warning / Fail
              </div>
              <div className="text-xl font-bold text-green-900">
                <span className="text-green-600">{selectedValidation.pass_count}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-amber-600">{selectedValidation.warning_count}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-red-600">{selectedValidation.fail_count}</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Total: {selectedValidation.pass_count + selectedValidation.warning_count + selectedValidation.fail_count} checks
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="text-xs text-purple-600 font-semibold mb-1">Confidence</div>
              <div className="text-3xl font-bold text-purple-900">{selectedValidation.confidence_score}%</div>
              <div className="text-xs text-purple-700 mt-1">
                {selectedValidation.confidence_score >= 80 ? 'High' : selectedValidation.confidence_score >= 60 ? 'Medium' : 'Low'}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-xs text-blue-600 font-semibold mb-1">AI Cost</div>
              <div className="text-3xl font-bold text-blue-900">${selectedValidation.total_cost.toFixed(4)}</div>
              <div className="text-xs text-blue-700 mt-1">
                Validation #{selectedValidation.id}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Claim Document:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedValidation.document_name}</span>
              </div>
              <div>
                <span className="text-gray-500">SOP/Playbook:</span>
                <span className="ml-2 font-medium text-gray-900">{selectedValidation.playbook_name}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Graph - Now a proper React component! */}
      {selectedValidationId ? (
        <EvidenceGraphSankey validationId={selectedValidationId} />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Select a validation to view its evidence graph</p>
        </div>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return date.toLocaleDateString();
}

