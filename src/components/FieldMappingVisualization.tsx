import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FieldMappingVisualizationProps {
  fieldMappings: Record<string, string[]>;
  sopSchema?: any;
  claimSchema?: any;
}

export default function FieldMappingVisualization({
  fieldMappings,
  sopSchema,
  claimSchema
}: FieldMappingVisualizationProps) {
  // Get rule titles from SOP schema if available
  const getRuleTitle = (ruleId: string) => {
    if (!sopSchema?.extraction_rules) return ruleId;
    const rule = sopSchema.extraction_rules.find((r: any) => r.rule_id === ruleId);
    return rule ? rule.title || ruleId : ruleId;
  };

  return (
    <div className="space-y-3">
      {Object.entries(fieldMappings).map(([ruleId, fields]) => (
        <div key={ruleId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* SOP Rule */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono font-bold rounded">
                {ruleId}
              </span>
              <span className="text-sm text-gray-700 truncate">
                {getRuleTitle(ruleId)}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>

          {/* Claim Fields */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2">
              {fields.map((field) => (
                <span
                  key={field}
                  className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono rounded"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}

      {Object.keys(fieldMappings).length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No field mappings available
        </p>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 font-mono font-bold rounded">
              Rule
            </span>
            <span>SOP Rules to check</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span>validates</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 font-mono rounded">
              field
            </span>
            <span>Claim fields required</span>
          </div>
        </div>
      </div>
    </div>
  );
}

