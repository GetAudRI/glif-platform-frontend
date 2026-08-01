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
