export type VerdictRuleCheck = {
  status?: string;
  severity?: string;
  rule?: string;
  details?: string;
  category?: string;
};

export function hasCriticalAutoFail(ruleChecks: VerdictRuleCheck[] | undefined | null): boolean {
  if (!ruleChecks?.length) return false;
  return ruleChecks.some((check) => {
    if (String(check.status || '').toUpperCase() !== 'FAIL') return false;
    if (String(check.severity || '').toLowerCase() === 'critical') return true;
    const blob = `${check.rule || ''} ${check.details || ''} ${check.category || ''}`.toLowerCase();
    return (
      blob.includes('auto-fail') ||
      blob.includes('auto fail') ||
      blob.includes('reservation of rights')
    );
  });
}

export function criticalFailRuleLabel(ruleChecks: VerdictRuleCheck[] | undefined | null): string {
  const hit = (ruleChecks || []).find((check) => {
    if (String(check.status || '').toUpperCase() !== 'FAIL') return false;
    return (
      String(check.severity || '').toLowerCase() === 'critical' ||
      `${check.rule || ''} ${check.details || ''}`.toLowerCase().includes('reservation of rights')
    );
  });
  return (hit?.rule || 'Auto-fail rule').trim();
}
