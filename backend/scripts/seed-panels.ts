/**
 * Seed / upsert solar panel catalog (no duplicates — unique by sku).
 *
 * Sources:
 *   - all brand files in ../data/panels-by-brand/*.json  (default)
 *   - or a single export file via --file
 *
 * Usage (from backend/):
 *   npm run seed:panels
 *   npx tsx scripts/seed-panels.ts
 *   npx tsx scripts/seed-panels.ts --dir ../data/panels-by-brand
 *   npx tsx scripts/seed-panels.ts --file ../data/pylon-panels-top-brands.json
 */
import { readdir, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import mongoose from 'mongoose';

import { env } from '../src/config/index.js';
import { Panel, type IPanel } from '../src/models/panel.model.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = resolve(__dirname, '../../data/panels-by-brand');
const DEFAULT_FILE = resolve(__dirname, '../../data/pylon-panels-top-brands.json');
const BATCH_SIZE = 500;

type RawPanel = Record<string, unknown>;
type MappedPanel = Omit<IPanel, 'createdAt' | 'updatedAt'>;

type ExportFile = {
  source?: string;
  exportedAt?: string;
  brand?: string;
  total?: number;
  panels?: RawPanel[];
};

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function resolvePath(input: string): string {
  return isAbsolute(input) ? input : resolve(process.cwd(), input);
}

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

function asBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  }
  return false;
}

function asDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapPanel(raw: RawPanel): MappedPanel | null {
  const sku = asString(raw.sku) ?? asString(raw.objectID);
  const code = asString(raw.code);
  const brand = asString(raw.brand);
  const length = asNumber(raw.length);
  const width = asNumber(raw.width);
  const height = asNumber(raw.height);
  const stcPmax = asNumber(raw.stc_pmax);

  if (!sku || !code || !brand || length == null || width == null || height == null || stcPmax == null) {
    return null;
  }

  return {
    sku,
    objectId: asString(raw.objectID) ?? sku,
    brand,
    shortName: asString(raw.short_name),
    line: asString(raw.line),
    code,
    identifier: asString(raw.identifier),
    cellType: asString(raw.cell_type),
    cellTech: asString(raw.cell_tech),
    cellSize: asString(raw.cell_size),
    cellCount: asNumber(raw.cell_count),
    junctionBox: asString(raw.junction_box),
    cableLength: asNumber(raw.cable_length),
    frameType: asString(raw.frame_type),
    length,
    width,
    height,
    weight: asNumber(raw.weight),
    moduleEfficiency: asNumber(raw.module_efficiency),
    stcPmax,
    stcPowerTolerance: asString(raw.stc_power_tolerance),
    stcVmpp: asNumber(raw.stc_vmpp),
    stcImpp: asNumber(raw.stc_impp),
    stcVoc: asNumber(raw.stc_voc),
    stcIsc: asNumber(raw.stc_isc),
    noctPmax: asNumber(raw.noct_pmax),
    noctVmpp: asNumber(raw.noct_vmpp),
    noctImpp: asNumber(raw.noct_impp),
    noctVoc: asNumber(raw.noct_voc),
    noctIsc: asNumber(raw.noct_isc),
    maximumSystemVoltageIec: asNumber(raw.maximum_system_voltage_iec),
    maximumSystemVoltageUl: asNumber(raw.maximum_system_voltage_ul),
    maximumSeriesFuse: asNumber(raw.maximum_series_fuse),
    imax: asNumber(raw.imax),
    tmin: asNumber(raw.tmin),
    tmax: asNumber(raw.tmax),
    noctC: asNumber(raw.noct_c),
    noctCRange: asNumber(raw.noct_c_range),
    tempCoeffPmax: asNumber(raw.temp_coeff_pmax),
    tempCoeffVoc: asNumber(raw.temp_coeff_voc),
    tempCoeffIsc: asNumber(raw.temp_coeff_isc),
    deratingPeriod1Duration: asNumber(raw.derating_period_1_duration),
    deratingPeriod1StartPerformance: asNumber(raw.derating_period_1_start_performance),
    deratingPeriod1EndPerformance: asNumber(raw.derating_period_1_end_performance),
    deratingPeriod1Rate: asNumber(raw.derating_period_1_rate),
    deratingPeriod2Duration: asNumber(raw.derating_period_2_duration),
    deratingPeriod2StartPerformance: asNumber(raw.derating_period_2_start_performance),
    deratingPeriod2EndPerformance: asNumber(raw.derating_period_2_end_performance),
    deratingPeriod2Rate: asNumber(raw.derating_period_2_rate),
    imgSrc: asString(raw.img_src),
    notes: asString(raw.notes),
    files: asString(raw.files),
    published: asBool(raw.published ?? true),
    warrantyFileName: asString(raw.warranty_file_name),
    installManualFile: asString(raw.install_manual_file),
    installManualName: asString(raw.install_manual_name),
    performanceWarranty: asNumber(raw.performance_warranty),
    productWarranty: asNumber(raw.product_warranty),
    cellCutCountHor: asNumber(raw.cell_cut_count_hor),
    cellCutCountVert: asNumber(raw.cell_cut_count_vert),
    bifacial: asBool(raw.bifacial),
    bifaciality: asNumber(raw.bifaciality),
    country: asString(raw.country),
    manufactureCountry: asString(raw.manufacture_country),
    assembledCountry: asString(raw.assembled_country),
    mcsCertificateFile: asString(raw.mcs_certificate_file),
    mcsCertificate: asString(raw.mcs_certificate),
    mcsCertified: asBool(raw.mcs_certified),
    iec61215_2021: asBool(raw.iec61215_2021),
    cecApprovedDate: asString(raw.cec_approved_date),
    cecExpiryDate: asString(raw.cec_expiry_date),
    isGlobal: asBool(raw.is_global),
    cecApprovedTs: asNumber(raw.cec_approved_ts),
    cecExpiryTs: asNumber(raw.cec_expiry_ts),
    deletedAt: asDate(raw.deleted_at),
    sourceCreatedAt: asDate(raw.created_at),
    sourceUpdatedAt: asDate(raw.updated_at),
  };
}

