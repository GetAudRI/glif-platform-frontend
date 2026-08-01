/** Rule-check scoring — keep in sync with modules/core/validation_scoring.py */

export interface RuleCheckSummary {
  rules_evaluated: number;
  rules_scored: number;
  rules_passed: number;
  rules_failed: number;
  rules_warned: number;
  rules_na: number;
  rules_other: number;
  rule_pass_rate: number;
  compliance_score: number;
  confidence_score: number;
}

export function summarizeRuleChecks(ruleChecks: any[] = []): RuleCheckSummary {
  const checks = ruleChecks || [];
  const passed = checks.filter((c) => c.status === 'PASS').length;
  const failed = checks.filter((c) => c.status === 'FAIL').length;
  const warned = checks.filter((c) => c.status === 'WARNING').length;
  const na = checks.filter((c) => c.status === 'N/A').length;
  const scored = passed + failed + warned;
  const other = checks.length - scored - na;
  const passRate = scored > 0 ? Math.round((passed / scored) * 100) : 0;

  return {
    rules_evaluated: checks.length,
    rules_scored: scored,
    rules_passed: passed,
    rules_failed: failed,
    rules_warned: warned,
    rules_na: na,
    rules_other: other,
    rule_pass_rate: passRate,
    compliance_score: passRate,
    confidence_score: passRate,
  };
}

export function rulePassRateSubtitle(summary: RuleCheckSummary): string {
  const parts = [
    `${summary.rules_passed} pass`,
    `${summary.rules_failed} fail`,
    `${summary.rules_warned} warn`,
  ];
  if (summary.rules_na > 0) {
    parts.push(`${summary.rules_na} N/A`);
  }
  return `${parts.join(' · ')} · ${summary.rules_scored} scored`;
}
