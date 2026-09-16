import { Schema, Types, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS, DEAL_STAGES, type DealStage } from '../constants/index.js';
import type { DealQuoteSnapshot } from '../types/deal-quote.js';

export interface IDeal {
  title: string;
  stage: DealStage;
  valueAud: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  leadId?: Types.ObjectId | null;
  customerId?: Types.ObjectId | null;
  projectId?: Types.ObjectId | null;
  expectedCloseAt?: Date | null;
  notes?: string;
  starred?: boolean;
  lostReason?: string;
  /** Full commercial quote snapshot (system, pricing, financials). */
  quote?: DealQuoteSnapshot | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quoteLineItemSchema = new Schema(
  {
    description: { type: String, trim: true, maxlength: 320 },
    quantity: { type: Number, default: null },
    unitPriceAud: { type: Number, default: null },
    totalAud: { type: Number, default: null },
    included: { type: Boolean, default: false },
  },
  { _id: false },
);

const quoteMilestoneSchema = new Schema(
  {
    percentage: { type: Number, required: true },
    description: { type: String, trim: true, maxlength: 240 },
    amountAud: { type: Number, required: true },
  },
  { _id: false },
);

const quoteSnapshotSchema = new Schema(
  {
    systemKwDc: { type: Number, default: null },
    systemKwAc: { type: Number, default: null },
    batteryKwh: { type: Number, default: null },
    batteryUsableKwh: { type: Number, default: null },
    panelCount: { type: Number, default: null },
    panelWatts: { type: Number, default: null },
    panelModel: { type: String, trim: true, maxlength: 240, default: null },
    inverterModel: { type: String, trim: true, maxlength: 240, default: null },
    inverterWatts: { type: Number, default: null },
    batteryModel: { type: String, trim: true, maxlength: 240, default: null },
    annualProductionKwh: { type: Number, default: null },
    systemEfficiencyPct: { type: Number, default: null },
    listPriceAud: { type: Number, default: null },
    rebateAud: { type: Number, default: null },
    stcCreditAud: { type: Number, default: null },
    batteryStcCreditAud: { type: Number, default: null },
    subtotalInclGstAud: { type: Number, default: null },
    gstAud: { type: Number, default: null },
    totalInclGstAud: { type: Number, default: null },
    depositAud: { type: Number, default: null },
    depositPct: { type: Number, default: null },
    averageMonthlyBillWithSolarAud: { type: Number, default: null },
    averageMonthlyBillWithoutSolarAud: { type: Number, default: null },
    annualBillWithSolarAud: { type: Number, default: null },
    annualBillWithoutSolarAud: { type: Number, default: null },
    annualSavingsAud: { type: Number, default: null },
    npvAud: { type: Number, default: null },
    paybackYears: { type: String, trim: true, maxlength: 40, default: null },
    roiPct: { type: Number, default: null },
    irrPct: { type: Number, default: null },
    treesEquivalentPerYear: { type: Number, default: null },
    petrolLitresAvoidedPerYear: { type: Number, default: null },
    coalKgAvoidedPerYear: { type: Number, default: null },
    preparedBy: { type: String, trim: true, maxlength: 160, default: null },
    preparedAt: { type: String, trim: true, maxlength: 80, default: null },
    companyName: { type: String, trim: true, maxlength: 160, default: null },
    companyAbn: { type: String, trim: true, maxlength: 40, default: null },
    companyAddress: { type: String, trim: true, maxlength: 320, default: null },
    companyPhone: { type: String, trim: true, maxlength: 40, default: null },
    companyEmail: { type: String, trim: true, maxlength: 200, default: null },
    tiltDeg: { type: Number, default: null },
    azimuthDeg: { type: Number, default: null },
    exportLimit: { type: String, trim: true, maxlength: 80, default: null },
    electricityPriceAud: { type: Number, default: null },
    feedInTariffAud: { type: Number, default: null },
    utilityInflationPct: { type: Number, default: null },
    systemLifetimeYears: { type: Number, default: null },
    lineItems: { type: [quoteLineItemSchema], default: undefined },
    paymentMilestones: { type: [quoteMilestoneSchema], default: undefined },
    syncedAt: { type: String, trim: true, maxlength: 40, default: null },
  },
  { _id: false },
);

const dealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    stage: { type: String, enum: DEAL_STAGES, default: 'new', index: true },
    valueAud: { type: Number, required: true, min: 0, default: 0 },
    contactName: { type: String, trim: true, maxlength: 160 },
    contactEmail: { type: String, trim: true, lowercase: true, maxlength: 200 },
    contactPhone: { type: String, trim: true, maxlength: 40 },
    address: { type: String, trim: true, maxlength: 320 },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', default: null },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    expectedCloseAt: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 4000 },
    starred: { type: Boolean, default: false },
    lostReason: { type: String, trim: true, maxlength: 240 },
    quote: { type: quoteSnapshotSchema, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.DEALS,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const raw = ret as Record<string, unknown>;
        const id = String(raw['_id']);
        delete raw['_id'];
        delete raw['__v'];
        return { id, ...raw };
      },
    },
  },
);

export type DealDocument = HydratedDocument<IDeal>;
export type DealModel = Model<IDeal>;
export const Deal = model<IDeal>('Deal', dealSchema);
