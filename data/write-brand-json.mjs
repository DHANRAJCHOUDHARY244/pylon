/**
 * Write brand panel JSON files from a CDP response or inline payload.
 * Usage:
 *   node write-brand-json.mjs <outDir> <cdpResponse.json>
 *   node write-brand-json.mjs <outDir> --inline '<json>'
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function slugify(brand) {
  return (
    String(brand)
      .trim()
      .replace(/[°]/g, '')
      .replace(/[\/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'unknown-brand'
  );
}

const outDir = process.argv[2];
if (!outDir) {
  console.error('Usage: node write-brand-json.mjs <outDir> <cdp.json|--inline json>');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

let payload;
if (process.argv[3] === '--inline') {
  payload = JSON.parse(process.argv[4]);
} else {
  const cdpPath = process.argv[3];
  const cdp = JSON.parse(readFileSync(cdpPath, 'utf8'));
  const value = cdp.result?.value;
  payload = typeof value === 'string' ? JSON.parse(value) : value;
}

const items = Array.isArray(payload)
  ? payload
  : Array.isArray(payload?.results)
    ? payload.results
    : payload?.brand
      ? [payload]
      : [];

if (!items.length) {
  console.error('No brand results found in payload');
  process.exit(1);
}

const written = [];
for (const item of items) {
  const brand = item.brand;
  if (!brand) continue;
  const panels = item.panels || [];
  const file = join(outDir, `${slugify(brand)}.json`);
  const body = {
    brand,
    source: 'Pylon Editor Algolia panels_production',
    exportedAt: new Date().toISOString(),
    total: panels.length,
    panels,
  };
  writeFileSync(file, JSON.stringify(body, null, 2));
  written.push({ brand, total: panels.length, file });
}

console.log(JSON.stringify({ count: written.length, written }, null, 2));
