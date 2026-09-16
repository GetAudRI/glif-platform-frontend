/**
 * SOP bundle naming — one slug ties SOP, schemas, and demo claims together.
 *
 *   uploads/sops/{original_filename}
 *   sop_{slug}_v{version}.json
 *   claim_{slug}_v{version}.json
 *   uploads/demo_claims/{slug}/{slug}_compliant_{claimId}_{timestamp}.txt
 */

export interface SopBundle {
  slug: string;
  version: string;
  sop_schema_file: string;
  claim_schema_file: string;
  sop_source_file?: string;
}

export const TESTD_SOP_BUNDLE_KEY = 'testd_sop_bundle';

const STRIP_SUFFIXES = ['_sop', '_pdf', '_doc', '_docx', '_txt'];

export function slugifySopName(name: string): string {
  const base = name.includes('.') ? name.replace(/\.[^/.]+$/, '') : name;
  let slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  slug = slug.replace(/_+/g, '_');

  if (slug.startsWith('sop_')) {
    slug = slug.slice(4);
  }

  for (const suffix of STRIP_SUFFIXES) {
    if (slug.endsWith(suffix) && slug.length > suffix.length + 2) {
      slug = slug.slice(0, -suffix.length);
    }
  }

  return slug || 'custom';
}

export function sopSchemaFilename(slug: string, version: string = '1.0'): string {
  return `sop_${slug}_v${version}.json`;
}

export function claimSchemaFilename(slug: string, version: string = '1.0'): string {
  return `claim_${slug}_v${version}.json`;
}

export function extractSlugFromSchemaFilename(filename: string): string | null {
  const match = filename.match(/^(?:sop|claim)_(.+)_v[\d.]+\.json$/i);
  return match ? match[1] : null;
}

export function demoClaimsDirectory(slug: string): string {
  return `uploads/demo_claims/${slug}/`;
}

export function buildNamingPreview(
  slug: string,
  version: string = '1.0',
  sopSourceFile?: string
) {
  const cleanSlug = slugifySopName(slug);
  return {
    slug: cleanSlug,
    version,
    sop_source: sopSourceFile ? `uploads/sops/${sopSourceFile}` : `uploads/sops/{your_sop_file}`,
    sop_schema: `config/extraction_schemas/${sopSchemaFilename(cleanSlug, version)}`,
    claim_schema: `config/extraction_schemas/${claimSchemaFilename(cleanSlug, version)}`,
    demo_claims_dir: demoClaimsDirectory(cleanSlug),
    demo_claim_example: `${cleanSlug}_compliant_CLM-2025-001_{timestamp}.txt`,
  };
}

export function saveSopBundle(bundle: SopBundle): void {
  sessionStorage.setItem(TESTD_SOP_BUNDLE_KEY, JSON.stringify(bundle));
}

export function loadSopBundle(): SopBundle | null {
  try {
    const raw = sessionStorage.getItem(TESTD_SOP_BUNDLE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Finalized Seed Stage extractions — used by Sample Build tab dropdown */
export const TESTD_FINALIZED_SEEDS_KEY = 'testd_finalized_seeds';

export interface FinalizedSeed {
  id: string;
  slug: string;
  version: string;
  label: string;
  sop_schema_file: string;
  claim_schema_file: string;
  document_type_label?: string;
  extraction_model?: string;
  rule_count?: number;
  finalized_at: string;
  sop_source_file?: string;
}

export function listFinalizedSeeds(): FinalizedSeed[] {
  try {
    const raw = localStorage.getItem(TESTD_FINALIZED_SEEDS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveFinalizedSeed(seed: FinalizedSeed): FinalizedSeed[] {
  const existing = listFinalizedSeeds().filter((s) => s.id !== seed.id);
  const next = [seed, ...existing].slice(0, 40);
  localStorage.setItem(TESTD_FINALIZED_SEEDS_KEY, JSON.stringify(next));
  saveSopBundle({
    slug: seed.slug,
    version: seed.version,
    sop_schema_file: seed.sop_schema_file,
    claim_schema_file: seed.claim_schema_file,
    sop_source_file: seed.sop_source_file,
  });
  return next;
}

export function selectFinalizedSeed(seed: FinalizedSeed): void {
  saveSopBundle({
    slug: seed.slug,
    version: seed.version,
    sop_schema_file: seed.sop_schema_file,
    claim_schema_file: seed.claim_schema_file,
    sop_source_file: seed.sop_source_file,
  });
}

/** Seed Stage run history — every extraction attempt shown in the table */
export const TESTD_SEED_RUNS_KEY = 'testd_seed_runs';

export interface SeedRun {
  id: string;
  document_name: string;
  slug: string;
  document_type: string;
  document_type_label: string;
  llm: string;
  rule_count: number;
  sop_schema_file: string;
  claim_schema_file: string;
  ran_at: string;
  finalized?: boolean;
}

export function listSeedRuns(): SeedRun[] {
  try {
    const raw = localStorage.getItem(TESTD_SEED_RUNS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordSeedRun(run: SeedRun): SeedRun[] {
  const existing = listSeedRuns().filter((r) => r.id !== run.id);
  const next = [run, ...existing].slice(0, 50);
  localStorage.setItem(TESTD_SEED_RUNS_KEY, JSON.stringify(next));
  return next;
}

export function markSeedRunFinalized(runId: string): SeedRun[] {
  const next = listSeedRuns().map((r) => (r.id === runId ? { ...r, finalized: true } : r));
  localStorage.setItem(TESTD_SEED_RUNS_KEY, JSON.stringify(next));
  return next;
}

export const TESTD_ACTIVE_SEED_RUN_KEY = 'testd_active_seed_run_id';

export function getActiveSeedRunId(): string | null {
  try {
    return localStorage.getItem(TESTD_ACTIVE_SEED_RUN_KEY);
  } catch {
    return null;
  }
}

export function setActiveSeedRunId(runId: string | null): void {
  try {
    if (runId) localStorage.setItem(TESTD_ACTIVE_SEED_RUN_KEY, runId);
    else localStorage.removeItem(TESTD_ACTIVE_SEED_RUN_KEY);
  } catch {
    /* ignore */
  }
}

export function bundleFromSchemaPairResult(result: {
  sop_slug?: string;
  sop_bundle?: SopBundle;
  sop_schema_file: string;
  claim_schema_file: string;
  sop_source_file?: string;
}, version: string, sourceFile?: string): SopBundle {
  if (result.sop_bundle?.slug) {
    return result.sop_bundle;
  }
  const slug =
    result.sop_slug ||
    extractSlugFromSchemaFilename(result.sop_schema_file) ||
    'custom';
  return {
    slug,
    version,
    sop_schema_file: result.sop_schema_file,
    claim_schema_file: result.claim_schema_file,
    sop_source_file: sourceFile,
  };
}
