import { buildPaginatedResult, getPagination } from '../helpers/response.js';
import { omitUndefined } from '../helpers/object.js';
import type { PaginatedResult } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { Battery } from '../models/battery.model.js';
import { Inverter } from '../models/inverter.model.js';
import { Panel } from '../models/panel.model.js';
import {
  EquipmentBrand,
  type EquipmentBrandDocument,
  type IEquipmentBrand,
} from '../models/equipment-brand.model.js';
import {
  EquipmentCategory,
  type EquipmentCategoryDocument,
  type IEquipmentCategory,
} from '../models/equipment-category.model.js';

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export type BrandDto = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  country: string | null;
  notes: string | null;
  kinds: string[];
  panelCount: number;
  inverterCount: number;
  batteryCount: number;
  published: boolean;
};

export type CategoryDto = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  kind: string;
  mapKeys: string[];
  sortOrder: number;
  productCount: number;
  published: boolean;
};

function brandDto(doc: EquipmentBrandDocument): BrandDto {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
    logoUrl: doc.logoUrl ?? null,
    website: doc.website ?? null,
    country: doc.country ?? null,
    notes: doc.notes ?? null,
    kinds: doc.kinds ?? [],
    panelCount: doc.panelCount ?? 0,
    inverterCount: doc.inverterCount ?? 0,
    batteryCount: doc.batteryCount ?? 0,
    published: Boolean(doc.published),
  };
}

function categoryDto(doc: EquipmentCategoryDocument): CategoryDto {
  return {
    id: String(doc._id),
    slug: doc.slug,
    name: doc.name,
    description: doc.description ?? null,
    icon: doc.icon ?? null,
    kind: doc.kind,
    mapKeys: doc.mapKeys ?? [],
    sortOrder: doc.sortOrder ?? 0,
    productCount: doc.productCount ?? 0,
    published: Boolean(doc.published),
  };
}

const DEFAULT_CATEGORIES: Array<Omit<IEquipmentCategory, 'createdAt' | 'updatedAt' | 'deletedAt' | 'productCount'>> = [
  {
    slug: 'panel-residential',
    name: 'Residential',
    description: 'Home rooftop modules',
    icon: '⌂',
    kind: 'panel',
    mapKeys: ['residential'],
    sortOrder: 10,
    published: true,
  },
  {
    slug: 'panel-commercial',
    name: 'Commercial',
    description: 'High-wattage commercial modules',
    icon: '▣',
    kind: 'panel',
    mapKeys: ['commercial'],
    sortOrder: 20,
    published: true,
  },
  {
    slug: 'panel-bifacial',
    name: 'Bifacial',
    description: 'Dual-sided modules',
    icon: '◎',
    kind: 'panel',
    mapKeys: ['bifacial'],
    sortOrder: 30,
    published: true,
  },
  {
    slug: 'panel-topcon',
    name: 'TOPCon',
    description: 'N-type TOPCon technology',
    icon: '⚡',
    kind: 'panel',
    mapKeys: ['topcon', 'n-type', 'n type'],
    sortOrder: 40,
    published: true,
  },
  {
    slug: 'inv-hybrid',
    name: 'Hybrid',
    description: 'PV + battery hybrid inverters',
    icon: '⚡',
    kind: 'inverter',
    mapKeys: ['hybrid'],
    sortOrder: 10,
    published: true,
  },
  {
    slug: 'inv-pv-only',
    name: 'PV-only',
    description: 'Grid-tied PV inverters',
    icon: '☀',
    kind: 'inverter',
    mapKeys: ['pv-only', 'pv only', 'string'],
    sortOrder: 20,
    published: true,
  },
  {
    slug: 'inv-battery-only',
    name: 'Battery-only',
    description: 'Battery inverter / PCS',
    icon: '▣',
    kind: 'inverter',
    mapKeys: ['battery-only', 'battery only'],
    sortOrder: 30,
    published: true,
  },
  {
    slug: 'bat-lfp',
    name: 'LFP',
    description: 'Lithium iron phosphate storage',
    icon: '🔋',
    kind: 'battery',
    mapKeys: ['lfp', 'lifepo4', 'lithium iron'],
    sortOrder: 10,
    published: true,
  },
  {
    slug: 'bat-nmc',
    name: 'NMC',
    description: 'Nickel manganese cobalt chemistry',
    icon: '⚡',
    kind: 'battery',
    mapKeys: ['nmc', 'ncm'],
    sortOrder: 20,
    published: true,
  },
];

