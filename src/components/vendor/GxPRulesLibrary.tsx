/**
 * GxP Rules Library
 * Browse and search compliance rules
 */

import React from 'react';
import { BookOpen } from 'lucide-react';

const GxPRulesLibrary: React.FC = () => {
  return (
    <div className="p-6">
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-cyan-600" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">GxP Rules Library</h3>
        <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
          Browse 49 GxP compliance rules across 21 CFR Part 11, EU GMP Annex 11, ICH Q7, and ALCOA+ standards.
          Rules library UI to be implemented.
        </p>
      </div>
    </div>
  );
};

export default GxPRulesLibrary;
