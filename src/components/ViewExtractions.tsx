import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  Info,
  ListChecks,
  Tag,
  Hash,
  Database,
  AlertTriangle,
} from 'lucide-react';

interface Document {
  id: number;
  name: string;
  document_type: string;
  uploaded_at?: string;
  extracted_data?: any;
  extracted_rules?: any;
  extracted_declarations?: any;
  checkposts_data?: any;
  ai_model_used?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_cost?: number;
  processing_time?: number;
  has_extracted_data?: boolean;
}

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'unknown';

interface NormalizedRule {
  id: string;
  title: string;
  category?: string;
  severity: Severity;
  confidence?: number;
  action?: string;
  source?: string;
  excerpt?: string;
  fullText?: string;
  validationType?: string;
  fieldName?: string;
  raw: any;
}

interface ViewExtractionsProps {
  document: Document | null;
  onClose: () => void;
}

const severityOrder: Severity[] = ['critical', 'high', 'medium', 'low', 'unknown'];

const severityColors: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-amber-100 text-amber-800 border-amber-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  unknown: 'bg-gray-100 text-gray-700 border-gray-200',
};

const severityDot: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-500',
  low: 'bg-emerald-500',
  unknown: 'bg-gray-400',
};

function coerceSeverity(value?: string): Severity {
  if (!value) return 'unknown';
  const lowered = value.toLowerCase();
  if (['critical', 'high', 'medium', 'low'].includes(lowered)) return lowered as Severity;
  return 'unknown';
}

function normalizeArray(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === 'object') {
    if (Array.isArray(data.rules)) return data.rules;
    if (Array.isArray(data.declarations)) return data.declarations;
    if (Array.isArray(data.checkposts)) return data.checkposts;
  }
  return [];
}

