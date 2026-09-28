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
        published: input.published ?? true,
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
}

export const panelService = new PanelService();
