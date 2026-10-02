import { buildPaginatedResult, getPagination } from '../helpers/response.js';
import { omitUndefined } from '../helpers/object.js';
import type { PaginatedResult } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { panelRepository } from '../repositories/panel.repository.js';
import type { IPanel, PanelDocument } from '../models/panel.model.js';

export type PanelDto = {
  id: string;
  sku: string;
  objectId: string;
  brand: string;
  shortName: string | null;
  line: string | null;
  code: string;
  wattage: number;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  weightKg: number | null;
  moduleEfficiency: number | null;
  cellType: string | null;
  cellTech: string | null;
  bifacial: boolean;
  imgSrc: string | null;
  files: string | null;
  published: boolean;
  stcVmpp: number | null;
  stcImpp: number | null;
  stcVoc: number | null;
  stcIsc: number | null;
  tempCoeffPmax: number | null;
  tempCoeffVoc: number | null;
  tempCoeffIsc: number | null;
  maximumSystemVoltageIec: number | null;
  productWarranty: number | null;
  performanceWarranty: number | null;
  warrantyFileName: string | null;
  installManualFile: string | null;
  installManualName: string | null;
  identifier: string | null;
  stcPowerTolerance: string | null;
  noctPmax: number | null;
  noctVmpp: number | null;
  noctImpp: number | null;
  noctVoc: number | null;
  noctIsc: number | null;
  cellSize: string | null;
  cellCount: number | null;
  junctionBox: string | null;
  cableLength: number | null;
  frameType: string | null;
  bifaciality: number | null;
  notes: string | null;
  maximumSystemVoltageUl: number | null;
  maximumSeriesFuse: number | null;
  imax: number | null;
  tmin: number | null;
  tmax: number | null;
  noctC: number | null;
  cellCutCountHor: number | null;
  cellCutCountVert: number | null;
  country: string | null;
  manufactureCountry: string | null;
  assembledCountry: string | null;
  mcsCertificateFile: string | null;
  mcsCertificate: string | null;
  mcsCertified: boolean;
  iec61215_2021: boolean;
  cecApprovedDate: string | null;
  cecExpiryDate: string | null;
  isGlobal: boolean;
};

function toDto(doc: PanelDocument): PanelDto {
  const panel = doc.toObject() as IPanel & { id?: string };
  const width = Number(panel.width ?? 0);
  const length = Number(panel.length ?? 0);
  const widthMm = width || length;
  const heightMm = length || width;

  return {
    id: String(panel.sku),
    sku: String(panel.sku),
    objectId: String(panel.objectId ?? panel.sku),
    brand: String(panel.brand ?? ''),
    shortName: panel.shortName ?? null,
    line: panel.line ?? null,
    code: String(panel.code ?? ''),
    wattage: Number(panel.stcPmax ?? 0),
    widthMm,
    heightMm,
    thicknessMm: Number(panel.height ?? 30) || 30,
    weightKg: panel.weight ?? null,
    moduleEfficiency: panel.moduleEfficiency ?? null,
    cellType: panel.cellType ?? null,
    cellTech: panel.cellTech ?? null,
    bifacial: Boolean(panel.bifacial),
    imgSrc: panel.imgSrc ?? null,
    files: panel.files ?? null,
    published: Boolean(panel.published),
    stcVmpp: panel.stcVmpp ?? null,
    stcImpp: panel.stcImpp ?? null,
    stcVoc: panel.stcVoc ?? null,
    stcIsc: panel.stcIsc ?? null,
    tempCoeffPmax: panel.tempCoeffPmax ?? null,
    tempCoeffVoc: panel.tempCoeffVoc ?? null,
    tempCoeffIsc: panel.tempCoeffIsc ?? null,
    maximumSystemVoltageIec: panel.maximumSystemVoltageIec ?? null,
    productWarranty: panel.productWarranty ?? null,
    performanceWarranty: panel.performanceWarranty ?? null,
    warrantyFileName: panel.warrantyFileName ?? null,
    installManualFile: panel.installManualFile ?? null,
    installManualName: panel.installManualName ?? null,
    identifier: panel.identifier ?? null,
    stcPowerTolerance: panel.stcPowerTolerance ?? null,
    noctPmax: panel.noctPmax ?? null,
    noctVmpp: panel.noctVmpp ?? null,
    noctImpp: panel.noctImpp ?? null,
    noctVoc: panel.noctVoc ?? null,
    noctIsc: panel.noctIsc ?? null,
    cellSize: panel.cellSize ?? null,
    cellCount: panel.cellCount ?? null,
    junctionBox: panel.junctionBox ?? null,
    cableLength: panel.cableLength ?? null,
    frameType: panel.frameType ?? null,
    bifaciality: panel.bifaciality ?? null,
    notes: panel.notes ?? null,
    maximumSystemVoltageUl: panel.maximumSystemVoltageUl ?? null,
    maximumSeriesFuse: panel.maximumSeriesFuse ?? null,
    imax: panel.imax ?? null,
    tmin: panel.tmin ?? null,
    tmax: panel.tmax ?? null,
    noctC: panel.noctC ?? null,
    cellCutCountHor: panel.cellCutCountHor ?? null,
    cellCutCountVert: panel.cellCutCountVert ?? null,
    country: panel.country ?? null,
    manufactureCountry: panel.manufactureCountry ?? null,
    assembledCountry: panel.assembledCountry ?? null,
    mcsCertificateFile: panel.mcsCertificateFile ?? null,
    mcsCertificate: panel.mcsCertificate ?? null,
    mcsCertified: Boolean(panel.mcsCertified),
    iec61215_2021: Boolean(panel.iec61215_2021),
    cecApprovedDate: panel.cecApprovedDate ?? null,
    cecExpiryDate: panel.cecExpiryDate ?? null,
    isGlobal: Boolean(panel.isGlobal),
  };
}

