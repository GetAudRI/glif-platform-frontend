/**
 * GxP Rules Library
 * Browse and search compliance rules
 */

import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Filter, Shield, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { listRules, getRuleCategories, GxPRule } from '../../services/vendorAuditApi';

const GxPRulesLibrary: React.FC = () => {
  const [rules, setRules] = useState<GxPRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<GxPRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedVendorType, setSelectedVendorType] = useState<string>('all');
  const [selectedRule, setSelectedRule] = useState<GxPRule | null>(null);
  const [categories, setCategories] = useState<Record<string, any>>({});

  useEffect(() => {
    loadRules();
    loadCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rules, selectedCategory, selectedSeverity, selectedVendorType, searchTerm]);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await listRules();
      setRules(response.rules);
      setFilteredRules(response.rules);
    } catch (error) {
      console.error('Error loading rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getRuleCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...rules];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(rule => rule.category === selectedCategory);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(rule => rule.severity_if_missing === selectedSeverity);
    }

    // Vendor type filter
    if (selectedVendorType !== 'all') {
      filtered = filtered.filter(rule => 
        rule.applicable_vendor_types.includes(selectedVendorType)
      );
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.rule_name.toLowerCase().includes(term) ||
        rule.description?.toLowerCase().includes(term) ||
        rule.regulation_reference?.toLowerCase().includes(term)
      );
    }

    setFilteredRules(filtered);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'major':
        return <Shield className="h-4 w-4 text-orange-500" />;
      case 'minor':
        return <Info className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'sev-critical',
      major: 'sev-major',
      minor: 'sev-minor'
    };
    return colors[severity as keyof typeof colors] || 'status-na';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      '21_CFR_Part_11': '21 CFR Part 11',
      'EU_GMP_Annex_11': 'EU GMP Annex 11',
      'ICH_Q7': 'ICH Q7',
      'ALCOA_Plus': 'ALCOA+'
    };
    return labels[category] || category;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rust mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading GxP rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-6 w-6 text-rust" strokeWidth={1.75} />
          <div>
            <div className="overline mb-1">Rules Library</div>
            <h2 className="heading text-2xl text-gray-900">GxP Rules Library</h2>
          </div>
        </div>
        <p className="text-gray-600">
          Browse {rules.length} GxP compliance rules across 4 regulatory standards
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="field-input pl-10"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="field-input"
          >
            <option value="all">All Categories ({rules.length})</option>
            {Object.entries(categories).map(([key, data]: [string, any]) => (
              <option key={key} value={key}>
                {getCategoryLabel(key)} ({data.total})
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="field-input"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </select>

          {/* Vendor Type Filter */}
          <select
            value={selectedVendorType}
            onChange={(e) => setSelectedVendorType(e.target.value)}
            className="field-input"
          >
            <option value="all">All Vendor Types</option>
            <option value="Software_Vendor">Software Vendor</option>
            <option value="CMO">CMO</option>
            <option value="API_Supplier">API Supplier</option>
            <option value="Testing_Lab">Testing Lab</option>
            <option value="Equipment_Supplier">Equipment Supplier</option>
          </select>
        </div>

        {/* Active Filters Summary */}
        {(selectedCategory !== 'all' || selectedSeverity !== 'all' || selectedVendorType !== 'all' || searchTerm) && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Showing {filteredRules.length} of {rules.length} rules</span>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSeverity('all');
                setSelectedVendorType('all');
                setSearchTerm('');
              }}
              className="ml-2 text-rust hover:text-rust-deep font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Rules List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {filteredRules.length === 0 ? (
            <div className="border border-dashed border-hair bg-white p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="heading mt-4 text-lg text-gray-900">No rules found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => setSelectedRule(rule)}
                className={`bg-white rounded-sm border p-4 cursor-pointer transition-colors ${
                  selectedRule?.id === rule.id
                    ? 'border-rust bg-rust-tint'
                    : 'border-hair hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getSeverityIcon(rule.severity_if_missing)}
                      <h3 className="font-semibold text-gray-900">{rule.rule_name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{rule.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`pill ${getSeverityBadge(rule.severity_if_missing)}`}>
                        {rule.severity_if_missing}
                      </span>
                      <span className="pill border-hair text-neutral-700">
                        {getCategoryLabel(rule.category)}
                      </span>
                      {rule.auto_checkable && (
                        <span className="status-badge status-pass">
                          <CheckCircle className="h-3 w-3" />
                          Auto-check
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rule Details Panel */}
        <div className="lg:sticky lg:top-6">
          {selectedRule ? (
            <div className="card p-6">
              <div className="flex items-start gap-3 mb-4">
                {getSeverityIcon(selectedRule.severity_if_missing)}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedRule.rule_name}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`pill ${getSeverityBadge(selectedRule.severity_if_missing)}`}>
                      {selectedRule.severity_if_missing}
                    </span>
                    <span className="pill border-hair text-neutral-700">
                      {getCategoryLabel(selectedRule.category)}
                    </span>
                    {selectedRule.auto_checkable && (
                      <span className="status-badge status-pass">
                        <CheckCircle className="h-3 w-3" />
                        Auto-checkable
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="overline mb-1">Rule ID</h3>
                  <p className="text-sm text-gray-600 font-mono">{selectedRule.id}</p>
                </div>

                <div>
                  <h3 className="overline mb-1">Description</h3>
                  <p className="text-sm text-gray-600">{selectedRule.description}</p>
                </div>

                {selectedRule.regulation_reference && (
                  <div>
                    <h3 className="overline mb-1">Regulation Reference</h3>
                    <p className="text-sm text-gray-600 font-mono">{selectedRule.regulation_reference}</p>
                  </div>
                )}

                <div>
                  <h3 className="overline mb-1">Applicable Vendor Types</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedRule.applicable_vendor_types.map((type) => (
                      <span key={type} className="pill border-hair text-neutral-700">
                        {type.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedRule.validation_logic && (
                  <div>
                    <h3 className="overline mb-2">Validation Logic</h3>
                    <div className="bg-neutral-50 border border-hair rounded-sm p-3 text-xs">
                      <pre className="text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedRule.validation_logic, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-hair text-xs text-gray-500">
                  <span>Created: {new Date(selectedRule.created_at).toLocaleDateString()}</span>
                  <span className={`status-badge ${selectedRule.active ? 'status-pass' : 'status-na'}`}>
                    {selectedRule.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-sm border border-dashed border-hair p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="heading mt-4 text-lg text-gray-900">No rule selected</h3>
              <p className="mt-2 text-sm text-gray-500">
                Click on a rule to view its details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GxPRulesLibrary;
