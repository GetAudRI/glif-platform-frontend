/**
 * CAPA Management
 * Track corrective and preventive actions
 */

import React from 'react';
import { ClipboardCheck } from 'lucide-react';

const CAPAManagement: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <ClipboardCheck className="mx-auto h-12 w-12 text-cyan-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">CAPA Management</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Track all Corrective and Preventive Actions (CAPAs) from vendor audits.
          View open items, due dates, and completion status. CAPA tracking UI to be implemented.
        </p>
      </div>
    </div>
  );
};

export default CAPAManagement;
