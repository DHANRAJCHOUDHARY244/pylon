/**
 * Write GreenSketch CDP evaluate dumps into pylon/data/greensketch.
 * Usage:
 *   node write-gs-cdp-dump.mjs <cdp-json-path> [--kind=panels]
 *   node write-gs-cdp-dump.mjs --from-dir <browser-logs-dir> --prefix panels-batch
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(HERE, 'greensketch');

function slug(s) {
  return String(s || 'unknown')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'unknown';
}

function unwrapCdp(raw) {
  let val = raw;
  if (val && typeof val === 'object' && val.result?.value !== undefined) val = val.result.value;
  if (typeof val === 'string') {
    try {
      val = JSON.parse(val);
    } catch {
      /* keep string */
    }
  }
  return val;
}

function writeBrandFiles(kind, brandsPayload, meta = {}) {
  const productClass =
    kind === 'panels' ? 'panel' : kind === 'inverters' ? 'inverter' : kind === 'batteries' ? 'battery' : kind.replace(/s$/, '');
  const dir = path.join(DATA, `${kind}-by-brand`);
  fs.mkdirSync(dir, { recursive: true });
  const index = {
    source: 'greensketch',
    productClass,
    exportedAt: new Date().toISOString(),
    ...meta,
    brands: [],
  };
  let total = 0;
  for (const [brand, items] of Object.entries(brandsPayload || {})) {
    const list = Array.isArray(items) ? items : [];
    const file = `${slug(brand)}.json`;
    const out = {
      source: 'greensketch',
      productClass,
      brand,
      count: list.length,
      exportedAt: new Date().toISOString(),
      items: list,
    };
    fs.writeFileSync(path.join(dir, file), JSON.stringify(out, null, 2));
    index.brands.push({ brand, count: list.length, file });
    total += list.length;
  }
  index.total = total;
  index.brandCount = index.brands.length;
  fs.writeFileSync(path.join(dir, '_index.json'), JSON.stringify(index, null, 2));
  fs.mkdirSync(path.join(DATA, kind), { recursive: true });
  fs.writeFileSync(path.join(DATA, kind, '_index.json'), JSON.stringify(index, null, 2));
  return index;
}

function mergeBrandDir(kind) {
  const dir = path.join(DATA, `${kind}-by-brand`);
  if (!fs.existsSync(dir)) return null;
  const brands = [];
  let total = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    brands.push({ brand: j.brand, count: j.count ?? j.items?.length ?? 0, file: f });
    total += j.count ?? j.items?.length ?? 0;
  }
  brands.sort((a, b) => b.count - a.count);
  const index = {
    source: 'greensketch',
    productClass: kind.replace(/s$/, ''),
    exportedAt: new Date().toISOString(),
    total,
    brandCount: brands.length,
    brands,
  };
  fs.writeFileSync(path.join(dir, '_index.json'), JSON.stringify(index, null, 2));
  fs.mkdirSync(path.join(DATA, kind), { recursive: true });
  fs.writeFileSync(path.join(DATA, kind, '_index.json'), JSON.stringify(index, null, 2));
  return index;
}

function writeAllFile(kind, items) {
  const dir = path.join(DATA, kind);
  fs.mkdirSync(dir, { recursive: true });
  const out = {
    source: 'greensketch',
    productClass: kind.replace(/s$/, ''),
    exportedAt: new Date().toISOString(),
    total: items.length,
    items,
  };
  fs.writeFileSync(path.join(dir, `${kind}-all.json`), JSON.stringify(out));
  return out.total;
}

const args = process.argv.slice(2);
const kindArg = args.find((a) => a.startsWith('--kind='));
const kind = kindArg ? kindArg.split('=')[1] : 'panels';

if (args[0] === '--merge-index') {
  const idx = mergeBrandDir(kind);
  console.log(JSON.stringify(idx, null, 2));
  process.exit(0);
}

const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Usage: node write-gs-cdp-dump.mjs <cdp-json> [--kind=panels]');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
const val = unwrapCdp(raw);

if (val?.payload && typeof val.payload === 'object') {
  const idx = writeBrandFiles(kind, val.payload, { batchBrands: val.brands });
  console.log(JSON.stringify({ mode: 'brands', ...idx }, null, 2));
} else if (Array.isArray(val?.items)) {
  const byBrand = {};
  for (const item of val.items) {
    const b = item.brandName || 'Unknown';
    (byBrand[b] ||= []).push(item);
  }
  const idx = writeBrandFiles(kind, byBrand);
  writeAllFile(kind, val.items);
  console.log(JSON.stringify({ mode: 'items', ...idx }, null, 2));
} else if (val?.brand && Array.isArray(val.items)) {
  const idx = writeBrandFiles(kind, { [val.brand]: val.items });
  console.log(JSON.stringify({ mode: 'single-brand', ...idx }, null, 2));
} else {
  console.error('Unrecognized CDP payload shape', Object.keys(val || {}));
  process.exit(1);
}