function flattenObjectEntries(obj: any, parentKey = ''): { key: string; value: any }[] {
  if (!obj || typeof obj !== 'object') return [];
  const entries: { key: string; value: any }[] = [];
  Object.entries(obj).forEach(([k, v]) => {
    const newKey = parentKey ? `${parentKey}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      entries.push(...flattenObjectEntries(v, newKey));
    } else {
      entries.push({ key: newKey, value: v });
    }
  });
  return entries;
}

function normalizeRules(document: Document): NormalizedRule[] {
  // Accept stringified JSON too
  const resolveRaw = (val: any) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  };

  const raw = resolveRaw(
    document.extracted_data ??
      document.extracted_rules ??
      document.extracted_declarations ??
      document.checkposts_data
  );

  let items = normalizeArray(raw);

  // Fallback for claim extractions that are key/value objects
  if (items.length === 0 && raw && typeof raw === 'object' && !Array.isArray(raw)) {
    items = flattenObjectEntries(raw).map(({ key, value }) => ({
      id: key,
      title: key,
      fullText: `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`,
      category: 'claim_field',
      severity: 'unknown',
      raw: { key, value },
    }));
  }

  // If items is an array of claim-like objects (key/value blobs), flatten each object into entries
  const isClaimLikeObject = (obj: any) =>
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    (obj.claim_id || obj.claim_number) &&
    !obj.rule_text &&
    !obj.declaration_text &&
    !obj.rules;

  if (items.length > 0 && isClaimLikeObject(items[0])) {
    items = items.flatMap((obj: any, idx: number) =>
      flattenObjectEntries(obj, obj.claim_id ? `claim.${obj.claim_id}` : `item_${idx + 1}`).map(
        ({ key, value }) => ({
          id: key,
          title: key,
          fullText: `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`,
          category: 'claim_field',
          severity: 'unknown',
          raw: { key, value },
        })
      )
    );
  }

  return items.map((item: any, idx: number): NormalizedRule => {
    const rawValue = item.value;
    const valueAsString =
      rawValue === undefined
        ? ''
        : typeof rawValue === 'string'
        ? rawValue
        : Array.isArray(rawValue) || typeof rawValue === 'object'
        ? JSON.stringify(rawValue)
        : String(rawValue);

    let text =
      item.declaration_text ||
      item.rule_text ||
      item.text ||
      item.description ||
      item.summary ||
      item.title ||
      item.content ||
      valueAsString ||
      item.fullText ||
      '';

    const title =
      item.declaration_text ||
      item.title ||
      item.name ||
      item.heading ||
      (item.key ? String(item.key) : undefined) ||
      (item.id ? String(item.id) : undefined) ||
      (text ? text.slice(0, 80) : `Rule ${idx + 1}`);

    const excerpt = text ? (text.length > 180 ? `${text.slice(0, 180)}...` : text) : '';

    const id =
      item.id ||
      item.rule_id ||
      item.code ||
      item.key ||
      item.section ||
      item.declaration_type ||
      `rule_${idx + 1}`;

    const validationType =
      item.validation_logic ||
      item.validation?.type ||
      item.validation_type ||
      item.rule_type ||
      item.type ||
      item.declaration_type;

    const fieldName =
      item.validation?.field_name ||
      item.field_name ||
      item.field ||
      item.target_field ||
      item.declaration_type ||
      item.key ||
      item.id ||
      item.category ||
      undefined;

    const action =
      item.action_on_fail ||
      item.action_if_violated ||
      item.action ||
      item.validation?.action_on_fail;

    const sourceParts = [];
    if (item.source_section) sourceParts.push(item.source_section);
    if (item.chunk_index) sourceParts.push(`Chunk ${item.chunk_index}/${item.chunk_total || ''}`.trim());
    if (item.source?.section) sourceParts.push(`Section ${item.source.section}`);
    if (item.source?.page) sourceParts.push(`Page ${item.source.page}`);
    const source = sourceParts.join(', ');

    const confidence =
      item.confidence_score ??
      item.confidence ??
      item.score ??
      (typeof item.confidence === 'string' ? parseFloat(item.confidence) : undefined);

    const severity = coerceSeverity(item.severity || item.level || item.priority);

    return {
      id: String(id),
      title,
      category: item.category || item.rule_type || item.type || item.declaration_type,
      severity,
      confidence,
      action,
      source,
      excerpt,
      fullText: item.fullText || text,
      validationType,
      fieldName,
      raw: item,
    };
  });
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

function formatJSON(data: any) {
  if (!data) return 'No data available';
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

export default function ViewExtractions({ document, onClose }: ViewExtractionsProps) {
  const docType = (document?.document_type || '').toLowerCase();
  const isClaimDoc = docType.includes('claim');
  const listLabel = (() => {
    if (isClaimDoc) return 'Claim details';
    if (docType.includes('playbook') || docType.includes('sop')) return 'SOP Rules';
    if (docType.includes('checkpost')) return 'Checkpost Rules';
    if (docType.includes('policy')) return 'Policy Rules';
    return 'Rules';
  })();
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  const rules = useMemo(() => (document ? normalizeRules(document) : []), [document]);
  const [selectedId, setSelectedId] = useState<string | null>(rules[0]?.id ?? null);

  useEffect(() => {
    if (rules.length > 0) {
      setSelectedId(rules[0].id);
    } else {
      setSelectedId(null);
    }
  }, [rules]);

  const selectedRule = rules.find((r) => r.id === selectedId) ?? rules[0];

  const filtered = rules.filter((rule) => {
    const passesSeverity =
      severityFilter === 'all' ? true : rule.severity === severityFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      rule.title.toLowerCase().includes(q) ||
      (rule.fullText || '').toLowerCase().includes(q) ||
      (rule.category || '').toLowerCase().includes(q) ||
      (rule.fieldName || '').toLowerCase().includes(q);
    return passesSeverity && matchesSearch;
  });

  const counts = rules.reduce(
    (acc, rule) => {
      acc[rule.severity] = (acc[rule.severity] || 0) + 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 } as Record<Severity, number>
  );

  if (!document) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 leading-tight">
                {document.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {document.document_type
                  ? document.document_type.replace(/_/g, ' ')
                  : 'Document'}{' '}
                • Uploaded {formatDate(document.uploaded_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, category, field name, text"
                className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[240px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as Severity | 'all')}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All severities</option>
                {severityOrder.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {counts.critical} Critical
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                {counts.high} High
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                {counts.medium} Medium
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {counts.low} Low
              </div>
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4 flex-1 overflow-hidden p-4">
          {/* Timeline / list */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ListChecks className="w-4 h-4 text-blue-600" />
                {listLabel} ({filtered.length}/{rules.length})
              </div>
              <span className="text-xs text-gray-500">
                {document.document_type?.replace(/_/g, ' ') || 'Corpus item'}
              </span>
            </div>
            <div className="overflow-y-auto custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-sm">No rules match your filters/search.</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />
                  <div className="space-y-3 p-4">
                    {filtered.map((rule) => (
                      <div
                        key={rule.id}
                        onClick={() => setSelectedId(rule.id)}
                        className={`relative pl-10 pr-3 py-3 rounded-lg border cursor-pointer transition-all ${
                          selectedRule?.id === rule.id
                            ? 'border-blue-300 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                        }`}
                      >
                        <span
                          className={`absolute left-3 top-4 w-3 h-3 rounded-full border-2 border-white shadow ${severityDot[rule.severity]}`}
                          aria-hidden
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Hash className="w-3 h-3" />
                            <span className="font-semibold text-gray-700">{rule.id}</span>
                            {rule.category && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {rule.category}
                                </span>
                              </>
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${severityColors[rule.severity]}`}
                          >
                            {rule.severity === 'unknown'
                              ? 'Unknown'
                              : rule.severity.charAt(0).toUpperCase() + rule.severity.slice(1)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">
                          {rule.title}
                        </div>
                        {rule.excerpt && (
                          <div className="mt-1 text-xs text-gray-600 line-clamp-2">{rule.excerpt}</div>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500 flex-wrap">
                          {rule.confidence !== undefined && (
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              {(rule.confidence * 100).toFixed
                                ? `${(rule.confidence * 100).toFixed(0)}%`
                                : `${rule.confidence}%`}
                            </span>
                          )}
                          {rule.fieldName && (
                            <span className="flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              Field: {rule.fieldName}
                            </span>
                          )}
                          {rule.validationType && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {rule.validationType}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 tracking-wide">RULE DETAILS</p>
                <p className="text-sm text-gray-800">{selectedRule?.id || 'Select a rule'}</p>
              </div>
              <button
                onClick={() => setShowRaw((v) => !v)}
                className="text-xs px-3 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                {showRaw ? 'Hide JSON' : 'Show JSON'}
              </button>
            </div>

            {selectedRule ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 leading-tight flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${severityDot[selectedRule.severity]}`}
                    />
                    {selectedRule.title}
                  </h3>
                  <div className="mt-2 flex items-center gap-2 flex-wrap text-xs text-gray-600">
                    {selectedRule.category && (
                      <span className="px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {selectedRule.category}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full border ${severityColors[selectedRule.severity]}`}
                    >
                      {selectedRule.severity === 'unknown'
                        ? 'Unknown'
                        : selectedRule.severity.charAt(0).toUpperCase() + selectedRule.severity.slice(1)}
                    </span>
                    {selectedRule.confidence !== undefined && (
                      <span className="px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100">
                        Confidence:{' '}
                        {selectedRule.confidence <= 1
                          ? `${(selectedRule.confidence * 100).toFixed(0)}%`
                          : `${selectedRule.confidence}%`}
                      </span>
                    )}
                    {selectedRule.action && (
                      <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
                        Action: {selectedRule.action}
                      </span>
                    )}
                  </div>
                </div>

                {selectedRule.fullText && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedRule.fullText}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-gray-100 rounded-lg p-3 bg-white">
                    <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <Tag className="w-4 h-4 text-gray-500" />
                      Validation Type
                    </div>
                    <div className="text-sm text-gray-900">
                      {selectedRule.validationType || 'Not specified'}
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-white">
                    <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <Database className="w-4 h-4 text-gray-500" />
                      Target Field (preview)
                    </div>
                    <div className="text-sm text-gray-900">
                      {selectedRule.fieldName || 'Mapping to claim fields coming soon'}
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-white">
                    <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <Info className="w-4 h-4 text-gray-500" />
                      Source
                    </div>
                    <div className="text-sm text-gray-900">
                      {selectedRule.source || 'Not provided'}
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-white">
                    <div className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-gray-500" />
                      Action on Fail
                    </div>
                    <div className="text-sm text-gray-900">
                      {selectedRule.action || 'Not specified'}
                    </div>
                  </div>
                </div>

                <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 text-sm text-amber-900">
                  <p className="font-semibold text-amber-800">Claim field mapping preview</p>
                  <p className="mt-1">
                    This viewer is claim-field centric. In the Audit Results flow, this section will show
                    how the rule was evaluated against claim fields with evidence snippets.
                  </p>
                  {selectedRule.fieldName && (
                    <p className="mt-1">
                      Expected field (preview): <code className="bg-white px-1 py-[2px] rounded border border-amber-200">{selectedRule.fieldName}</code>
                    </p>
                  )}
                </div>

                {showRaw && (
                  <div className="border border-gray-200 rounded-lg bg-slate-900 text-slate-50 text-xs p-3 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{formatJSON(selectedRule.raw)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                Select a rule to view details.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between bg-white">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Model
            </span>
            <span className="font-medium text-gray-700">{document.ai_model_used || '—'}</span>
            <span>•</span>
            <span>
              {document.total_cost !== undefined ? `$${document.total_cost.toFixed(4)} cost` : 'Cost n/a'}
            </span>
            <span>•</span>
            <span>
              {document.processing_time !== undefined
                ? `${document.processing_time.toFixed(2)}s`
                : 'Timing n/a'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

