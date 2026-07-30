/**
 * Vendor Management Page
 * List, create, and manage vendor profiles
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, Building2, MapPin, Calendar } from 'lucide-react';
import { listVendors, type Vendor } from '../../services/vendorAuditApi';

const VendorManagementPage: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRiskTier, setFilterRiskTier] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const result = await listVendors();
      setVendors(result.vendors);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = !filterRiskTier || v.risk_tier === filterRiskTier;
    return matchesSearch && matchesRisk;
  });

  const getRiskTierColor = (tier: string) => {
    switch (tier) {
      case 'Critical': return 'sev-critical';
      case 'High': return 'sev-major';
      case 'Moderate': return 'sev-minor';
      case 'Low': return 'sev-observation';
      default: return 'status-na';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="overline mb-2">Vendor Registry</div>
          <h2 className="heading text-2xl text-gray-900">Vendor Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your vendor profiles and audit schedules
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="field-input pl-10"
          />
        </div>
        <div>
          <select
            value={filterRiskTier}
            onChange={(e) => setFilterRiskTier(e.target.value)}
            className="field-input"
          >
            <option value="">All Risk Tiers</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Vendor List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rust"></div>
          <p className="mt-2 text-gray-600">Loading vendors...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="border border-dashed border-hair bg-white p-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="heading mt-4 text-lg text-gray-900">No vendors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterRiskTier ? 'Try adjusting your filters' : 'Get started by adding your first vendor'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-hair bg-white">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="border-r border-b border-hair p-5 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="heading text-lg text-gray-900 truncate">
                    {vendor.vendor_name}
                  </h3>
                  <p className="text-sm text-gray-600">{vendor.vendor_type.replace('_', ' ')}</p>
                </div>
                <span className={`pill ${getRiskTierColor(vendor.risk_tier)}`}>
                  {vendor.risk_tier}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                {vendor.location && (
                  <div className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-neutral-400" strokeWidth={1.75} />
                    {vendor.location}
                  </div>
                )}
                {vendor.next_audit_due && (
                  <div className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" strokeWidth={1.75} />
                    Next Audit: {new Date(vendor.next_audit_due).toLocaleDateString()}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`status-badge ${vendor.status === 'active' ? 'status-pass' : 'status-na'}`}>
                    {vendor.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-hair rounded-sm p-6 max-w-md w-full">
            <div className="overline mb-2">Vendor Registry</div>
            <h3 className="heading text-lg mb-4">Add New Vendor</h3>
            <p className="text-gray-600 mb-4">Create vendor form UI to be implemented</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorManagementPage;
