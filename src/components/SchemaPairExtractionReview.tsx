import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { updateSchemaPairRule } from '../services/api';
import { findSopHighlightRange } from '../utils/sopHighlight';

type Rule = {
  rule_id?: string;
  id?: string;
  title?: string;
  description?: string;
  rule_text?: string;
  logic?: string;
  action?: string;
  checks_fields?: string[] | string;
  human_edited?: boolean;
  category?: string;
  severity?: string;
};

function ruleDisplayTitle(rule: Rule): string {
  const existing = (rule.title || '').trim();
  if (existing) return existing;
  const text = (rule.rule_text || rule.description || rule.logic || '').trim();
  if (!text) return '';
  return text.length > 72 ? `${text.slice(0, 72)}…` : text;
}

export default function SchemaPairExtractionReview({
  result,
  sopFile,
  sopTextFallback,
  onRulesUpdated,
}: {
  result: any;
  sopFile: File | null;
  sopTextFallback: string;
  onRulesUpdated?: (rules: Rule[]) => void;
}) {
  const [rules, setRules] = useState<Rule[]>(result?.extracted_rules || []);
  const [selectedId, setSelectedId] = useState<string | null>(
    result?.extracted_rules?.[0]
      ? String(result.extracted_rules[0].rule_id || result.extracted_rules[0].id || '')
      : null
  );
  const [draftTitle, setDraftTitle] = useState('');
  const [draftText, setDraftText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [error, setError] = useState('');
  const [showPdf, setShowPdf] = useState(false);
  const highlightRef = useRef<HTMLElement | null>(null);
  const paneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRules(result?.extracted_rules || []);
    const first = result?.extracted_rules?.[0];
    setSelectedId(first ? String(first.rule_id || first.id || '') : null);
  }, [result]);

  const pdfUrl = useMemo(() => {
    if (sopFile && sopFile.name.toLowerCase().endsWith('.pdf')) {
      return URL.createObjectURL(sopFile);
    }
    return null;
  }, [sopFile]);

  const sopText = String(
    result?.sop_text_preview || result?.sop_schema?.sop_text_preview || sopTextFallback || ''
  );
  const selected = rules.find((r) => String(r.rule_id || r.id || '') === selectedId) || null;
  const highlightRange = useMemo(
    () => findSopHighlightRange(sopText, selected),
    [sopText, selected]
  );

  useLayoutEffect(() => {
    const pane = paneRef.current;
    if (!pane || !highlightRange) return;

    const scrollToMark = () => {
      const el = highlightRef.current;
      if (!el || !pane) return;
      const delta = el.getBoundingClientRect().top - pane.getBoundingClientRect().top;
      const next = pane.scrollTop + delta - 28;
      pane.scrollTop = Math.max(0, next);
    };

    scrollToMark();
    const frame = requestAnimationFrame(scrollToMark);
    const later = window.setTimeout(scrollToMark, 120);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(later);
    };
  }, [selectedId, highlightRange?.start, highlightRange?.end, sopText.length]);

  const selectRule = (rule: Rule) => {
    const id = String(rule.rule_id || rule.id || '');
    setSelectedId(id);
    setDraftTitle(ruleDisplayTitle(rule));
    setDraftText(rule.rule_text || rule.description || rule.logic || '');
    setSaveMsg('');
    setError('');
  };

  useEffect(() => {
    if (selected) {
      setDraftTitle(ruleDisplayTitle(selected));
      setDraftText(selected.rule_text || selected.description || selected.logic || '');
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const efficacy = result?.extraction_efficacy || {};

  const handleSave = async () => {
    if (!selected || !result?.sop_schema_file) return;
    const ruleId = String(selected.rule_id || selected.id || '');
    setSaving(true);
    setError('');
    setSaveMsg('');
    try {
      const data = await updateSchemaPairRule({
        sop_schema_file: result.sop_schema_file,
        rule_id: ruleId,
        title: draftTitle,
        rule_text: draftText,
      });
      const updated = data.rule as Rule;
      const next = rules.map((r) =>
        String(r.rule_id || r.id || '') === ruleId ? { ...r, ...updated } : r
      );
      setRules(next);
      onRulesUpdated?.(next);
      setSaveMsg('Saved to SOP schema (human edited). Claim schema not rebuilt.');
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Metric label="Rules" value={String(efficacy.rule_count ?? rules.length)} />
        <Metric label="With rule ID" value={`${efficacy.pct_with_rule_id ?? '—'}%`} />
        <Metric label="With text" value={`${efficacy.pct_with_text ?? '—'}%`} />
        <Metric label="With fields" value={`${efficacy.pct_with_checks_fields ?? '—'}%`} />
      </div>

      <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          <strong>Type used:</strong> {result.document_type_label || result.used_document_type || '—'}
        </span>
        <span>
          <strong>Detected:</strong> {result.detected_document_type || '—'}
        </span>
        <span>
          <strong>LLM:</strong> {result.extraction_model || '—'}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 min-h-[420px]">
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white flex flex-col">
          <div className="px-3 py-2 border-b border-slate-100 text-sm font-semibold text-slate-800 flex items-center justify-between gap-2">
            <span>Document</span>
            <span className="text-[11px] font-normal text-slate-600">
              {selected
                ? highlightRange
                  ? `Highlighting ${selectedId}`
                  : `No match in text for ${selectedId}`
                : 'Select a rule to highlight source text'}
            </span>
            {pdfUrl && (
              <button
                type="button"
                onClick={() => setShowPdf((v) => !v)}
                className="text-[11px] font-medium text-slate-600 underline shrink-0"
              >
                {showPdf ? 'Show highlighted text' : 'Show PDF'}
              </button>
            )}
          </div>
          <div ref={paneRef} className="h-[480px] overflow-auto p-3 bg-slate-50">
            {pdfUrl && showPdf ? (
              <iframe title="SOP PDF" src={pdfUrl} className="w-full h-full rounded border border-slate-200 bg-white" />
            ) : sopText ? (
              <div className="text-xs font-mono whitespace-pre-wrap text-slate-700 leading-relaxed">
                {highlightRange ? (
                  <>
                    {sopText.slice(0, highlightRange.start)}
                    <mark
                      ref={highlightRef}
                      className="rounded-sm bg-amber-300 text-slate-900 px-0.5 py-0.5 shadow-[inset_0_0_0_2px_rgb(245,158,11)]"
                    >
                      {sopText.slice(highlightRange.start, highlightRange.end)}
                    </mark>
                    {sopText.slice(highlightRange.end)}
                  </>
                ) : (
                  sopText
                )}
              </div>
            ) : pdfUrl ? (
              <iframe title="SOP PDF" src={pdfUrl} className="w-full h-full rounded border border-slate-200 bg-white" />
            ) : (
              <div className="text-xs font-mono whitespace-pre-wrap text-slate-700">
                No document preview available. Upload or extract an SOP to enable highlighting.
              </div>
            )}
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white flex flex-col">
          <div className="px-3 py-2 border-b border-slate-100 text-sm font-semibold text-slate-800">
            Extracted rules ({rules.length})
          </div>
          <div className="grid grid-cols-5 flex-1 min-h-0">
            <div className="col-span-2 border-r border-slate-100 overflow-y-auto max-h-[480px]">
              {rules.map((rule) => {
                const id = String(rule.rule_id || rule.id || '—');
                const active = id === selectedId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectRule(rule)}
                    className={`w-full text-left px-3 py-2 border-b border-slate-50 text-xs hover:bg-amber-50 ${
                      active ? 'bg-amber-100 ring-1 ring-inset ring-amber-300' : ''
                    }`}
                  >
                    <div className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                      {id}
                      {rule.human_edited && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">edited</span>
                      )}
                    </div>
                    <div className="text-slate-600 truncate">{ruleDisplayTitle(rule)}</div>
                  </button>
                );
              })}
              {rules.length === 0 && (
                <div className="p-4 text-sm text-slate-500">No rules returned.</div>
              )}
            </div>
            <div className="col-span-3 p-3 overflow-y-auto max-h-[480px] space-y-3">
              {selected ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Title</label>
                    <input
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Rule text</label>
                    <textarea
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      rows={10}
                      className="mt-1 w-full px-2 py-1.5 border border-slate-300 rounded text-sm font-mono"
                    />
                  </div>
                  <div className="text-xs text-slate-500">
                    checks_fields:{' '}
                    {Array.isArray(selected.checks_fields)
                      ? selected.checks_fields.join(', ')
                      : selected.checks_fields || '—'}
                  </div>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save rule'}
                  </button>
                  {saveMsg && (
                    <div className="text-xs text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {saveMsg}
                    </div>
                  )}
                  {error && <div className="text-xs text-rose-700">{error}</div>}
                </>
              ) : (
                <div className="text-sm text-slate-500">Select a rule to review or edit.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
