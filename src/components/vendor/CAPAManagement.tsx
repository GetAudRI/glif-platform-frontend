/**
 * CAPA Management
 * Track corrective and preventive actions
 */

import React from 'react';
import { ClipboardCheck } from 'lucide-react';

const CAPAManagement: React.FC = () => {
  return (
    <div className="p-6">
      <div className="border border-dashed border-hair bg-white p-16 text-center">
        <ClipboardCheck className="mx-auto h-12 w-12 text-rust" strokeWidth={1.75} />
        <div className="overline mt-6 mb-3">Corrective Action</div>
        <h3 className="heading text-xl text-gray-900">CAPA Management</h3>
        <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          Track all Corrective and Preventive Actions (CAPAs) from vendor audits.
          View open items, due dates, and completion status. CAPA tracking UI to be implemented.
        </p>
      </div>
    </div>
  );
};

export default CAPAManagement;
