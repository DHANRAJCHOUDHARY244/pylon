/**
 * Seed / upsert inverter + battery catalogs from GreenSketch JSON dumps.
 *
 * Usage (from backend/):
 *   npm run seed:equipment
 *   npx tsx scripts/seed-equipment.ts
 *   npx tsx scripts/seed-equipment.ts --batteries-only
 *   npx tsx scripts/seed-equipment.ts --inverters-only
 */
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import mongoose from 'mongoose';

import { env } from '../src/config/index.js';
import { Battery, type IBattery } from '../src/models/battery.model.js';
import { Inverter, type IInverter } from '../src/models/inverter.model.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BATTERIES = resolve(
  __dirname,
  '../../data/greensketch/batteries/batteries-all.json',
);
const DEFAULT_INVERTERS = resolve(
  __dirname,
  '../../data/greensketch/inverters/inverters-all.json',
);
const BATCH_SIZE = 400;

type RawItem = Record<string, unknown>;

function asString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length ? s : null;
}

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapBattery(raw: RawItem): Omit<IBattery, 'createdAt' | 'updatedAt'> | null {
  const nested = (raw.battery && typeof raw.battery === 'object'
    ? (raw.battery as RawItem)
    : {}) as RawItem;
  const code = asString(raw.productCode) ?? asString(raw.cecModelNumber) ?? asString(raw.id);
  const brand = asString(raw.brandName);
  const name =
    asString(raw.displayName) ?? asString(raw.productName) ?? asString(raw.productCode) ?? code;
  const capacity = asNumber(nested.nominalEnergy) ?? asNumber(nested.usableEnergy);
  if (!code || !brand || !name || capacity == null || capacity <= 0) return null;

  const usable = asNumber(nested.usableEnergy) ?? capacity;
  let dod = asNumber(nested.depthOfDischarge);
  if (dod != null && dod > 1) dod = dod / 100;

  return {
    sku: code,
    objectId: asString(raw.id) ?? code,
    brand,
    brandLogo: asString(raw.brandLogo),
    name,
    code,
    photo: asString(raw.photo),
    datasheet: asString(raw.datasheet),
    capacityKwh: capacity,
    usableKwh: usable,
    depthOfDischarge: dod,
    roundTripEfficiency: asNumber(nested.roundTripEfficiency),
    lengthMm: asNumber(nested.length),
    widthMm: asNumber(nested.width),
    heightMm: asNumber(nested.height),
    weightKg: asNumber(nested.weight),
    chemistry: asString(nested.batteryChemistry),
    ratedDcVoltageV: asNumber(nested.ratedDcVoltage),
    maxOutputPowerW: asNumber(nested.maxOutputPower) ?? asNumber(nested.maxAcPower),
    productWarranty: asString(raw.productWarranty),
    unitCost: asNumber(raw.unitCost),
    unitPrice: asNumber(raw.unitPrice),
    published: true,
    source: 'greensketch',
    deletedAt: null,
  };
}

function mapInverter(raw: RawItem): Omit<IInverter, 'createdAt' | 'updatedAt'> | null {
  const nested = (raw.inverter && typeof raw.inverter === 'object'
    ? (raw.inverter as RawItem)
    : {}) as RawItem;
  const code = asString(raw.productCode) ?? asString(raw.cecModelNumber) ?? asString(raw.id);
  const brand = asString(raw.brandName);
  const name =
    asString(raw.displayName) ?? asString(raw.productName) ?? asString(raw.productCode) ?? code;
  const watts =
    asNumber(nested.nominalAcPower) ??
    asNumber(nested.maxAcPower) ??
    asNumber(nested.maxDcPower);
  if (!code || !brand || !name || watts == null || watts <= 0) return null;

  return {
    sku: code,
    objectId: asString(raw.id) ?? code,
    brand,
    brandLogo: asString(raw.brandLogo),
    name,
    code,
    photo: asString(raw.photo),
    datasheet: asString(raw.datasheet),
    watts,
    nominalAcPowerW: asNumber(nested.nominalAcPower),
    maxDcPowerW: asNumber(nested.maxDcPower),
    mpptCount: asNumber(nested.noOfMppTrackers),
    phases: asNumber(nested.noOfFeedInPhases),
    maxDcVoltageV: asNumber(nested.maxDcVoltage),
    mpptMinV: asNumber(nested.mpptVoltageMin),
    mpptMaxV: asNumber(nested.mpptVoltageMax),
    maxInputCurrentPerMpptA: asNumber(nested.maxInputCurrentPerMppt),
    inverterType: asString(nested.type),
    heightMm: asNumber(nested.height),
    widthMm: asNumber(nested.width),
    depthMm: asNumber(nested.depth),
    weightKg: asNumber(nested.weight),
    maxEfficiency: asNumber(nested.maxEfficiency),
    productWarranty: asString(raw.productWarranty),
    unitCost: asNumber(raw.unitCost),
    unitPrice: asNumber(raw.unitPrice),
    published: true,
    source: 'greensketch',
    deletedAt: null,
  };
}

async function upsertBatch<T extends { sku: string }>(
  model: mongoose.Model<T>,
  rows: T[],
): Promise<number> {
  if (!rows.length) return 0;
  const ops = rows.map((row) => ({
    updateOne: {
      filter: { sku: row.sku },
      update: { $set: row },
      upsert: true,
    },
  }));
  const result = await model.bulkWrite(ops, { ordered: false });
  return (result.upsertedCount ?? 0) + (result.modifiedCount ?? 0);
}

async function loadItems(path: string): Promise<RawItem[]> {
  const raw = JSON.parse(await readFile(path, 'utf8')) as {
    items?: RawItem[];
  };
  return Array.isArray(raw.items) ? raw.items : [];
}

async function seedBatteries() {
  const items = await loadItems(DEFAULT_BATTERIES);
  const mapped: Array<Omit<IBattery, 'createdAt' | 'updatedAt'>> = [];
  const seen = new Set<string>();
  for (const item of items) {
    const row = mapBattery(item);
    if (!row || seen.has(row.sku)) continue;
    seen.add(row.sku);
    mapped.push(row);
  }
  let written = 0;
  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    written += await upsertBatch(Battery as mongoose.Model<IBattery>, mapped.slice(i, i + BATCH_SIZE));
  }
  console.log(`Batteries: ${mapped.length} unique · ${written} upsert ops`);
}

async function seedInverters() {
  const items = await loadItems(DEFAULT_INVERTERS);
  const mapped: Array<Omit<IInverter, 'createdAt' | 'updatedAt'>> = [];
  const seen = new Set<string>();
  for (const item of items) {
    const row = mapInverter(item);
    if (!row || seen.has(row.sku)) continue;
    seen.add(row.sku);
    mapped.push(row);
  }
  let written = 0;
  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    written += await upsertBatch(
      Inverter as mongoose.Model<IInverter>,
      mapped.slice(i, i + BATCH_SIZE),
    );
  }
  console.log(`Inverters: ${mapped.length} unique · ${written} upsert ops`);
}

async function main() {
  const batteriesOnly = process.argv.includes('--batteries-only');
  const invertersOnly = process.argv.includes('--inverters-only');

  console.log(`Connecting ${env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}…`);
  await mongoose.connect(env.MONGODB_URI);

  try {
    if (!invertersOnly) await seedBatteries();
    if (!batteriesOnly) await seedInverters();
    console.log('Done.');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
