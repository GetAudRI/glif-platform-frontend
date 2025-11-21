import { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Database, Settings, BarChart3, FileSearch, Network, 
  CheckCircle2, AlertTriangle, XCircle, Download, Plus, Search,
  ChevronRight, Clock, TrendingUp, Shield, Users, Activity
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

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

export default function GLIFPrototype() {
  const [activeTab, setActiveTab] = useState('connect');
  const [connected, setConnected] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState('C1234');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestClaimId, setRequestClaimId] = useState('');
  const [requestDocName, setRequestDocName] = useState('');
  const [auditStarted, setAuditStarted] = useState(false);

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

  // Tab Navigation Component
  const TabButton = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
        activeTab === id
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                GLIF Audit Oversight
              </h1>
              <p className="text-sm text-gray-600 mt-1">Intelligent Insurance Audit Platform v2.1</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Settings
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                Help
              </button>
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8 flex flex-wrap gap-3">
          <TabButton id="connect" label="Connectors" icon={Database} />
          <TabButton id="corpus" label="Corpus" icon={FileText} />
          <TabButton id="rules" label="Rules Engine" icon={Settings} />
          <TabButton id="portfolio" label="Portfolio" icon={BarChart3} />
          <TabButton id="claims" label="Claim Drilldown" icon={FileSearch} />
          <TabButton id="graph" label="Link Graph" icon={Network} />
          <TabButton id="audits" label="Audits" icon={Shield} />
        </div>

        {/* Tab Content */}
        {activeTab === 'connect' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Storage Connectors</h2>
                <p className="text-sm text-gray-600 mt-1">Connect GLIF to your data sources</p>
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
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900">AWS S3 Connected</p>
                        <p className="text-sm text-green-700">Bucket: glif-insurance-data-prod</p>
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

        {activeTab === 'corpus' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Corpus Intelligence</h2>
                <p className="text-sm text-gray-600 mt-1">AI-classified documents and extracted metadata</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Document</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Type</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Metadata</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Confidence</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'PolicyDoc_12345.pdf', type: 'Policy', meta: 'PolicyID: P9876', conf: 98 },
                        { name: 'Claim_Application.docx', type: 'Claim', meta: 'ClaimID: C1234', conf: 95 },
                        { name: 'Invoice_Oct2025.xlsx', type: 'Invoice', meta: 'Amount: $4,500', conf: 99 },
                        { name: 'Coverage_Letter.pdf', type: 'Correspondence', meta: 'ClaimID: C1377', conf: 92 },
                      ].map((doc, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{doc.name}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              {doc.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{doc.meta}</td>
                          <td className="py-3 px-4 text-sm text-gray-900">{doc.conf}%</td>
                          <td className="py-3 px-4">
                            <span className="flex items-center gap-1 text-sm text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              Processed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Rules Engine</h2>
                    <p className="text-sm text-gray-600 mt-1">15 active audit rules across policy types</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" />
                    Add Rule
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: 'R1', name: 'Auto Premium vs Coverage Validation', type: 'Auto', severity: 'High' },
                    { id: 'R2', name: 'Missing Property Details Check', type: 'Home', severity: 'Medium' },
                    { id: 'R3', name: 'Travel Delay Exclusion Flag', type: 'Travel', severity: 'High' },
                    { id: 'R4', name: 'Proof of Age Requirement', type: 'Auto', severity: 'High' },
                    { id: 'R5', name: 'Payment Near Limit Alert', type: 'All', severity: 'Medium' },
                  ].map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg font-semibold text-gray-700">
                          {rule.id}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{rule.name}</p>
                          <p className="text-sm text-gray-500">Type: {rule.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          rule.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {rule.severity}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard label="Total Policies" value="1,000" icon={FileText} trend="+5.2%" color="blue" />
              <StatCard label="Compliant" value="850" icon={CheckCircle2} trend="+2.1%" color="green" />
              <StatCard label="Under Review" value="120" icon={Clock} color="yellow" />
              <StatCard label="Exceptions" value="30" icon={AlertTriangle} trend="-3%" color="red" />
            </div>

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

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">High-Risk Claims Queue</h3>
                <p className="text-sm text-gray-600 mt-1">Claims requiring immediate attention</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {MOCK_CLAIMS.filter(c => c.risk === 'high').map(claim => (
                    <div key={claim.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-semibold text-gray-900">{claim.id} - {claim.claimant}</p>
                          <p className="text-sm text-gray-600">{claim.type} • ${claim.amount.toLocaleString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedClaim(claim.id);
                          setActiveTab('claims');
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                    <h2 className="text-xl font-semibold text-gray-900">Link Graph: Comprehensive Claim Audit</h2>
                    <p className="text-sm text-gray-600 mt-1">Visual audit report showing rules, documentation, risk assessment, and AI insights</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search claim ID..."
                      value={selectedClaim}
                      onChange={(e) => setSelectedClaim(e.target.value.toUpperCase())}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                    />
                  </div>
                </div>
              </CardHeader>
            </Card>

            {(() => {
              const claim = MOCK_CLAIMS.find(c => c.id === selectedClaim);
              if (!claim) {
                return (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <FileSearch className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Claim {selectedClaim} not found</p>
                      <p className="text-sm text-gray-500 mt-1">Try: C1234, C1377, or C1411</p>
                    </CardContent>
                  </Card>
                );
              }

              // Define rules data per claim
              const rulesData: Record<string, Array<{ name: string; status: 'pass' | 'warning' | 'fail' }>> = {
                C1234: [
                  { name: 'R1: Proof of Age Required', status: 'fail' },
                  { name: 'R2: Premium vs Coverage Validation', status: 'warning' },
                  { name: 'R3: Coverage Type Verification', status: 'pass' },
                  { name: 'R4: Policy Period Validity', status: 'pass' },
                  { name: 'R5: Payment Authorization Check', status: 'pass' },
                ],
                C1377: [
                  { name: 'R6: Payment Limit Threshold', status: 'warning' },
                  { name: 'R7: Coverage Letter Required', status: 'pass' },
                  { name: 'R8: Property Details Complete', status: 'pass' },
                  { name: 'R9: Premium Calculation Check', status: 'pass' },
                ],
                C1411: [
                  { name: 'R10: Airline PIR Documentation', status: 'fail' },
                  { name: 'R11: Delay Hours Verification', status: 'warning' },
                  { name: 'R12: Travel Policy Exclusions', status: 'pass' },
                  { name: 'R13: Receipt Documentation', status: 'pass' },
                ],
              };

              const claimRules = rulesData[claim.id] || [];

              // Define risk data per claim
              const riskData: Record<string, { category: string; score: number; factors: string[]; color: string }> = {
                C1234: {
                  category: 'Medium Risk',
                  score: 65,
                  factors: [
                    'Age verification documentation gap',
                    'Premium-to-coverage ratio borderline',
                    'Policy coverage appropriate for applicant',
                  ],
                  color: 'yellow',
                },
                C1377: {
                  category: 'Low Risk',
                  score: 85,
                  factors: [
                    'Payment amount 95% of policy limit',
                    'All documentation complete',
                    'Coverage properly applied',
                  ],
                  color: 'green',
                },
                C1411: {
                  category: 'Medium Risk',
                  score: 70,
                  factors: [
                    'Missing airline PIR documentation',
                    'Delay hours within policy threshold',
                    'Receipt documentation incomplete',
                  ],
                  color: 'yellow',
                },
              };

              const claimRisk = riskData[claim.id];

              // Define documentation data
              const docsData: Record<string, Array<{ name: string; present: boolean }>> = {
                C1234: [
                  { name: 'PolicyDeclarations.pdf', present: true },
                  { name: 'PaymentVoucher.xlsx', present: true },
                  { name: 'ProofOfAge.pdf', present: false },
                ],
                C1377: [
                  { name: 'CoverageLetter.docx', present: true },
                  { name: 'PaymentVoucher.xlsx', present: true },
                ],
                C1411: [
                  { name: 'AirlinePIR.pdf', present: false },
                  { name: 'Receipts.zip', present: true },
                ],
              };

              const claimDocs = docsData[claim.id] || [];
              const docsPresent = claimDocs.filter(d => d.present).length;
              const docsTotal = claimDocs.length;

              // AI Notes per claim
              const aiNotes: Record<string, { strengths: string[]; improvements: string[]; actions: string[]; confidence: number }> = {
                C1234: {
                  strengths: [
                    'Premium calculation is accurate and well-documented',
                    'Policy coverage aligns with applicant\'s stated needs',
                    'Risk factors properly identified and noted in underwriting',
                  ],
                  improvements: [
                    'Missing proof of age documentation - required for under-25 drivers per underwriting guidelines section 3.2',
                    'Premium validation shows borderline ratio - recommend secondary review by senior underwriter',
                  ],
                  actions: [
                    'Request ProofOfAge.pdf from claims supervisor within 5 business days',
                    'Schedule follow-up review once documentation complete',
                    'Consider additional discount eligibility review upon completion',
                  ],
                  confidence: 92,
                },
                C1377: {
                  strengths: [
                    'Complete documentation package with all required forms',
                    'Risk assessment thoroughly documented and justified',
                    'Payment processing properly authorized and tracked',
                  ],
                  improvements: [
                    'Payment amount at 95% of policy limit - recommend review of limit adequacy',
                    'Consider proactive communication with policyholder about limit proximity',
                  ],
                  actions: [
                    'Flag account for limit review at next renewal',
                    'Send policyholder notification about remaining coverage amount',
                    'No immediate action required - file meets compliance standards',
                  ],
                  confidence: 96,
                },
                C1411: {
                  strengths: [
                    'Delay hours properly verified against airline records',
                    'Receipt documentation shows appropriate expense tracking',
                    'Policy exclusions correctly applied to claim evaluation',
                  ],
                  improvements: [
                    'Missing Airline PIR (Property Irregularity Report) - required for all baggage delay claims per policy section 8.4',
                    'Travel delay verification incomplete without official airline documentation',
                  ],
                  actions: [
                    'Request official Airline PIR from claimant within 7 business days',
                    'Verify delay hours against airline\'s public flight records',
                    'Hold payment pending receipt of required PIR documentation',
                  ],
                  confidence: 88,
                },
              };

              const claimNotes = aiNotes[claim.id];

              return (
                <>
                  {/* Main Content Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Network View */}
                      <Card>
                        <CardHeader>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Network className="w-5 h-5" />
                            Network View
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex flex-col items-center space-y-4">
                              {/* Claim Node */}
                              <div className="flex items-center justify-center w-32 h-12 bg-blue-600 text-white rounded-lg font-semibold shadow-md">
                                {claim.id}
                              </div>
                              
                              {/* Connection Lines */}
                              <div className="flex gap-8">
                                <div className="w-px h-12 bg-gray-300"></div>
                                <div className="w-px h-12 bg-gray-300"></div>
                                <div className="w-px h-12 bg-gray-300"></div>
                              </div>

                              {/* Child Nodes */}
                              <div className="flex gap-4">
                                <div className={`flex items-center justify-center w-24 h-10 rounded-lg font-medium text-sm shadow ${
                                  claim.policyId ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {claim.policyId}
                                </div>
                                <div className={`flex items-center justify-center w-24 h-10 rounded-lg font-medium text-sm shadow ${
                                  docsPresent === docsTotal ? 'bg-green-100 text-green-700' : 
                                  docsPresent > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  Docs {docsPresent}/{docsTotal}
                                </div>
                                <div className={`flex items-center justify-center w-24 h-10 rounded-lg font-medium text-sm shadow ${
                                  claimRisk.color === 'green' ? 'bg-green-100 text-green-700' :
                                  claimRisk.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  Metadata
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-4">
                              Color-coded by status: 
                              <span className="text-green-600 mx-1">●</span>Complete
                              <span className="text-yellow-600 mx-1">●</span>Warning
                              <span className="text-red-600 mx-1">●</span>Critical
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Risk Analysis */}
                      <Card>
                        <CardHeader>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Risk Analysis
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Risk Category:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                claimRisk.color === 'green' ? 'bg-green-100 text-green-700' :
                                claimRisk.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {claimRisk.category}
                              </span>
                            </div>
                            
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Risk Score:</span>
                                <span className="text-2xl font-bold text-gray-900">{claimRisk.score}/100</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full ${
                                    claimRisk.score >= 80 ? 'bg-green-600' :
                                    claimRisk.score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${claimRisk.score}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Key Factors:</p>
                              <ul className="space-y-2">
                                {claimRisk.factors.map((factor, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                    <span className="text-gray-400 mt-0.5">•</span>
                                    <span>{factor}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Rules Applied */}
                      <Card>
                        <CardHeader>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Rules Applied ({claimRules.length})
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {claimRules.map((rule, i) => (
                              <div 
                                key={i} 
                                className={`flex items-center gap-3 p-3 rounded-lg ${
                                  rule.status === 'pass' ? 'bg-green-50 border border-green-200' :
                                  rule.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                                  'bg-red-50 border border-red-200'
                                }`}
                              >
                                {rule.status === 'pass' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                ) : rule.status === 'warning' ? (
                                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                )}
                                <span className={`text-sm font-medium ${
                                  rule.status === 'pass' ? 'text-green-900' :
                                  rule.status === 'warning' ? 'text-yellow-900' : 'text-red-900'
                                }`}>
                                  {rule.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Documentation Completeness */}
                      <Card>
                        <CardHeader>
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Documentation Completeness
                          </h3>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {claimDocs.map((doc, i) => (
                              <div 
                                key={i}
                                className={`flex items-center justify-between p-3 rounded-lg ${
                                  doc.present ? 'bg-gray-50' : 'bg-red-50 border border-red-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {doc.present ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                  <span className={`text-sm ${doc.present ? 'text-gray-900' : 'text-red-900 font-medium'}`}>
                                    {doc.name}
                                  </span>
                                </div>
                                {!doc.present && (
                                  <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded">
                                    MISSING
                                  </span>
                                )}
                              </div>
                            ))}
                            
                            <div className="pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Status:</span>
                                <span className={`text-sm font-semibold ${
                                  docsPresent === docsTotal ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {docsPresent}/{docsTotal} Required Docs Present
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* AI Auditor Notes - Full Width */}
                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        AI Auditor Notes
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Strengths */}
                        <div>
                          <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Strengths:
                          </h4>
                          <ul className="space-y-1.5 ml-6">
                            {claimNotes.strengths.map((item, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Areas for Improvement */}
                        <div>
                          <h4 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Areas for Improvement:
                          </h4>
                          <ul className="space-y-1.5 ml-6">
                            {claimNotes.improvements.map((item, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-yellow-600 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Recommended Actions */}
                        <div>
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                            <ChevronRight className="w-4 h-4" />
                            Recommended Actions:
                          </h4>
                          <ul className="space-y-1.5 ml-6">
                            {claimNotes.actions.map((item, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Audit Confidence */}
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Audit Confidence:</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${claimNotes.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-lg font-bold text-blue-600">{claimNotes.confidence}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Underwriting Audits</h2>
                    <p className="text-sm text-gray-600 mt-1">5-step audit workflow with compliance tracking</p>
                  </div>
                  <button
                    onClick={() => setAuditStarted(!auditStarted)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {auditStarted ? 'Reset Audit' : 'Start Audit'}
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {!auditStarted ? (
                  <div className="text-center py-12">
                    <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Click "Start Audit" to begin the 5-step underwriting audit process</p>
                    <p className="text-sm text-gray-500">This will simulate planning, data gathering, review, reporting, and remediation steps</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Audit Steps */}
                    <div className="space-y-3">
                      {[
                        {
                          title: 'Step 1 – Planning & File Selection',
                          detail: 'Audit team defines scope and objectives (e.g., new business accounts last quarter, or specific line of business). Files are selected based on risk factors or stratified samples to ensure representative review.',
                        },
                        {
                          title: 'Step 2 – Data Gathering',
                          detail: 'Auditors gather all policy, application, rating, and correspondence documents across systems—this can be time-consuming in traditional setups.',
                        },
                        {
                          title: 'Step 3 – File Review & Evaluation',
                          detail: 'Each file is examined for documentation completeness, pricing adequacy, compliance with guidelines, and underwriting decision accuracy. Files are scored or rated for quality.',
                        },
                        {
                          title: 'Step 4 – Audit Findings & Reporting',
                          detail: 'Auditors consolidate results: % compliance, recurring issues, training gaps, and recommendations for improvement.',
                        },
                        {
                          title: 'Step 5 – Feedback & Remediation Actions',
                          detail: 'Audit findings are shared with underwriters. Action plans are created for training, process refinement, and guideline updates.',
                        },
                      ].map((step, i) => (
                        <details key={i} className="group bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50">
                            <span className="font-semibold text-gray-900">{step.title}</span>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                          </summary>
                          <div className="px-4 pb-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
                            {step.detail}
                          </div>
                        </details>
                      ))}
                    </div>

                    {/* Audit Dashboard */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Summary Dashboard</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <h4 className="font-semibold text-gray-900">Compliance Rate</h4>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={auditComplianceData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={60}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {auditComplianceData.map((entry, index) => (
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
                            <h4 className="font-semibold text-gray-900">Average Scores by Line</h4>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Auto</span>
                                <span className="text-sm font-bold text-gray-900">88%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '88%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Home</span>
                                <span className="text-sm font-bold text-gray-900">83%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '83%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Travel</span>
                                <span className="text-sm font-bold text-gray-900">79%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '79%' }}></div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    {/* Action Items */}
                    <Card>
                      <CardHeader>
                        <h4 className="font-semibold text-gray-900">Key Recommendations</h4>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {[
                            'Implement additional training for Travel policy underwriting',
                            'Update documentation checklist for proof-of-age requirements',
                            'Review premium calculation guidelines for Auto policies',
                            'Standardize payment limit validation across all lines',
                          ].map((rec, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-blue-900">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
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
    </div>
  );
}
