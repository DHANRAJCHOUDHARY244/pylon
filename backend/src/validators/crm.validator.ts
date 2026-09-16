import { z } from 'zod';

import { DEAL_STAGES, LEAD_STATUSES, TASK_STATUSES } from '../constants/index.js';

export const createLeadSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  address: z.string().trim().max(320).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  source: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(4000).optional(),
  valueAud: z.number().min(0).optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

const dealQuoteLineItemSchema = z.object({
  description: z.string().trim().min(1).max(320),
  quantity: z.number().nullable().optional(),
  unitPriceAud: z.number().nullable().optional(),
  totalAud: z.number().nullable().optional(),
  included: z.boolean().optional(),
});

const dealQuoteMilestoneSchema = z.object({
  percentage: z.number(),
  description: z.string().trim().min(1).max(240),
  amountAud: z.number(),
});

export const dealQuoteSnapshotSchema = z.object({
  systemKwDc: z.number().nullable().optional(),
  systemKwAc: z.number().nullable().optional(),
  batteryKwh: z.number().nullable().optional(),
  batteryUsableKwh: z.number().nullable().optional(),
  panelCount: z.number().nullable().optional(),
  panelWatts: z.number().nullable().optional(),
  panelModel: z.string().trim().max(240).nullable().optional(),
  inverterModel: z.string().trim().max(240).nullable().optional(),
  inverterWatts: z.number().nullable().optional(),
  batteryModel: z.string().trim().max(240).nullable().optional(),
  annualProductionKwh: z.number().nullable().optional(),
  systemEfficiencyPct: z.number().nullable().optional(),
  listPriceAud: z.number().nullable().optional(),
  rebateAud: z.number().nullable().optional(),
  stcCreditAud: z.number().nullable().optional(),
  batteryStcCreditAud: z.number().nullable().optional(),
  subtotalInclGstAud: z.number().nullable().optional(),
  gstAud: z.number().nullable().optional(),
  totalInclGstAud: z.number().nullable().optional(),
  depositAud: z.number().nullable().optional(),
  depositPct: z.number().nullable().optional(),
  averageMonthlyBillWithSolarAud: z.number().nullable().optional(),
  averageMonthlyBillWithoutSolarAud: z.number().nullable().optional(),
  annualBillWithSolarAud: z.number().nullable().optional(),
  annualBillWithoutSolarAud: z.number().nullable().optional(),
  annualSavingsAud: z.number().nullable().optional(),
  npvAud: z.number().nullable().optional(),
  paybackYears: z.string().trim().max(40).nullable().optional(),
  roiPct: z.number().nullable().optional(),
  irrPct: z.number().nullable().optional(),
  treesEquivalentPerYear: z.number().nullable().optional(),
  petrolLitresAvoidedPerYear: z.number().nullable().optional(),
  coalKgAvoidedPerYear: z.number().nullable().optional(),
  preparedBy: z.string().trim().max(160).nullable().optional(),
  preparedAt: z.string().trim().max(80).nullable().optional(),
  companyName: z.string().trim().max(160).nullable().optional(),
  companyAbn: z.string().trim().max(40).nullable().optional(),
  companyAddress: z.string().trim().max(320).nullable().optional(),
  companyPhone: z.string().trim().max(40).nullable().optional(),
  companyEmail: z.string().trim().max(200).nullable().optional(),
  tiltDeg: z.number().nullable().optional(),
  azimuthDeg: z.number().nullable().optional(),
  exportLimit: z.string().trim().max(80).nullable().optional(),
  electricityPriceAud: z.number().nullable().optional(),
  feedInTariffAud: z.number().nullable().optional(),
  utilityInflationPct: z.number().nullable().optional(),
  systemLifetimeYears: z.number().nullable().optional(),
  lineItems: z.array(dealQuoteLineItemSchema).optional(),
  paymentMilestones: z.array(dealQuoteMilestoneSchema).optional(),
  syncedAt: z.string().trim().max(40).nullable().optional(),
});

export const createDealSchema = z.object({
  title: z.string().trim().min(1).max(240),
  stage: z.enum(DEAL_STAGES).optional(),
  valueAud: z.number().min(0).optional(),
  contactName: z.string().trim().max(160).optional(),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal('')),
  contactPhone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(320).optional(),
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  expectedCloseAt: z.string().optional().nullable(),
  notes: z.string().trim().max(4000).optional(),
  starred: z.boolean().optional(),
  lostReason: z.string().trim().max(240).optional(),
  quote: dealQuoteSnapshotSchema.nullable().optional(),
});

export const updateDealSchema = createDealSchema.partial();

export const syncQuoteToCrmSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(240),
  stage: z.enum(DEAL_STAGES).optional(),
  valueAud: z.number().min(0).optional(),
  contactName: z.string().trim().max(160).optional(),
  contactEmail: z.string().trim().email().max(200).optional().or(z.literal('')),
  contactPhone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(320).optional(),
  customerId: z.string().optional().nullable(),
  createLead: z.boolean().optional(),
  notes: z.string().trim().max(4000).optional(),
  quote: dealQuoteSnapshotSchema,
});

export const convertLeadSchema = z.object({
  title: z.string().trim().min(1).max(240).optional(),
  valueAud: z.number().min(0).optional(),
  createContact: z.boolean().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(240),
  status: z.enum(TASK_STATUSES).optional(),
  dueAt: z.string().optional().nullable(),
  notes: z.string().trim().max(4000).optional(),
  dealId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const createCalendarEventSchema = z.object({
  title: z.string().trim().min(1).max(240),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  allDay: z.boolean().optional(),
  location: z.string().trim().max(320).optional(),
  notes: z.string().trim().max(4000).optional(),
  dealId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
});

export const updateCalendarEventSchema = createCalendarEventSchema.partial();

export const createContactSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
});

export const updateContactSchema = createContactSchema.partial();
