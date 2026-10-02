/**
 * Export inverter + battery catalogs from MongoDB into brand-wise JSON files.
 *
 * Usage (from backend/):
 *   npx tsx scripts/export-equipment-by-brand.ts
 *
 * Writes:
 *   data/equipment/inverters-by-brand/<brand-slug>.json + _index.json
 *   data/equipment/batteries-by-brand/<brand-slug>.json + _index.json
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import mongoose from 'mongoose';

import { env } from '../src/config/index.js';
import { Battery } from '../src/models/battery.model.js';
import { Inverter } from '../src/models/inverter.model.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../data/equipment');

function slugify(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unknown';
}

function toPublicInverter(doc: Record<string, unknown>) {
  return {
    id: String(doc.sku ?? ''),
    sku: String(doc.sku ?? ''),
    objectId: String(doc.objectId ?? doc.sku ?? ''),
    brand: String(doc.brand ?? ''),
    brandLogo: (doc.brandLogo as string | null) ?? null,
    name: String(doc.name ?? ''),
    code: String(doc.code ?? ''),
    photo: (doc.photo as string | null) ?? null,
    datasheet: (doc.datasheet as string | null) ?? null,
    watts: Number(doc.watts ?? 0),
    nominalAcPowerW: (doc.nominalAcPowerW as number | null) ?? null,
    maxDcPowerW: (doc.maxDcPowerW as number | null) ?? null,
    mpptCount: (doc.mpptCount as number | null) ?? null,
    phases: (doc.phases as number | null) ?? null,
    maxDcVoltageV: (doc.maxDcVoltageV as number | null) ?? null,
    mpptMinV: (doc.mpptMinV as number | null) ?? null,
    mpptMaxV: (doc.mpptMaxV as number | null) ?? null,
    maxInputCurrentPerMpptA: (doc.maxInputCurrentPerMpptA as number | null) ?? null,
    inverterType: (doc.inverterType as string | null) ?? null,
    heightMm: (doc.heightMm as number | null) ?? null,
    widthMm: (doc.widthMm as number | null) ?? null,
    depthMm: (doc.depthMm as number | null) ?? null,
    weightKg: (doc.weightKg as number | null) ?? null,
    maxEfficiency: (doc.maxEfficiency as number | null) ?? null,
    productWarranty: (doc.productWarranty as string | null) ?? null,
    cost: (doc.unitCost as number | null) ?? null,
    sell: (doc.unitPrice as number | null) ?? null,
    published: Boolean(doc.published ?? true),
    source: String(doc.source ?? 'crm'),
  };
}

function toPublicBattery(doc: Record<string, unknown>) {
  return {
    id: String(doc.sku ?? ''),
    sku: String(doc.sku ?? ''),
    objectId: String(doc.objectId ?? doc.sku ?? ''),
    brand: String(doc.brand ?? ''),
    brandLogo: (doc.brandLogo as string | null) ?? null,
    name: String(doc.name ?? ''),
    code: String(doc.code ?? ''),
    photo: (doc.photo as string | null) ?? null,
    datasheet: (doc.datasheet as string | null) ?? null,
    capacityKwh: Number(doc.capacityKwh ?? 0),
    usableKwh: Number(doc.usableKwh ?? 0),
    depthOfDischarge: (doc.depthOfDischarge as number | null) ?? null,
    roundTripEfficiency: (doc.roundTripEfficiency as number | null) ?? null,
    lengthMm: (doc.lengthMm as number | null) ?? null,
    widthMm: (doc.widthMm as number | null) ?? null,
    heightMm: (doc.heightMm as number | null) ?? null,
    weightKg: (doc.weightKg as number | null) ?? null,
    chemistry: (doc.chemistry as string | null) ?? null,
    ratedDcVoltageV: (doc.ratedDcVoltageV as number | null) ?? null,
    maxOutputPowerW: (doc.maxOutputPowerW as number | null) ?? null,
    productWarranty: (doc.productWarranty as string | null) ?? null,
    cost: (doc.unitCost as number | null) ?? null,
    sell: (doc.unitPrice as number | null) ?? null,
    published: Boolean(doc.published ?? true),
    source: String(doc.source ?? 'crm'),
  };
}

async function exportKind(
  kind: 'inverter' | 'battery',
  rows: Array<Record<string, unknown>>,
  mapRow: (doc: Record<string, unknown>) => Record<string, unknown>,
) {
  const folder = kind === 'inverter' ? 'inverters-by-brand' : 'batteries-by-brand';
  const dir = resolve(ROOT, folder);
  await mkdir(dir, { recursive: true });

  const byBrand = new Map<string, Array<Record<string, unknown>>>();
  for (const raw of rows) {
    const mapped = mapRow(raw);
    const brand = String(mapped.brand || 'Unknown');
    const list = byBrand.get(brand) ?? [];
    list.push(mapped);
    byBrand.set(brand, list);
  }

  const brands: Array<{ brand: string; count: number; file: string }> = [];
  for (const [brand, items] of [...byBrand.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const file = `${slugify(brand)}.json`;
    const payload = {
      source: 'crm-mongodb',
      productClass: kind,
      brand,
      exportedAt: new Date().toISOString(),
      count: items.length,
      items,
    };
    await writeFile(resolve(dir, file), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    brands.push({ brand, count: items.length, file });
  }

  const index = {
    source: 'crm-mongodb',
    productClass: kind,
    exportedAt: new Date().toISOString(),
    total: rows.length,
    brandCount: brands.length,
    brands,
  };
  await writeFile(resolve(dir, '_index.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  console.log(
    `${kind === 'inverter' ? 'inverters' : 'batteries'}: ${rows.length} items → ${brands.length} brand files in ${dir}`,
  );
}

async function main() {
  console.log(`Connecting ${env.MONGODB_URI}…`);
  await mongoose.connect(env.MONGODB_URI);

  const [inverters, batteries] = await Promise.all([
    Inverter.find({ deletedAt: null }).lean(),
    Battery.find({ deletedAt: null }).lean(),
  ]);

  await exportKind(
    'inverter',
    inverters as unknown as Array<Record<string, unknown>>,
    toPublicInverter,
  );
  await exportKind(
    'battery',
    batteries as unknown as Array<Record<string, unknown>>,
    toPublicBattery,
  );

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
