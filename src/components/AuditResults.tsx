import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Users,
  Send,
  Calendar,
  CheckSquare,
  AlertCircle,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import {
  listAuditResults,
  getAuditResult,
  updateAuditComments,
  addManagementResponse,
  scheduleClosingMeeting,
  distributeReport,
  updateFollowUpActions,
  generateMockAuditResults
} from '../services/api';

interface AuditResult {
  id: number;
  playbook_id: number;
  document_id: number;
  audit_type: string;
  created_at: string;
  validation_results: any;
  is_compliant: boolean;
  compliance_score: number;
  draft_report_comments: string | null;
  management_response: string | null;
  management_response_by: string | null;
  management_response_date: string | null;
  closing_meeting_scheduled: boolean;
  closing_meeting_date: string | null;
  closing_meeting_attendees: string[] | null;
  closing_meeting_notes: string | null;
  closing_meeting_completed: boolean;
  report_distributed: boolean;
  report_distribution_date: string | null;
  report_distribution_recipients: string[] | null;
  report_distribution_method: string | null;
  follow_up_actions: any[] | null;
  follow_up_status: string;
  status: string;
  playbook_name?: string;
  document_name?: string;
}

export default function AuditResults() {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Form states
  const [comments, setComments] = useState('');
  const [managementResponse, setManagementResponse] = useState('');
  const [managerName, setManagerName] = useState('Management');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingAttendees, setMeetingAttendees] = useState<string[]>([]);
  const [newAttendee, setNewAttendee] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [reportRecipients, setReportRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [distributionMethod, setDistributionMethod] = useState('email');
  const [followUpActions, setFollowUpActions] = useState<any[]>([]);
  const [newAction, setNewAction] = useState({ description: '', assigned_to: '', due_date: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Prevent duplicate calls when already loading
    if (!loading && !isRefreshing) {
      loadAuditResults();
    }
  }, [statusFilter]);

  useEffect(() => {
    if (selectedResult) {
      // Only load details if we don't have complete data (e.g., missing playbook_name or document_name)
      // Otherwise, just update form state from existing data
      if (!selectedResult.playbook_name || !selectedResult.document_name) {
        loadAuditResultDetails(selectedResult.id);
      }
      
      // Update form state from selected result
      setComments(selectedResult.draft_report_comments || '');
      setManagementResponse(selectedResult.management_response || '');
      setManagerName(selectedResult.management_response_by || 'Management');
      setMeetingDate(selectedResult.closing_meeting_date ? new Date(selectedResult.closing_meeting_date).toISOString().split('T')[0] : '');
      setMeetingAttendees(selectedResult.closing_meeting_attendees || []);
      setMeetingNotes(selectedResult.closing_meeting_notes || '');
      setReportRecipients(selectedResult.report_distribution_recipients || []);
      setDistributionMethod(selectedResult.report_distribution_method || 'email');
      setFollowUpActions(selectedResult.follow_up_actions || []);
    }
  }, [selectedResult?.id]); // Only depend on the ID, not the entire object

  const loadAuditResults = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const response = await listAuditResults(filters);
      setAuditResults(response.audit_results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit results');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMock = async () => {
    try {
      setLoading(true);
      const data = await generateMockAuditResults();
      alert(`Generated ${data.created_count} mock audit results`);
      loadAuditResults();
    } catch (err: any) {
      alert('Failed to generate mock data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditResultDetails = async (id: number) => {
    try {
      const response = await getAuditResult(id);
      if (response.audit_result) {
        // Only update if the ID matches (to prevent stale updates)
        setSelectedResult(prev => prev?.id === id ? response.audit_result : prev);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit result details');
    }
  };

  const handleSaveComments = async () => {
    if (!selectedResult) return;
    try {
      setIsRefreshing(true);
      await updateAuditComments(selectedResult.id, comments);
      alert('Comments saved successfully');
      // Only reload details for the selected item, not the entire list
      await loadAuditResultDetails(selectedResult.id);
    } catch (err: any) {
      alert('Failed to save comments: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddManagementResponse = async () => {
    if (!selectedResult) return;
    try {
      setIsRefreshing(true);
      await addManagementResponse(selectedResult.id, managementResponse, managerName);
      alert('Management response added');
      // Only reload details for the selected item, not the entire list
      await loadAuditResultDetails(selectedResult.id);
    } catch (err: any) {
      alert('Failed to add management response: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!selectedResult) return;
    try {
      setIsRefreshing(true);
      await scheduleClosingMeeting(
        selectedResult.id,
        meetingDate,
        meetingAttendees,
        meetingNotes,
        false
      );
      alert('Meeting scheduled');
      // Only reload details for the selected item, not the entire list
      await loadAuditResultDetails(selectedResult.id);
    } catch (err: any) {
      alert('Failed to schedule meeting: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCompleteMeeting = async () => {
    if (!selectedResult) return;
    try {
      setIsRefreshing(true);
      await scheduleClosingMeeting(
        selectedResult.id,
        meetingDate,
        meetingAttendees,
        meetingNotes,
        true
      );
      alert('Meeting marked as completed');
      // Only reload details for the selected item, not the entire list
      await loadAuditResultDetails(selectedResult.id);
    } catch (err: any) {
      alert('Failed to complete meeting: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDistributeReport = async () => {
    if (!selectedResult) return;
    try {
      setIsRefreshing(true);
      await distributeReport(selectedResult.id, reportRecipients, distributionMethod);
      alert('Report marked as distributed');
      // Only reload details for the selected item, not the entire list
      await loadAuditResultDetails(selectedResult.id);
    } catch (err: any) {
      alert('Failed to distribute report: ' + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddFollowUpAction = () => {
    if (!newAction.description) return;
    const action = {
      id: followUpActions.length + 1,
      description: newAction.description,
      assigned_to: newAction.assigned_to,
      due_date: newAction.due_date,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    setFollowUpActions([...followUpActions, action]);
    setNewAction({ description: '', assigned_to: '', due_date: '' });
  };

  const handleUpdateFollowUpActions = async () => {
    if (!selectedResult) return;
    try {
      await updateFollowUpActions(selectedResult.id, followUpActions);
      alert('Follow-up actions updated');
      loadAuditResults();
      loadAuditResultDetails(selectedResult.id);
    } catch (err: any) {
      alert('Failed to update follow-up actions: ' + err.message);
    }
  };

  const addAttendee = () => {
    if (newAttendee.trim()) {
      setMeetingAttendees([...meetingAttendees, newAttendee.trim()]);
      setNewAttendee('');
    }
  };

  const removeAttendee = (index: number) => {
    setMeetingAttendees(meetingAttendees.filter((_, i) => i !== index));
  };

  const addRecipient = () => {
    if (newRecipient.trim()) {
      setReportRecipients([...reportRecipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const removeRecipient = (index: number) => {
    setReportRecipients(reportRecipients.filter((_, i) => i !== index));
  };

  const updateActionStatus = (index: number, status: string) => {
    const updated = [...followUpActions];
    updated[index].status = status;
    if (status === 'completed') {
      updated[index].completed_date = new Date().toISOString();
    }
    setFollowUpActions(updated);
  };

  const filteredResults = auditResults.filter(result => {
    const searchLower = searchTerm.toLowerCase();
    const playbookName = result.playbook_name?.toLowerCase() || '';
    const documentName = result.document_name?.toLowerCase() || '';
    return playbookName.includes(searchLower) || documentName.includes(searchLower);
  });

  const getStatusBadge = (status: string) => {
    const colors: any = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      management_review: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-green-100 text-green-800',
      follow_up: 'bg-purple-100 text-purple-800'
    };
    return colors[status] || colors.draft;
  };

  if (loading && auditResults.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading audit results...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Audit Results</h2>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateMock}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Generate Data
          </button>
          <button
            onClick={loadAuditResults}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Results List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search audits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="management_review">Management Review</option>
                  <option value="closed">Closed</option>
                  <option value="follow_up">Follow-Up</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredResults.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No audit results found
                </div>
              ) : (
                filteredResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => setSelectedResult(result)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedResult?.id === result.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.is_compliant ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(result.status)}`}>
                          {result.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(result.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {result.document_name || 'Claim Document'}
                    </div>
                    <div className="text-xs text-gray-500">
                      SOP: {result.playbook_name || 'Standard Operating Procedure'}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Score: {result.compliance_score}%
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Selected Result Details */}
        <div className="lg:col-span-2">
          {selectedResult ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedResult.document_name || 'Claim Document'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      SOP: {selectedResult.playbook_name || 'Standard Operating Procedure'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {new Date(selectedResult.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedResult.is_compliant ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        Compliant
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        Non-Compliant
                      </span>
                    )}
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {selectedResult.compliance_score}% Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Draft Report - Comments */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Draft Report - Comments</h4>
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add your comments about the audit findings, non-compliance issues, and recommendations..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px]"
                />
                <button
                  onClick={handleSaveComments}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Comments
                </button>
              </div>

              {/* Management Response */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Management Response</h4>
                </div>
                {selectedResult.management_response ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>{selectedResult.management_response_by}</strong> -{' '}
                        {selectedResult.management_response_date
                          ? new Date(selectedResult.management_response_date).toLocaleString()
                          : ''}
                      </p>
                      <p className="text-gray-900">{selectedResult.management_response}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Manager Name"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      value={managementResponse}
                      onChange={(e) => setManagementResponse(e.target.value)}
                      placeholder="Enter management response..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                    />
                    <button
                      onClick={handleAddManagementResponse}
                      className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                      Add Management Response
                    </button>
                  </div>
                )}
              </div>

              {/* Closing Meeting */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Closing Meeting</h4>
                </div>
                {selectedResult.closing_meeting_completed ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        Meeting completed on{' '}
                        {selectedResult.closing_meeting_date
                          ? new Date(selectedResult.closing_meeting_date).toLocaleString()
                          : ''}
                      </p>
                      {selectedResult.closing_meeting_attendees && selectedResult.closing_meeting_attendees.length > 0 && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Attendees:</strong> {selectedResult.closing_meeting_attendees.join(', ')}
                        </p>
                      )}
                      {selectedResult.closing_meeting_notes && (
                        <p className="text-gray-900">{selectedResult.closing_meeting_notes}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Date</label>
                      <input
                        type="date"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Attendees</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add attendee name"
                          value={newAttendee}
                          onChange={(e) => setNewAttendee(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addAttendee()}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addAttendee}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {meetingAttendees.map((attendee, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                          >
                            {attendee}
                            <button
                              onClick={() => removeAttendee(index)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Notes</label>
                      <textarea
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                        placeholder="Add meeting notes..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleScheduleMeeting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Schedule Meeting
                      </button>
                      {selectedResult.closing_meeting_scheduled && (
                        <button
                          onClick={handleCompleteMeeting}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Report Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Send className="w-5 h-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Report Distribution</h4>
                </div>
                {selectedResult.report_distributed ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        Report distributed on{' '}
                        {selectedResult.report_distribution_date
                          ? new Date(selectedResult.report_distribution_date).toLocaleString()
                          : ''}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Method: {selectedResult.report_distribution_method}
                      </p>
                      {selectedResult.report_distribution_recipients && selectedResult.report_distribution_recipients.length > 0 && (
                        <p className="text-sm text-gray-600">
                          <strong>Recipients:</strong> {selectedResult.report_distribution_recipients.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Distribution Method</label>
                      <select
                        value={distributionMethod}
                        onChange={(e) => setDistributionMethod(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="email">Email</option>
                        <option value="portal">Portal</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Add recipient email/name"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={addRecipient}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reportRecipients.map((recipient, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                          >
                            {recipient}
                            <button
                              onClick={() => removeRecipient(index)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleDistributeReport}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark as Distributed
                    </button>
                  </div>
                )}
              </div>

              {/* Follow-Up Actions */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckSquare className="w-5 h-5 text-gray-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Follow-Up Actions</h4>
                </div>
                <div className="space-y-4">
                  {followUpActions.length > 0 && (
                    <div className="space-y-2">
                      {followUpActions.map((action, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <select
                            value={action.status}
                            onChange={(e) => updateActionStatus(index, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{action.description}</p>
                            <p className="text-xs text-gray-500">
                              Assigned to: {action.assigned_to} | Due: {action.due_date}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Add New Action</h5>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Action description"
                        value={newAction.description}
                        onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Assigned to"
                          value={newAction.assigned_to}
                          onChange={(e) => setNewAction({ ...newAction, assigned_to: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="date"
                          placeholder="Due date"
                          value={newAction.due_date}
                          onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddFollowUpAction}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Add Action
                        </button>
                        <button
                          onClick={handleUpdateFollowUpActions}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save All Actions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select an audit result to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

