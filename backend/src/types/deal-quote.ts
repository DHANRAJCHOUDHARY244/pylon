/** Snapshot of a commercial solar quote for CRM deals. */
export type DealQuoteLineItem = {
  description: string;
  quantity?: number | null;
  unitPriceAud?: number | null;
  totalAud?: number | null;
  included?: boolean;
};

export type DealQuoteMilestone = {
  percentage: number;
  description: string;
  amountAud: number;
};

export type DealQuoteSnapshot = {
  systemKwDc?: number | null;
  systemKwAc?: number | null;
  batteryKwh?: number | null;
  batteryUsableKwh?: number | null;
  panelCount?: number | null;
  panelWatts?: number | null;
  panelModel?: string | null;
  inverterModel?: string | null;
  inverterWatts?: number | null;
  batteryModel?: string | null;
  annualProductionKwh?: number | null;
  systemEfficiencyPct?: number | null;
  listPriceAud?: number | null;
  rebateAud?: number | null;
  stcCreditAud?: number | null;
  batteryStcCreditAud?: number | null;
  subtotalInclGstAud?: number | null;
  gstAud?: number | null;
  totalInclGstAud?: number | null;
  depositAud?: number | null;
  depositPct?: number | null;
  averageMonthlyBillWithSolarAud?: number | null;
  averageMonthlyBillWithoutSolarAud?: number | null;
  annualBillWithSolarAud?: number | null;
  annualBillWithoutSolarAud?: number | null;
  annualSavingsAud?: number | null;
  npvAud?: number | null;
  paybackYears?: string | null;
  roiPct?: number | null;
  irrPct?: number | null;
  treesEquivalentPerYear?: number | null;
  petrolLitresAvoidedPerYear?: number | null;
  coalKgAvoidedPerYear?: number | null;
  preparedBy?: string | null;
  preparedAt?: string | null;
  companyName?: string | null;
  companyAbn?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  tiltDeg?: number | null;
  azimuthDeg?: number | null;
  exportLimit?: string | null;
  electricityPriceAud?: number | null;
  feedInTariffAud?: number | null;
  utilityInflationPct?: number | null;
  systemLifetimeYears?: number | null;
  lineItems?: DealQuoteLineItem[];
  paymentMilestones?: DealQuoteMilestone[];
  syncedAt?: string | null;
};
