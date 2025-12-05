import React from 'react';
import { X, FileText, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface Document {
  id: number;
  name: string;
  document_type: string;
  uploaded_at: string;
  extracted_data: any;
  ai_model_used?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_cost?: number;
  processing_time?: number;
  has_extracted_data?: boolean;
}

interface ViewExtractionsProps {
  document: Document | null;
  onClose: () => void;
}

export default function ViewExtractions({ document, onClose }: ViewExtractionsProps) {
  if (!document) return null;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatJSON = (data: any) => {
    if (!data) return 'No data available';
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{document.name}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)} Document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Uploaded At</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(document.uploaded_at)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  {document.has_extracted_data ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <span>Extraction Status</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {document.has_extracted_data ? 'Data Extracted' : 'No Data Extracted'}
                </p>
              </div>
            </div>

            {/* AI Processing Info */}
            {document.ai_model_used && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  AI Processing Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-blue-700 mb-1">Model</p>
                    <p className="text-sm font-medium text-blue-900">{document.ai_model_used}</p>
                  </div>
                  {document.input_tokens !== undefined && (
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Input Tokens</p>
                      <p className="text-sm font-medium text-blue-900">
                        {document.input_tokens.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {document.output_tokens !== undefined && (
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Output Tokens</p>
                      <p className="text-sm font-medium text-blue-900">
                        {document.output_tokens.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {document.total_cost !== undefined && (
                    <div>
                      <p className="text-xs text-blue-700 mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Total Cost
                      </p>
                      <p className="text-sm font-medium text-blue-900">
                        ${document.total_cost.toFixed(4)}
                      </p>
                    </div>
                  )}
                  {document.processing_time !== undefined && (
                    <div>
                      <p className="text-xs text-blue-700 mb-1">Processing Time</p>
                      <p className="text-sm font-medium text-blue-900">
                        {document.processing_time.toFixed(2)}s
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Extracted Data */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Extracted Data</h3>
              {document.extracted_data ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono">
                    {formatJSON(document.extracted_data)}
                  </pre>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    No extracted data available for this document. The document may not have been processed yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

