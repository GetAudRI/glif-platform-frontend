import React from 'react';
import { X, FileText, Download, ExternalLink } from 'lucide-react';
import { API_BASE } from '../config';
import { getToken } from '../utils/auth';

interface Document {
  id: number;
  name: string;
  document_type: string;
  file_path: string;
}

interface DocumentViewerProps {
  document: Document | null;
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  if (!document) return null;

    // Determine the correct file endpoint based on document type
  let fileUrl: string;
  if (document.document_type === 'playbook') {
    fileUrl = `${API_BASE}/api/audit-oversight/playbooks/${document.id}/file`;
  } else if (document.document_type === 'policy_declaration') {
    fileUrl = `${API_BASE}/api/audit-oversight/policy-declarations/${document.id}/file`;
  } else if (document.document_type === 'team_checkpost') {
    fileUrl = `${API_BASE}/api/audit-oversight/team-checkposts/${document.id}/file`;
  } else {
    fileUrl = `${API_BASE}/api/audit-oversight/documents/${document.id}/file`;
  }
  const token = getToken();
  if (token) {
    fileUrl += `${fileUrl.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`;
  }
  
  // Determine file type from extension
  const getFileType = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    return ext || 'unknown';
  };

  const fileType = getFileType(document.name);
  const isPDF = fileType === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileType);
  const isText = ['txt', 'md', 'csv'].includes(fileType);

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
      <div className="bg-white h-full w-full md:w-3/4 lg:w-2/3 xl:w-1/2 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{document.name}</h2>
              <p className="text-xs text-gray-500">
                {document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)} Document
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {isPDF ? (
            <div className="h-full">
              <iframe
                src={fileUrl}
                className="w-full h-full border-0 rounded-lg"
                title={document.name}
              />
            </div>
          ) : isImage ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={fileUrl}
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : isText ? (
            <div className="bg-white rounded-lg shadow p-6 h-full overflow-auto">
              <iframe
                src={fileUrl}
                className="w-full h-full border-0"
                title={document.name}
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col items-center justify-center">
              <FileText className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">Preview not available for {fileType.toUpperCase()} files</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

