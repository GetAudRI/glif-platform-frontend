export type HighlightableRule = {
  rule_id?: string;
  id?: string;
  title?: string;
  rule_text?: string;
  description?: string;
  logic?: string;
};

export type HighlightRange = { start: number; end: number };

const STOPWORDS = new Set([
  'that',
  'this',
  'with',
  'from',
  'have',
  'been',
  'before',
  'after',
  'their',
  'them',
  'they',
  'into',
  'than',
  'then',
  'also',
  'such',
  'only',
  'must',
  'will',
  'shall',
  'when',
  'which',
  'were',
  'was',
  'are',
  'for',
  'and',
  'not',
  'the',
  'claim',
  'claims',
  'proceeding',
  'complete',
  'made',
  'has',
]);

function indexIgnoreCase(haystack: string, needle: string): number {
  if (!needle) return -1;
  return haystack.toLowerCase().indexOf(needle.toLowerCase());
}

function isStructuredSop(sopText: string): boolean {
  return /Rule ID:\s*\S+/i.test(sopText) || /\nRULE\s+\d/i.test(sopText);
}

function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/^REQUIRED STATUS:/i.test(t)) return false;
  if (t.length <= 90 && /^(RULE\s+\d|SECTION\s|={5,}|-{5,}|\d+\.\d+\s)/i.test(t)) return true;
  if (t.length <= 80 && /^\d+[A-Za-z].{3,}/.test(t)) return true;
  if (t.length <= 72 && t === t.toUpperCase() && /[A-Z]/.test(t) && /[A-Z]{3,}/.test(t)) return true;
  return false;
}

function lineBounds(text: string, index: number): { start: number; end: number; line: string } {
  const start = text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
  const nl = text.indexOf('\n', index);
  const end = nl < 0 ? text.length : nl;
  return { start, end, line: text.slice(start, end) };
}

function expandToSection(sopText: string, found: number): HighlightRange {
  const before = sopText.slice(0, found);
  const startRe = /\n(?:={8,}|SECTION\s|RULE\s+\d)/gi;
  let start = Math.max(0, found - 80);
  let m: RegExpExecArray | null;
  while ((m = startRe.exec(before))) {
    const candidate = m.index + 1;
    if (found - candidate <= 1200) start = candidate;
  }

  const from = found + 8;
  const rest = sopText.slice(from);
  const em = /\n(?:={8,}|SECTION\s|RULE\s+\d)/.exec(rest);
  let end = em && em.index <= 1600 ? from + em.index : Math.min(sopText.length, found + 1400);
  if (end <= start) end = Math.min(sopText.length, found + 400);
  return { start, end };
}

function expandToParagraph(sopText: string, found: number): HighlightRange {
  const cur = lineBounds(sopText, found);
  let start = cur.start;
  let probe = start;
  while (probe > 0) {
    const prev = lineBounds(sopText, probe - 1);
    if (!prev.line.trim()) {
      probe = prev.start;
      continue;
    }
    if (isHeadingLine(prev.line)) start = prev.start;
    break;
  }

  let end = cur.end;
  let pos = end;
  let hops = 0;
  while (hops < 6 && pos < sopText.length && end - start < 520) {
    if (sopText[pos] !== '\n') break;
    const next = lineBounds(sopText, pos + 1);
    if (next.start > found && isHeadingLine(next.line)) break;
    end = next.end;
    pos = next.end;
    hops += 1;
  }
  return { start, end };
}

function expandAround(sopText: string, found: number): HighlightRange {
  return isStructuredSop(sopText) ? expandToSection(sopText, found) : expandToParagraph(sopText, found);
}

function significantPhrases(rule: HighlightableRule): string[] {
  const raw = [rule.rule_text, rule.description, rule.logic, rule.title]
    .map((s) => (s || '').replace(/^REQUIRED STATUS:[^.]*\.\s*/i, ''))
    .join(' ');
  const parts = raw
    .split(/[.;:\n]/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length >= 24 && p.length <= 160);
  return parts.slice(0, 8);
}

function findLongestPrefix(sopText: string, text: string, minLen = 28): number {
  const cleaned = (text || '')
    .replace(/^REQUIRED STATUS:[^.]*\.\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  let max = Math.min(cleaned.length, 88);
  while (max >= minLen) {
    let sub = cleaned.slice(0, max);
    const sp = sub.lastIndexOf(' ');
    if (sp >= minLen) sub = sub.slice(0, sp);
    const i = indexIgnoreCase(sopText, sub);
    if (i >= 0) return i;
    max = (sp >= minLen ? sp : max) - 1;
  }
  return -1;
}

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

function bestLineWindow(sopText: string, rule: HighlightableRule): HighlightRange | null {
  const query = new Set(
    tokens(
      `${rule.rule_id || ''} ${rule.title || ''} ${rule.rule_text || ''} ${rule.description || ''} ${rule.logic || ''}`
    )
  );
  if (query.size < 2) return null;

  const lines: { start: number; end: number; text: string }[] = [];
  let offset = 0;
  for (const line of sopText.split('\n')) {
    lines.push({ start: offset, end: offset + line.length, text: line });
    offset += line.length + 1;
  }

  let bestScore = 0;
  let best: HighlightRange | null = null;
  for (let i = 0; i < lines.length; i += 1) {
    for (let w = 1; w <= 6 && i + w <= lines.length; w += 1) {
      const slice = lines.slice(i, i + w);
      const chunk = slice.map((l) => l.text).join(' ');
      if (chunk.trim().length < 18) continue;
      const words = tokens(chunk);
      if (!words.length) continue;
      const uniq = new Set(words.filter((word) => query.has(word))).size;
      const score = uniq / Math.min(query.size, 10) / w ** 0.35;
      if (score > bestScore) {
        bestScore = score;
        best = { start: slice[0].start, end: slice[slice.length - 1].end };
      }
    }
  }
  return bestScore >= 0.18 ? best : null;
}

/** Locate the SOP section or paragraph that produced a selected extracted rule. */
export function findSopHighlightRange(
  sopText: string,
  rule: HighlightableRule | null
): HighlightRange | null {
  if (!sopText || !rule) return null;
  const id = String(rule.rule_id || rule.id || '').trim();

  if (id && id !== '—') {
    const idNeedles = [`Rule ID: ${id}`, `Rule ID:${id}`, `Rule Id: ${id}`];
    if (id.length >= 10) idNeedles.push(id);
    for (const needle of idNeedles) {
      const i = indexIgnoreCase(sopText, needle);
      if (i >= 0) return expandAround(sopText, i);
    }
  }

  for (const field of [rule.rule_text, rule.description, rule.title, rule.logic]) {
    const i = findLongestPrefix(sopText, field || '');
    if (i >= 0) return expandAround(sopText, i);
  }

  for (const phrase of significantPhrases(rule)) {
    const i = indexIgnoreCase(sopText, phrase);
    if (i >= 0) return expandAround(sopText, i);
  }

  return bestLineWindow(sopText, rule);
}
