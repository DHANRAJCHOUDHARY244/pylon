import { buildPaginatedResult, getPagination } from '../helpers/response.js';
import { omitUndefined } from '../helpers/object.js';
import type { PaginatedResult } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';
import { batteryRepository } from '../repositories/battery.repository.js';
import type { IBattery, BatteryDocument } from '../models/battery.model.js';

export type BatteryDto = {
  id: string;
  sku: string;
  objectId: string;
  brand: string;
  brandLogo: string | null;
  name: string;
  code: string;
  photo: string | null;
  datasheet: string | null;
  capacityKwh: number;
  usableKwh: number;
  depthOfDischarge: number | null;
  roundTripEfficiency: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  weightKg: number | null;
  chemistry: string | null;
  ratedDcVoltageV: number | null;
  maxOutputPowerW: number | null;
  productWarranty: string | null;
  cost: number;
  sell: number;
  published: boolean;
};

function toDto(doc: BatteryDocument): BatteryDto {
  const b = doc.toObject() as IBattery;
  const cost = b.unitCost ?? 0;
  const sell = b.unitPrice ?? cost;
  return {
    id: String(b.sku),
    sku: String(b.sku),
    objectId: String(b.objectId ?? b.sku),
    brand: String(b.brand ?? ''),
    brandLogo: b.brandLogo ?? null,
    name: String(b.name ?? b.code ?? ''),
    code: String(b.code ?? ''),
    photo: b.photo ?? null,
    datasheet: b.datasheet ?? null,
    capacityKwh: Number(b.capacityKwh ?? 0),
    usableKwh: Number(b.usableKwh ?? b.capacityKwh ?? 0),
    depthOfDischarge: b.depthOfDischarge ?? null,
    roundTripEfficiency: b.roundTripEfficiency ?? null,
    lengthMm: b.lengthMm ?? null,
    widthMm: b.widthMm ?? null,
    heightMm: b.heightMm ?? null,
    weightKg: b.weightKg ?? null,
    chemistry: b.chemistry ?? null,
    ratedDcVoltageV: b.ratedDcVoltageV ?? null,
    maxOutputPowerW: b.maxOutputPowerW ?? null,
    productWarranty: b.productWarranty ?? null,
    cost,
    sell,
    published: Boolean(b.published),
  };
}

export class BatteryService {
  async list(input: {
    page?: number;
    limit?: number;
    q?: string;
    brand?: string;
    published?: boolean;
  }): Promise<PaginatedResult<BatteryDto>> {
    const { page, limit, skip } = getPagination(input.page ?? 1, input.limit ?? 24);
    const { items, total } = await batteryRepository.search(
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

  async getBySku(sku: string): Promise<BatteryDto> {
    const doc = await batteryRepository.findBySku(sku);
    if (!doc) throw new NotFoundError('Battery');
    return toDto(doc);
  }

  async getBySkus(skus: string[]): Promise<BatteryDto[]> {
    const unique = [...new Set(skus.map((s) => s.trim()).filter(Boolean))];
    const docs = await batteryRepository.findBySkus(unique);
    return docs.map(toDto);
  }

  async listBrands(): Promise<Array<{ brand: string; count: number }>> {
    return batteryRepository.listBrands();
  }
}

export const batteryService = new BatteryService();
