/**
 * Portfolio Dashboard
 * Overview of all vendors and audit metrics
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';

const PortfolioDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-cyan-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Portfolio Dashboard</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          View vendor risk heatmap, audit schedule, and compliance metrics across your vendor portfolio.
          Dashboard UI to be implemented.
        </p>
      </div>
    </div>
  );
};

export default PortfolioDashboard;
