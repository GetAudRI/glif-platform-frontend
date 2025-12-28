import { useState } from 'react';
import SchemaBasedClaimsGenerator from './components/SchemaBasedClaimsGenerator';
import SOPBasedClaimsGenerator from './components/SOPBasedClaimsGenerator';
import SchemaPairGenerator from './components/SchemaPairGenerator';

export default function TestD() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-2">🧪 TestD - Demo Data Generation</h1>
        <p className="text-purple-100">
          Create perfect demo data with matching schemas for SOPs and Claims
        </p>
      </div>

      {/* Section 1: Schema Pair Generator */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">📋 Schema Pair Generator</h2>
          <p className="text-sm text-gray-600 mt-1">
            Analyze your SOP and generate matching SOP + Claim schemas
          </p>
        </div>
        <div className="p-6">
          <SchemaPairGenerator />
        </div>
      </div>

      {/* Section 2: Schema-Based Claims Generator */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">🎲 Schema-Based Claims Generator</h2>
              <p className="text-sm text-gray-600 mt-1">
                Generate claims from JSON schema - Perfect for demos!
              </p>
            </div>
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
              BEST
            </span>
          </div>
        </div>
        <div className="p-6">
          <SchemaBasedClaimsGenerator />
        </div>
      </div>

      {/* Section 3: Claims Generator (SOP-based) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">📄 Claims Generator (SOP-based)</h2>
              <p className="text-sm text-gray-600 mt-1">
                Generate test claims from SOP rules (Legacy Method)
              </p>
            </div>
            <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
              LEGACY
            </span>
          </div>
        </div>
        <div className="p-6">
          <SOPBasedClaimsGenerator />
        </div>
      </div>
    </div>
  );
}

