import { z } from 'zod';

const emptyToNull = (v: unknown) => {
  if (v === '' || v === undefined) return null;
  return v;
};

const nullableString = z.preprocess(emptyToNull, z.string().trim().max(4000).nullable().optional());
const nullableUrl = z.preprocess(emptyToNull, z.string().trim().max(4000).nullable().optional());
const nullableNumber = z.preprocess((v) => {
  if (v === '' || v === undefined || v === null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}, z.number().nullable().optional());

export const upsertBatterySchema = z.object({
  sku: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(240),
  code: z.string().trim().min(1).max(120).optional(),
  brandLogo: nullableUrl,
  photo: nullableUrl,
  datasheet: nullableUrl,
  capacityKwh: z.number().positive(),
  usableKwh: z.number().positive().optional(),
  depthOfDischarge: nullableNumber,
  roundTripEfficiency: nullableNumber,
  lengthMm: nullableNumber,
  widthMm: nullableNumber,
  heightMm: nullableNumber,
  weightKg: nullableNumber,
  chemistry: nullableString,
  ratedDcVoltageV: nullableNumber,
  maxOutputPowerW: nullableNumber,
  productWarranty: nullableString,
  unitCost: nullableNumber,
  unitPrice: nullableNumber,
  published: z.boolean().optional(),
});

export const updateBatterySchema = upsertBatterySchema.partial().omit({ sku: true });

export const upsertInverterSchema = z.object({
  sku: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(240),
  code: z.string().trim().min(1).max(120).optional(),
  brandLogo: nullableUrl,
  photo: nullableUrl,
  datasheet: nullableUrl,
  watts: z.number().positive(),
  nominalAcPowerW: nullableNumber,
  maxDcPowerW: nullableNumber,
  mpptCount: nullableNumber,
  phases: nullableNumber,
  maxDcVoltageV: nullableNumber,
  mpptMinV: nullableNumber,
  mpptMaxV: nullableNumber,
  maxInputCurrentPerMpptA: nullableNumber,
  inverterType: nullableString,
  heightMm: nullableNumber,
  widthMm: nullableNumber,
  depthMm: nullableNumber,
  weightKg: nullableNumber,
  maxEfficiency: nullableNumber,
  productWarranty: nullableString,
  unitCost: nullableNumber,
  unitPrice: nullableNumber,
  published: z.boolean().optional(),
});

export const updateInverterSchema = upsertInverterSchema.partial().omit({ sku: true });

export const upsertPanelSchema = z.object({
  sku: z.string().trim().min(1).max(120),
  brand: z.string().trim().min(1).max(120),
  code: z.string().trim().min(1).max(120),
  shortName: nullableString,
  line: nullableString,
  identifier: nullableString,
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive().optional(),
  weight: nullableNumber,
  stcPmax: z.number().positive(),
  stcPowerTolerance: nullableString,
  stcVmpp: nullableNumber,
  stcImpp: nullableNumber,
  stcVoc: nullableNumber,
  stcIsc: nullableNumber,
  noctPmax: nullableNumber,
  noctVmpp: nullableNumber,
  noctImpp: nullableNumber,
  noctVoc: nullableNumber,
  noctIsc: nullableNumber,
  tempCoeffPmax: nullableNumber,
  tempCoeffVoc: nullableNumber,
  tempCoeffIsc: nullableNumber,
  moduleEfficiency: nullableNumber,
  cellType: nullableString,
  cellTech: nullableString,
  cellSize: nullableString,
  cellCount: nullableNumber,
  junctionBox: nullableString,
  cableLength: nullableNumber,
  frameType: nullableString,
  bifacial: z.boolean().optional(),
  bifaciality: nullableNumber,
  imgSrc: nullableUrl,
  notes: nullableString,
  files: nullableUrl,
  warrantyFileName: nullableUrl,
  installManualFile: nullableUrl,
  installManualName: nullableString,
  productWarranty: nullableNumber,
  performanceWarranty: nullableNumber,
  maximumSystemVoltageIec: nullableNumber,
  maximumSystemVoltageUl: nullableNumber,
  maximumSeriesFuse: nullableNumber,
  imax: nullableNumber,
  tmin: nullableNumber,
  tmax: nullableNumber,
  noctC: nullableNumber,
  cellCutCountHor: nullableNumber,
  cellCutCountVert: nullableNumber,
  country: nullableString,
  manufactureCountry: nullableString,
  assembledCountry: nullableString,
  mcsCertificateFile: nullableUrl,
  mcsCertificate: nullableString,
  mcsCertified: z.boolean().optional(),
  iec61215_2021: z.boolean().optional(),
  cecApprovedDate: nullableString,
  cecExpiryDate: nullableString,
  isGlobal: z.boolean().optional(),
  published: z.boolean().optional(),
});

export const updatePanelSchema = upsertPanelSchema.partial().omit({ sku: true });