async function loadPanelsFromFile(jsonPath: string): Promise<RawPanel[]> {
  const raw = JSON.parse(await readFile(jsonPath, 'utf8')) as ExportFile | RawPanel[];
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw.panels) ? raw.panels : [];
}

async function loadAllPanels(): Promise<{ panels: RawPanel[]; sources: string[] }> {
  const fileArg = argValue('--file');
  const dirArg = argValue('--dir');

  if (fileArg) {
    const jsonPath = resolvePath(fileArg);
    console.log(`Reading file ${jsonPath}`);
    return { panels: await loadPanelsFromFile(jsonPath), sources: [jsonPath] };
  }

  const dirPath = resolvePath(dirArg ?? DEFAULT_DIR);
  console.log(`Reading brand directory ${dirPath}`);
  const names = (await readdir(dirPath))
    .filter((name) => name.endsWith('.json') && !name.startsWith('_'))
    .sort((a, b) => a.localeCompare(b));

  if (!names.length) {
    console.warn(`No brand JSON files found; falling back to ${DEFAULT_FILE}`);
    return { panels: await loadPanelsFromFile(DEFAULT_FILE), sources: [DEFAULT_FILE] };
  }

  const panels: RawPanel[] = [];
  const sources: string[] = [];
  for (const name of names) {
    const full = join(dirPath, name);
    const chunk = await loadPanelsFromFile(full);
    panels.push(...chunk);
    sources.push(full);
  }
  console.log(`Brand files: ${names.length}`);
  return { panels, sources };
}

async function main(): Promise<void> {
  const { panels, sources } = await loadAllPanels();
  console.log(`Raw panels loaded: ${panels.length} from ${sources.length} source(s)`);

  // Deduplicate in memory by sku (and objectId fallback)
  const bySku = new Map<string, MappedPanel>();
  let skipped = 0;
  let dupesDropped = 0;

  for (const panel of panels) {
    const doc = mapPanel(panel);
    if (!doc) {
      skipped += 1;
      continue;
    }
    if (bySku.has(doc.sku)) {
      dupesDropped += 1;
      // Keep the newer sourceUpdatedAt when available
      const prev = bySku.get(doc.sku)!;
      const prevTs = prev.sourceUpdatedAt?.getTime() ?? 0;
      const nextTs = doc.sourceUpdatedAt?.getTime() ?? 0;
      if (nextTs >= prevTs) bySku.set(doc.sku, doc);
      continue;
    }
    bySku.set(doc.sku, doc);
  }

  const mapped = Array.from(bySku.values());
  console.log(
    `Unique by sku: ${mapped.length} (skipped invalid=${skipped}, dropped dupes=${dupesDropped})`,
  );

  console.log(`Connecting ${env.MONGODB_URI.replace(/\/\/([^@]+)@/, '//***@')}`);
  await mongoose.connect(env.MONGODB_URI);
  mongoose.set('strictQuery', true);

  // Ensure unique sku index (primary dedupe key)
  await Panel.collection.createIndex({ sku: 1 }, { unique: true });
  await Panel.collection.createIndex({ objectId: 1 });
  await Panel.collection.createIndex({ brand: 1, stcPmax: -1 });

  let upserted = 0;
  let modified = 0;
  let matched = 0;

  for (let i = 0; i < mapped.length; i += BATCH_SIZE) {
    const batch = mapped.slice(i, i + BATCH_SIZE);
    const ops = batch.map((doc) => ({
      updateOne: {
        filter: { sku: doc.sku },
        update: { $set: doc },
        upsert: true,
      },
    }));

    const result = await Panel.bulkWrite(ops, { ordered: false });
    upserted += result.upsertedCount;
    modified += result.modifiedCount;
    matched += result.matchedCount;

    const done = Math.min(i + batch.length, mapped.length);
    console.log(`  … ${done}/${mapped.length} (upserted=${upserted}, modified=${modified})`);
  }

  const totalInDb = await Panel.countDocuments();
  const distinctSkus = await Panel.distinct('sku');
  const brandCount = await Panel.distinct('brand');

  console.log('Done.');
  console.log(
    JSON.stringify(
      {
        sources: sources.length,
        uniqueImported: mapped.length,
        upserted,
        modified,
        matched,
        totalInDb,
        distinctSkus: distinctSkus.length,
        brands: brandCount.length,
        duplicatesInDb: totalInDb - distinctSkus.length,
      },
      null,
      2,
    ),
  );

  await mongoose.disconnect();
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
