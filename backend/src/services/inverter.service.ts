import { buildPaginatedResult, getPagination } from '../helpers/response.js';
import { omitUndefined } from '../helpers/object.js';
import type { PaginatedResult } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { inverterRepository } from '../repositories/inverter.repository.js';
import type { IInverter, InverterDocument } from '../models/inverter.model.js';

export type InverterDto = {
  id: string;
  sku: string;
  objectId: string;
  brand: string;
  brandLogo: string | null;
  name: string;
  code: string;
  photo: string | null;
  datasheet: string | null;
  watts: number;
  nominalAcPowerW: number | null;
  maxDcPowerW: number | null;
  mpptCount: number | null;
  phases: number | null;
  maxDcVoltageV: number | null;
  mpptMinV: number | null;
  mpptMaxV: number | null;
  maxInputCurrentPerMpptA: number | null;
  inverterType: string | null;
  heightMm: number | null;
  widthMm: number | null;
  depthMm: number | null;
  weightKg: number | null;
  maxEfficiency: number | null;
  productWarranty: string | null;
  cost: number;
  sell: number;
  published: boolean;
};

function toDto(doc: InverterDocument): InverterDto {
  const inv = doc.toObject() as IInverter;
  const cost = inv.unitCost ?? 0;
  const sell = inv.unitPrice ?? cost;
  return {
    id: String(inv.sku),
    sku: String(inv.sku),
    objectId: String(inv.objectId ?? inv.sku),
    brand: String(inv.brand ?? ''),
    brandLogo: inv.brandLogo ?? null,
    name: String(inv.name ?? inv.code ?? ''),
    code: String(inv.code ?? ''),
    photo: inv.photo ?? null,
    datasheet: inv.datasheet ?? null,
    watts: Number(inv.watts ?? 0),
    nominalAcPowerW: inv.nominalAcPowerW ?? null,
    maxDcPowerW: inv.maxDcPowerW ?? null,
    mpptCount: inv.mpptCount ?? null,
    phases: inv.phases ?? null,
    maxDcVoltageV: inv.maxDcVoltageV ?? null,
    mpptMinV: inv.mpptMinV ?? null,
    mpptMaxV: inv.mpptMaxV ?? null,
    maxInputCurrentPerMpptA: inv.maxInputCurrentPerMpptA ?? null,
    inverterType: inv.inverterType ?? null,
    heightMm: inv.heightMm ?? null,
    widthMm: inv.widthMm ?? null,
    depthMm: inv.depthMm ?? null,
    weightKg: inv.weightKg ?? null,
    maxEfficiency: inv.maxEfficiency ?? null,
    productWarranty: inv.productWarranty ?? null,
    cost,
    sell,
    published: Boolean(inv.published),
  };
}

export class InverterService {
  async list(input: {
    page?: number;
    limit?: number;
    q?: string;
    brand?: string;
    published?: boolean;
  }): Promise<PaginatedResult<InverterDto>> {
    const { page, limit, skip } = getPagination(input.page ?? 1, input.limit ?? 24);
    const { items, total } = await inverterRepository.search(
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

  async getBySku(sku: string): Promise<InverterDto> {
    const doc = await inverterRepository.findBySku(sku);
    if (!doc) throw new NotFoundError('Inverter');
    return toDto(doc);
  }

  async getBySkus(skus: string[]): Promise<InverterDto[]> {
    const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))];
    const docs = await inverterRepository.findBySkus(unique);
    return docs.map(toDto);
  }

  async listBrands(): Promise<Array<{ brand: string; count: number }>> {
    return inverterRepository.listBrands();
  }
}

export const inverterService = new InverterService();