export class PanelService {
  async list(input: {
    page?: number;
    limit?: number;
    q?: string;
    brand?: string;
    published?: boolean;
  }): Promise<PaginatedResult<PanelDto>> {
    const { page, limit, skip } = getPagination(input.page ?? 1, input.limit ?? 24);
    const { items, total } = await panelRepository.search(
      omitUndefined({
        q: input.q,
        brand: input.brand,
        published: input.published,
        skip,
        limit,
      }),
    );
    return buildPaginatedResult(items.map(toDto), page, limit, total);
  }

  async getBySku(sku: string): Promise<PanelDto> {
    const doc = await panelRepository.findBySku(sku);
    if (!doc) throw new NotFoundError('Panel');
    return toDto(doc);
  }

  async getBySkus(skus: string[]): Promise<PanelDto[]> {
    const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))];
    const docs = await panelRepository.findBySkus(unique);
    return docs.map(toDto);
  }

  async listBrands(): Promise<Array<{ brand: string; count: number }>> {
    return panelRepository.listBrands();
  }

  async create(input: {
    sku: string;
    brand: string;
    code: string;
    shortName?: string | null;
    line?: string | null;
    length: number;
    width: number;
    height?: number;
    weight?: number | null;
    stcPmax: number;
    stcVmpp?: number | null;
    stcImpp?: number | null;
    stcVoc?: number | null;
    stcIsc?: number | null;
    tempCoeffPmax?: number | null;
    tempCoeffVoc?: number | null;
    tempCoeffIsc?: number | null;
    moduleEfficiency?: number | null;
    cellType?: string | null;
    cellTech?: string | null;
    bifacial?: boolean;
    imgSrc?: string | null;
    files?: string | null;
    warrantyFileName?: string | null;
    installManualFile?: string | null;
    installManualName?: string | null;
    productWarranty?: number | null;
    performanceWarranty?: number | null;
    maximumSystemVoltageIec?: number | null;
    published?: boolean;
    identifier?: string | null;
    stcPowerTolerance?: string | null;
    noctPmax?: number | null;
    noctVmpp?: number | null;
    noctImpp?: number | null;
    noctVoc?: number | null;
    noctIsc?: number | null;
    cellSize?: string | null;
    cellCount?: number | null;
    junctionBox?: string | null;
    cableLength?: number | null;
    frameType?: string | null;
    bifaciality?: number | null;
    notes?: string | null;
    maximumSystemVoltageUl?: number | null;
    maximumSeriesFuse?: number | null;
    imax?: number | null;
    tmin?: number | null;
    tmax?: number | null;
    noctC?: number | null;
    cellCutCountHor?: number | null;
    cellCutCountVert?: number | null;
    country?: string | null;
    manufactureCountry?: string | null;
    assembledCountry?: string | null;
    mcsCertificateFile?: string | null;
    mcsCertificate?: string | null;
    mcsCertified?: boolean;
    iec61215_2021?: boolean;
    cecApprovedDate?: string | null;
    cecExpiryDate?: string | null;
    isGlobal?: boolean;
  }): Promise<PanelDto> {
    const sku = input.sku.trim();
    const doc = await panelRepository.upsertBySku(sku, {
      brand: input.brand.trim(),
      code: input.code.trim(),
      shortName: input.shortName ?? null,
      line: input.line ?? null,
      length: input.length,
      width: input.width,
      height: input.height ?? 30,
      weight: input.weight ?? null,
      stcPmax: input.stcPmax,
      stcVmpp: input.stcVmpp ?? null,
      stcImpp: input.stcImpp ?? null,
      stcVoc: input.stcVoc ?? null,
      stcIsc: input.stcIsc ?? null,
      tempCoeffPmax: input.tempCoeffPmax ?? null,
      tempCoeffVoc: input.tempCoeffVoc ?? null,
      tempCoeffIsc: input.tempCoeffIsc ?? null,
      moduleEfficiency: input.moduleEfficiency ?? null,
      cellType: input.cellType ?? null,
      cellTech: input.cellTech ?? null,
      bifacial: input.bifacial ?? false,
      imgSrc: input.imgSrc ?? null,
      files: input.files ?? null,
      warrantyFileName: input.warrantyFileName ?? null,
      installManualFile: input.installManualFile ?? null,
      installManualName: input.installManualName ?? null,
      productWarranty: input.productWarranty ?? null,
      performanceWarranty: input.performanceWarranty ?? null,
      maximumSystemVoltageIec: input.maximumSystemVoltageIec ?? null,
      published: input.published ?? true,
      identifier: input.identifier ?? null,
      stcPowerTolerance: input.stcPowerTolerance ?? null,
      noctPmax: input.noctPmax ?? null,
      noctVmpp: input.noctVmpp ?? null,
      noctImpp: input.noctImpp ?? null,
      noctVoc: input.noctVoc ?? null,
      noctIsc: input.noctIsc ?? null,
      cellSize: input.cellSize ?? null,
      cellCount: input.cellCount ?? null,
      junctionBox: input.junctionBox ?? null,
      cableLength: input.cableLength ?? null,
      frameType: input.frameType ?? null,
      bifaciality: input.bifaciality ?? null,
      notes: input.notes ?? null,
      maximumSystemVoltageUl: input.maximumSystemVoltageUl ?? null,
      maximumSeriesFuse: input.maximumSeriesFuse ?? null,
      imax: input.imax ?? null,
      tmin: input.tmin ?? null,
      tmax: input.tmax ?? null,
      noctC: input.noctC ?? null,
      cellCutCountHor: input.cellCutCountHor ?? null,
      cellCutCountVert: input.cellCutCountVert ?? null,
      country: input.country ?? null,
      manufactureCountry: input.manufactureCountry ?? null,
      assembledCountry: input.assembledCountry ?? null,
      mcsCertificateFile: input.mcsCertificateFile ?? null,
      mcsCertificate: input.mcsCertificate ?? null,
      mcsCertified: input.mcsCertified ?? false,
      iec61215_2021: input.iec61215_2021 ?? false,
      cecApprovedDate: input.cecApprovedDate ?? null,
      cecExpiryDate: input.cecExpiryDate ?? null,
      isGlobal: input.isGlobal ?? false,
    });
    return toDto(doc);
  }

  async update(
    sku: string,
    input: Partial<{
      brand: string;
      code: string;
      shortName: string | null;
      line: string | null;
      length: number;
      width: number;
      height: number;
      weight: number | null;
      stcPmax: number;
      stcVmpp: number | null;
      stcImpp: number | null;
      stcVoc: number | null;
      stcIsc: number | null;
      tempCoeffPmax: number | null;
      tempCoeffVoc: number | null;
      tempCoeffIsc: number | null;
      moduleEfficiency: number | null;
      cellType: string | null;
      cellTech: string | null;
      bifacial: boolean;
      imgSrc: string | null;
      files: string | null;
      warrantyFileName: string | null;
      installManualFile: string | null;
      installManualName: string | null;
      productWarranty: number | null;
      performanceWarranty: number | null;
      maximumSystemVoltageIec: number | null;
      published: boolean;
      identifier: string | null;
      stcPowerTolerance: string | null;
      noctPmax: number | null;
      noctVmpp: number | null;
      noctImpp: number | null;
      noctVoc: number | null;
      noctIsc: number | null;
      cellSize: string | null;
      cellCount: number | null;
      junctionBox: string | null;
      cableLength: number | null;
      frameType: string | null;
      bifaciality: number | null;
      notes: string | null;
      maximumSystemVoltageUl: number | null;
      maximumSeriesFuse: number | null;
      imax: number | null;
      tmin: number | null;
      tmax: number | null;
      noctC: number | null;
      cellCutCountHor: number | null;
      cellCutCountVert: number | null;
      country: string | null;
      manufactureCountry: string | null;
      assembledCountry: string | null;
      mcsCertificateFile: string | null;
      mcsCertificate: string | null;
      mcsCertified: boolean;
      iec61215_2021: boolean;
      cecApprovedDate: string | null;
      cecExpiryDate: string | null;
      isGlobal: boolean;
    }>,
  ): Promise<PanelDto> {
    const doc = await panelRepository.updateBySku(sku, omitUndefined(input));
    if (!doc) throw new NotFoundError('Panel');
    return toDto(doc);
  }

  async remove(sku: string): Promise<PanelDto> {
    const doc = await panelRepository.softDeleteBySku(sku);
    if (!doc) throw new NotFoundError('Panel');
    return toDto(doc);
  }
}

export const panelService = new PanelService();
