import {
  buildNamingPreview,
  SopBundle,
} from '../utils/sopNaming';

interface SopNamingPreviewProps {
  slug: string;
  version: string;
  sopSourceFile?: string;
  bundle?: SopBundle | null;
  compact?: boolean;
}

export default function SopNamingPreview({
  slug,
  version,
  sopSourceFile,
  bundle,
  compact = false,
}: SopNamingPreviewProps) {
  const preview = buildNamingPreview(slug, version, sopSourceFile || bundle?.sop_source_file);

  if (compact) {
    return (
      <p className="text-xs text-gray-600 font-mono">
        slug: <strong>{preview.slug}</strong>
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs font-mono text-gray-700 space-y-1">
      <p className="text-sm font-sans font-semibold text-gray-900 mb-2">
        Naming preview (all files share slug <code className="text-purple-700">{preview.slug}</code>)
      </p>
      <p><span className="text-gray-500">SOP upload:</span> {preview.sop_source}</p>
      <p><span className="text-gray-500">SOP schema:</span> {preview.sop_schema}</p>
      <p><span className="text-gray-500">Claim schema:</span> {preview.claim_schema}</p>
      <p><span className="text-gray-500">Demo claims:</span> {preview.demo_claims_dir}</p>
      <p><span className="text-gray-500">Claim file:</span> {preview.demo_claim_example}</p>
      {bundle && (
        <p className="text-green-700 font-sans mt-2">
          Active bundle: {bundle.sop_schema_file} + {bundle.claim_schema_file}
        </p>
      )}
    </div>
  );
}