export class TaxonomyService {
  async listBrands(input: {
    page?: number;
    limit?: number;
    q?: string;
    kind?: string;
  }): Promise<PaginatedResult<BrandDto>> {
    const { page, limit, skip } = getPagination(input.page ?? 1, input.limit ?? 50);
    const filter: Record<string, unknown> = { deletedAt: null };
    if (input.kind && input.kind !== 'all') {
      filter.$or = [{ kinds: input.kind }, { kinds: 'all' }];
    }
    const q = input.q?.trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$and = [{ $or: [{ name: rx }, { slug: rx }, { country: rx }] }];
    }
    const [items, total] = await Promise.all([
      EquipmentBrand.find(filter).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      EquipmentBrand.countDocuments(filter),
    ]);
    return buildPaginatedResult(items.map(brandDto), page, limit, total);
  }

  async createBrand(input: {
    name: string;
    slug?: string;
    logoUrl?: string | null;
    website?: string | null;
    country?: string | null;
    notes?: string | null;
    kinds?: string[];
    published?: boolean;
  }): Promise<BrandDto> {
    const name = input.name.trim();
    const slug = (input.slug?.trim() || slugify(name)).toLowerCase();
    const existing = await EquipmentBrand.findOne({ slug });
    if (existing && !existing.deletedAt) throw new ConflictError('Brand slug already exists');
    const doc = await EquipmentBrand.findOneAndUpdate(
      { slug },
      {
        $set: {
          name,
          slug,
          logoUrl: input.logoUrl ?? null,
          website: input.website ?? null,
          country: input.country ?? null,
          notes: input.notes ?? null,
          kinds: (input.kinds?.length ? input.kinds : ['all']) as IEquipmentBrand['kinds'],
          published: input.published ?? true,
          deletedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    if (!doc) throw new Error('Brand create failed');
    return brandDto(doc);
  }

  async updateBrand(
    slug: string,
    input: Partial<{
      name: string;
      logoUrl: string | null;
      website: string | null;
      country: string | null;
      notes: string | null;
      kinds: string[];
      published: boolean;
    }>,
  ): Promise<BrandDto> {
    const doc = await EquipmentBrand.findOneAndUpdate(
      { slug, deletedAt: null },
      { $set: omitUndefined(input) },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Brand');
    return brandDto(doc);
  }

  async removeBrand(slug: string): Promise<BrandDto> {
    const doc = await EquipmentBrand.findOneAndUpdate(
      { slug, deletedAt: null },
      { $set: { deletedAt: new Date(), published: false } },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Brand');
    return brandDto(doc);
  }

  async listCategories(input: {
    page?: number;
    limit?: number;
    q?: string;
    kind?: string;
  }): Promise<PaginatedResult<CategoryDto>> {
    const { page, limit, skip } = getPagination(input.page ?? 1, input.limit ?? 50);
    const filter: Record<string, unknown> = { deletedAt: null };
    if (input.kind && input.kind !== 'all') filter.kind = input.kind;
    const q = input.q?.trim();
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { slug: rx }, { description: rx }];
    }
    const [items, total] = await Promise.all([
      EquipmentCategory.find(filter).sort({ kind: 1, sortOrder: 1, name: 1 }).skip(skip).limit(limit).exec(),
      EquipmentCategory.countDocuments(filter),
    ]);
    return buildPaginatedResult(items.map(categoryDto), page, limit, total);
  }

  async createCategory(input: {
    name: string;
    slug?: string;
    description?: string | null;
    icon?: string | null;
    kind: string;
    mapKeys?: string[];
    sortOrder?: number;
    published?: boolean;
  }): Promise<CategoryDto> {
    const name = input.name.trim();
    const slug = (input.slug?.trim() || slugify(`${input.kind}-${name}`)).toLowerCase();
    const doc = await EquipmentCategory.findOneAndUpdate(
      { slug },
      {
        $set: {
          name,
          slug,
          description: input.description ?? null,
          icon: input.icon ?? null,
          kind: input.kind as IEquipmentCategory['kind'],
          mapKeys: (input.mapKeys ?? []).map((k) => k.trim().toLowerCase()).filter(Boolean),
          sortOrder: input.sortOrder ?? 0,
          published: input.published ?? true,
          deletedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    if (!doc) throw new Error('Category create failed');
    return categoryDto(doc);
  }

  async updateCategory(
    slug: string,
    input: Partial<{
      name: string;
      description: string | null;
      icon: string | null;
      kind: string;
      mapKeys: string[];
      sortOrder: number;
      published: boolean;
    }>,
  ): Promise<CategoryDto> {
    const patch = { ...input } as Record<string, unknown>;
    if (Array.isArray(input.mapKeys)) {
      patch.mapKeys = input.mapKeys.map((k) => k.trim().toLowerCase()).filter(Boolean);
    }
    const doc = await EquipmentCategory.findOneAndUpdate(
      { slug, deletedAt: null },
      { $set: omitUndefined(patch) },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Category');
    return categoryDto(doc);
  }

  async removeCategory(slug: string): Promise<CategoryDto> {
    const doc = await EquipmentCategory.findOneAndUpdate(
      { slug, deletedAt: null },
      { $set: { deletedAt: new Date(), published: false } },
      { new: true },
    ).exec();
    if (!doc) throw new NotFoundError('Category');
    return categoryDto(doc);
  }

  /** Upsert brands from live equipment brand fields + refresh counts. Seed default categories. */
  async syncFromEquipment(): Promise<{
    brandsUpserted: number;
    categoriesSeeded: number;
    categoriesMapped: number;
  }> {
    const [panelBrands, inverterBrands, batteryBrands] = await Promise.all([
      Panel.aggregate<{ _id: string; count: number; logo: string | null }>([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$brand',
            count: { $sum: 1 },
            logo: { $first: '$imgSrc' },
          },
        },
      ]),
      Inverter.aggregate<{ _id: string; count: number; logo: string | null }>([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$brand',
            count: { $sum: 1 },
            logo: { $first: { $ifNull: ['$brandLogo', '$photo'] } },
          },
        },
      ]),
      Battery.aggregate<{ _id: string; count: number; logo: string | null }>([
        { $match: { deletedAt: null } },
        {
          $group: {
            _id: '$brand',
            count: { $sum: 1 },
            logo: { $first: { $ifNull: ['$brandLogo', '$photo'] } },
          },
        },
      ]),
    ]);

    const map = new Map<
      string,
      {
        name: string;
        panelCount: number;
        inverterCount: number;
        batteryCount: number;
        logoUrl: string | null;
        kinds: Set<string>;
      }
    >();

    function bump(
      rows: Array<{ _id: string; count: number; logo: string | null }>,
      kind: 'panel' | 'inverter' | 'battery',
    ) {
      for (const row of rows) {
        const name = String(row._id || '').trim();
        if (!name) continue;
        const key = name.toLowerCase();
        const cur = map.get(key) ?? {
          name,
          panelCount: 0,
          inverterCount: 0,
          batteryCount: 0,
          logoUrl: null as string | null,
          kinds: new Set<string>(),
        };
        if (kind === 'panel') cur.panelCount = row.count;
        if (kind === 'inverter') cur.inverterCount = row.count;
        if (kind === 'battery') cur.batteryCount = row.count;
        cur.kinds.add(kind);
        if (!cur.logoUrl && row.logo) cur.logoUrl = row.logo;
        map.set(key, cur);
      }
    }

    bump(panelBrands, 'panel');
    bump(inverterBrands, 'inverter');
    bump(batteryBrands, 'battery');

    let brandsUpserted = 0;
    for (const entry of map.values()) {
      const slug = slugify(entry.name);
      if (!slug) continue;
      const kinds = [...entry.kinds] as IEquipmentBrand['kinds'];
      await EquipmentBrand.findOneAndUpdate(
        { slug },
        {
          $set: {
            slug,
            name: entry.name,
            panelCount: entry.panelCount,
            inverterCount: entry.inverterCount,
            batteryCount: entry.batteryCount,
            kinds: kinds.length ? kinds : ['all'],
            deletedAt: null,
            published: true,
          },
          $setOnInsert: {
            logoUrl: entry.logoUrl,
            website: null,
            country: null,
            notes: null,
          },
        },
        { upsert: true },
      ).exec();
      // Prefer keeping curated logo; only fill if empty
      if (entry.logoUrl) {
        await EquipmentBrand.updateOne(
          { slug, $or: [{ logoUrl: null }, { logoUrl: '' }] },
          { $set: { logoUrl: entry.logoUrl } },
        ).exec();
      }
      brandsUpserted += 1;
    }

    let categoriesSeeded = 0;
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await EquipmentCategory.findOne({ slug: cat.slug }).exec();
      if (!existing) {
        await EquipmentCategory.create({ ...cat, productCount: 0, deletedAt: null });
        categoriesSeeded += 1;
      } else if (existing.deletedAt) {
        existing.deletedAt = null;
        existing.published = true;
        await existing.save();
        categoriesSeeded += 1;
      }
    }

    // Map product counts via mapKeys against equipment fields
    const categories = await EquipmentCategory.find({ deletedAt: null }).exec();
    let categoriesMapped = 0;
    for (const cat of categories) {
      const keys = (cat.mapKeys ?? []).map((k) => k.toLowerCase()).filter(Boolean);
      let count = 0;
      if (cat.kind === 'panel' || cat.kind === 'all') {
        if (keys.includes('bifacial')) {
          count += await Panel.countDocuments({ deletedAt: null, bifacial: true });
        } else if (keys.length) {
          const rx = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
          count += await Panel.countDocuments({
            deletedAt: null,
            $or: [{ cellTech: rx }, { cellType: rx }, { line: rx }, { code: rx }],
          });
        }
      }
      if (cat.kind === 'inverter' || cat.kind === 'all') {
        if (keys.length) {
          const rx = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
          count += await Inverter.countDocuments({
            deletedAt: null,
            $or: [{ inverterType: rx }, { name: rx }, { code: rx }],
          });
        }
      }
      if (cat.kind === 'battery' || cat.kind === 'all') {
        if (keys.length) {
          const rx = new RegExp(keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
          count += await Battery.countDocuments({
            deletedAt: null,
            $or: [{ chemistry: rx }, { name: rx }, { code: rx }],
          });
        }
      }
      cat.productCount = count;
      await cat.save();
      categoriesMapped += 1;
    }

    return { brandsUpserted, categoriesSeeded, categoriesMapped };
  }
}

export const taxonomyService = new TaxonomyService();
