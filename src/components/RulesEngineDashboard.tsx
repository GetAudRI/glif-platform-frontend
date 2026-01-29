import { useState, useEffect } from 'react';
import { getRulesEngineDashboard, linkCheckpost, getPlaybook, getTeamCheckpostFile, deletePlaybook, deleteTeamCheckpostFile, getPolicyDeclaration, deletePolicyDeclaration } from '../services/api';
import { BookOpen, FileText, Link2, Plus, X, AlertCircle, ListChecks, CheckSquare, Trash2, Shield } from 'lucide-react';

interface PolicyDeclaration {
  id: number;
  name: string;
  created_at: string | null;
  declarations_count: number;
  file_type: string;
}

interface SOP {
  id: number;
  name: string;
  created_at: string | null;
  rules_count: number;
  checkposts_count: number;
  team_checkpost_file: {
    id: number;
    name: string;
    checkposts_count: number;
  } | null;
}

interface TeamCheckpost {
  id: number;
  name: string;
  count: number;
  updated_at: string | null;
  linked_playbook: string | null;
}

export default function RulesEngineDashboard() {
  const [policyDeclarations, setPolicyDeclarations] = useState<PolicyDeclaration[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [teamCheckposts, setTeamCheckposts] = useState<TeamCheckpost[]>([]);
  const [activeTab, setActiveTab] = useState<'policy_declarations' | 'sops' | 'checkposts'>('policy_declarations');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [checkpostsModalOpen, setCheckpostsModalOpen] = useState(false);
  const [declarationsModalOpen, setDeclarationsModalOpen] = useState(false);
  const [selectedSop, setSelectedSop] = useState<{ id: number; name: string } | null>(null);
  const [selectedCheckpost, setSelectedCheckpost] = useState<number | ''>('');
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesData, setRulesData] = useState<any>(null);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [checkpostsLoading, setCheckpostsLoading] = useState(false);
  const [checkpostsData, setCheckpostsData] = useState<any>(null);
  const [checkpostsError, setCheckpostsError] = useState<string | null>(null);
  const [declarationsLoading, setDeclarationsLoading] = useState(false);
  const [declarationsData, setDeclarationsData] = useState<any>(null);
  const [declarationsError, setDeclarationsError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'playbook' | 'checkpost' | 'policy_declaration'; id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading Rules Engine Dashboard...');
      const data = await getRulesEngineDashboard();
      console.log('Dashboard data received:', data);
      setPolicyDeclarations(data.policy_declarations || []);
      setSops(data.sops || []);
      setTeamCheckposts(data.team_checkposts || []);
      console.log('Dashboard loaded successfully:', {
        policyDeclarations: data.policy_declarations?.length || 0,
        sops: data.sops?.length || 0,
        teamCheckposts: data.team_checkposts?.length || 0
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(errorMessage);
      console.error('Error loading dashboard:', err);
      console.error('Error details:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkCheckpost = async () => {
    if (!selectedSop || !selectedCheckpost || selectedCheckpost === '') {
      alert('Please select a checkpost file');
      return;
    }

    try {
      await linkCheckpost(selectedSop.id, Number(selectedCheckpost));
      alert('Successfully linked checkpost file!');
      setLinkModalOpen(false);
      setSelectedSop(null);
      setSelectedCheckpost('');
      // Reload dashboard to show updated links
      loadDashboard();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Failed to link checkpost'));
      console.error('Error linking checkpost:', err);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleViewRules = async (sop: SOP) => {
    setRulesModalOpen(true);
    setRulesLoading(true);
    setRulesError(null);
    setRulesData(null);

    try {
      const playbook = await getPlaybook(sop.id);
      setRulesData({
        name: playbook.name,
        rules: playbook.extracted_rules
      });
    } catch (err) {
      setRulesError(err instanceof Error ? err.message : 'Failed to load rules');
      console.error('Error loading rules:', err);
    } finally {
      setRulesLoading(false);
    }
  };

  // Format rules for display - handles nested structures
  const formatRulesForDisplay = (rules: any): Array<{ text: string; category?: string; severity?: string }> => {
    const formattedRules: Array<{ text: string; category?: string; severity?: string }> = [];

    if (!rules) return formattedRules;

    const processRules = (data: any, category?: string, depth = 0) => {
      if (depth > 10) return; // Prevent infinite recursion

      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (typeof item === 'string') {
            formattedRules.push({ text: item, category });
          } else if (item && typeof item === 'object') {
            const ruleText = item.rule_text || item.text || item.description || JSON.stringify(item);
            const severity = item.severity || item.level;
            formattedRules.push({ text: ruleText, category, severity });
          }
        });
      } else if (data && typeof data === 'object') {
        // Skip metadata keys
        if (data.definitions || data.extraction_metadata) {
          return;
        }

        // If it has a 'rules' key, process that
        if (data.rules && Array.isArray(data.rules)) {
          processRules(data.rules, category, depth + 1);
        } else {
          // Process object keys as categories
          Object.keys(data).forEach((key) => {
            const value = data[key];
            const newCategory = category ? `${category} > ${key}` : key;
            
            if (Array.isArray(value)) {
              processRules(value, newCategory, depth + 1);
            } else if (value && typeof value === 'object') {
              processRules(value, newCategory, depth + 1);
            } else if (typeof value === 'string' && value.trim()) {
              formattedRules.push({ text: value, category: newCategory });
            }
          });
        }
      }
    };

    processRules(rules);
    return formattedRules;
  };

  const handleViewCheckposts = async (teamCheckpost: TeamCheckpost) => {
    setCheckpostsModalOpen(true);
    setCheckpostsLoading(true);
    setCheckpostsError(null);
    setCheckpostsData(null);

    try {
      const file = await getTeamCheckpostFile(teamCheckpost.id);
      setCheckpostsData({
        name: file.name,
        checkposts: file.checkposts_data || []
      });
    } catch (err) {
      setCheckpostsError(err instanceof Error ? err.message : 'Failed to load checkposts');
      console.error('Error loading checkposts:', err);
    } finally {
      setCheckpostsLoading(false);
    }
  };

  const handleViewDeclarations = async (policyDeclaration: PolicyDeclaration) => {
    setDeclarationsModalOpen(true);
    setDeclarationsLoading(true);
    setDeclarationsError(null);
    setDeclarationsData(null);

    try {
      const response = await getPolicyDeclaration(policyDeclaration.id);
      setDeclarationsData({
        name: response.policy_declaration.name,
        declarations: response.policy_declaration.extracted_declarations || []
      });
    } catch (err) {
      setDeclarationsError(err instanceof Error ? err.message : 'Failed to load declarations');
      console.error('Error loading declarations:', err);
    } finally {
      setDeclarationsLoading(false);
    }
  };

  const handleDeleteClick = (type: 'playbook' | 'checkpost' | 'policy_declaration', id: number, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      if (itemToDelete.type === 'playbook') {
        await deletePlaybook(itemToDelete.id);
      } else if (itemToDelete.type === 'checkpost') {
        await deleteTeamCheckpostFile(itemToDelete.id);
      } else if (itemToDelete.type === 'policy_declaration') {
        await deletePolicyDeclaration(itemToDelete.id);
      }
      
      // Close modal and reload dashboard
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      await loadDashboard();
      
      const typeName = itemToDelete.type === 'playbook' ? 'playbook' : itemToDelete.type === 'checkpost' ? 'team checkpost file' : 'policy declaration';
      alert(`Successfully deleted ${typeName}!`);
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Failed to delete'));
      console.error('Error deleting:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">Error Loading Dashboard</h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          <button
            onClick={loadDashboard}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Check if all data is empty
  const isEmpty = policyDeclarations.length === 0 && sops.length === 0 && teamCheckposts.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rules Engine Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your Standard Operating Procedures (SOPs), Team Checkposts, and Policy Declarations
          </p>
          {!loading && isEmpty && (
            <div className="mt-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 inline-block">
              ℹ️ No data found. Upload documents in the Corpus tab to get started.
            </div>
          )}
        </div>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('sops')}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${
              activeTab === 'sops'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4 inline-block mr-2" />
            SOPs / Playbooks ({sops.length})
          </button>
          <button
            onClick={() => setActiveTab('checkposts')}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${
              activeTab === 'checkposts'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Team Checkposts ({teamCheckposts.length})
          </button>
          <button
            onClick={() => setActiveTab('policy_declarations')}
            className={`px-6 py-3 font-semibold text-sm transition-colors ${
              activeTab === 'policy_declarations'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4 inline-block mr-2" />
            Policy Declarations ({policyDeclarations.length})
          </button>
        </div>

        {/* Policy Declarations Tab Content */}
        {activeTab === 'policy_declarations' && (
          <div className="p-6">
            {policyDeclarations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Policy Declaration Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Uploaded Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Declarations</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">File Type</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policyDeclarations.map((pd) => (
                      <tr key={pd.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900">{pd.name}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(pd.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewDeclarations(pd)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer"
                            title="View all declarations"
                          >
                            <ListChecks className="w-3 h-3" />
                            {pd.declarations_count} Declarations
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600 uppercase">{pd.file_type}</span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDeleteClick('policy_declaration', pd.id, pd.name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                            title="Delete policy declaration"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Policy Declarations</h3>
                <p className="text-sm text-gray-600 mb-4">Upload a Policy Declaration document to start extracting declarations.</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Upload Policy Declaration
                </button>
              </div>
            )}
          </div>
        )}

        {/* SOPs Tab Content */}
        {activeTab === 'sops' && (
          <div className="p-6">
            {sops.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SOP Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Uploaded Date</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Rules</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Linked Checkposts</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sops.map((sop) => (
                      <tr key={sop.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900">{sop.name}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(sop.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewRules(sop)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                            title="View all rules"
                          >
                            <ListChecks className="w-3 h-3" />
                            {sop.rules_count} Rules
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          {sop.team_checkpost_file ? (
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {sop.team_checkpost_file.name}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedSop({ id: sop.id, name: sop.name });
                                setLinkModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                              <Link2 className="w-4 h-4" />
                              Connect
                            </button>
                            <button
                              onClick={() => handleDeleteClick('playbook', sop.id, sop.name)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                              title="Delete playbook"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No SOPs Uploaded</h3>
                <p className="text-sm text-gray-600 mb-4">Upload an SOP document to start extracting rules.</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Upload SOP
                </button>
              </div>
            )}
          </div>
        )}

        {/* Team Checkposts Tab Content */}
        {activeTab === 'checkposts' && (
          <div className="p-6">
            {teamCheckposts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">File Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Updated</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Items</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Linked To</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamCheckposts.map((file, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-gray-900">{file.name}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(file.updated_at)}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewCheckposts(file)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors cursor-pointer"
                            title="View all checkposts"
                          >
                            <CheckSquare className="w-3 h-3" />
                            {file.count} Items
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          {file.linked_playbook ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              <BookOpen className="w-3 h-3" />
                              {file.linked_playbook}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Unlinked</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleDeleteClick('checkpost', file.id, file.name)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                            title="Delete team checkpost file"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Checkposts</h3>
                <p className="text-sm text-gray-600 mb-4">Upload a team checkpost document to add best practices.</p>
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />
                  Upload Checkposts
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link Modal */}
      {linkModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setLinkModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Connect Team Checkpost</h3>
              <button
                onClick={() => setLinkModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select a Team Checkpost file to link to <strong>{selectedSop?.name}</strong>.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Checkpost File
              </label>
              <select
                value={selectedCheckpost}
                onChange={(e) => setSelectedCheckpost(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select File --</option>
                {teamCheckposts.map((file, idx) => (
                  <option key={idx} value={file.id}>
                    {file.name} ({file.count} items)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleLinkCheckpost}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {rulesModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setRulesModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Rules for {rulesData?.name || 'SOP'}
              </h3>
              <button
                onClick={() => setRulesModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
              {rulesLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading rules...</p>
                  </div>
                </div>
              ) : rulesError ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600">{rulesError}</p>
                </div>
              ) : rulesData && rulesData.rules ? (
                <div className="p-4">
                  {(() => {
                    const formattedRules = formatRulesForDisplay(rulesData.rules);
                    return formattedRules.length > 0 ? (
                      <div className="space-y-3">
                        {formattedRules.map((rule, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-semibold">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                {rule.category && (
                                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase">
                                    {rule.category}
                                  </div>
                                )}
                                <div className="text-sm text-gray-900">{rule.text}</div>
                                {rule.severity && (
                                  <div className="mt-2">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        rule.severity === 'critical'
                                          ? 'bg-red-100 text-red-800'
                                          : rule.severity === 'high'
                                          ? 'bg-orange-100 text-orange-800'
                                          : rule.severity === 'medium'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {rule.severity}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-12 text-gray-500">
                        <ListChecks className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No rules found in this SOP</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center p-12 text-gray-500">
                  <ListChecks className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No rules data available</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setRulesModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkposts Modal */}
      {checkpostsModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setCheckpostsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Checkposts for {checkpostsData?.name || 'Team Checkpost File'}
              </h3>
              <button
                onClick={() => setCheckpostsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
              {checkpostsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading checkposts...</p>
                  </div>
                </div>
              ) : checkpostsError ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600">{checkpostsError}</p>
                </div>
              ) : checkpostsData && checkpostsData.checkposts ? (
                <div className="p-4">
                  {checkpostsData.checkposts.length > 0 ? (
                    <div className="space-y-3">
                      {checkpostsData.checkposts.map((checkpost: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-4 border rounded-lg transition-colors ${
                            checkpost.blocking
                              ? 'bg-red-50 border-red-200 hover:bg-red-100'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-semibold">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 mb-2">
                                {checkpost.text || checkpost.description || JSON.stringify(checkpost)}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {checkpost.blocking && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                    Blocking
                                  </span>
                                )}
                                {checkpost.evidence_required && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Evidence: {checkpost.evidence_required}
                                  </span>
                                )}
                                {checkpost.source_section && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {checkpost.source_section}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-12 text-gray-500">
                      <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No checkposts found in this file</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-12 text-gray-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No checkposts data available</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setCheckpostsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declarations Modal */}
      {declarationsModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setDeclarationsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Declarations for {declarationsData?.name || 'Policy Declaration'}
              </h3>
              <button
                onClick={() => setDeclarationsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
              {declarationsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading declarations...</p>
                  </div>
                </div>
              ) : declarationsError ? (
                <div className="p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600">{declarationsError}</p>
                </div>
              ) : declarationsData && declarationsData.declarations ? (
                <div className="p-4">
                  {(() => {
                    const formattedDeclarations = formatRulesForDisplay(declarationsData.declarations);
                    return formattedDeclarations.length > 0 ? (
                      <div className="space-y-3">
                        {formattedDeclarations.map((declaration, idx) => (
                          <div
                            key={idx}
                            className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-semibold">
                                {idx + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                {declaration.category && (
                                  <div className="text-xs font-semibold text-gray-500 mb-1 uppercase">
                                    {declaration.category}
                                  </div>
                                )}
                                <div className="text-sm text-gray-900">{declaration.text}</div>
                                {declaration.severity && (
                                  <div className="mt-2">
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        declaration.severity === 'critical'
                                          ? 'bg-red-100 text-red-800'
                                          : declaration.severity === 'high'
                                          ? 'bg-orange-100 text-orange-800'
                                          : declaration.severity === 'medium'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {declaration.severity}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-12 text-gray-500">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No declarations found in this Policy Declaration</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center p-12 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No declarations data available</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDeclarationsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && itemToDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={handleCancelDelete}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              <button
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-gray-600"
                disabled={deleting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Are you sure you want to delete this {itemToDelete.type === 'playbook' ? 'playbook' : itemToDelete.type === 'checkpost' ? 'team checkpost file' : 'policy declaration'}?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-semibold text-red-900">{itemToDelete.name}</p>
              </div>
              <p className="text-xs text-red-600 mt-2">
                This action cannot be undone. All related data will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

