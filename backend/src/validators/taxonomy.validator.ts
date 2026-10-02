import { z } from 'zod';

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);
const nullableString = z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().optional());
const kindEnum = z.enum(['panel', 'inverter', 'battery', 'all']);

export const upsertBrandSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(120).optional(),
  logoUrl: nullableString,
  website: nullableString,
  country: nullableString,
  notes: nullableString,
  kinds: z.array(kindEnum).optional(),
  published: z.boolean().optional(),
});

export const updateBrandSchema = upsertBrandSchema.partial().omit({ slug: true });

export const upsertCategorySchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(120).optional(),
  description: nullableString,
  icon: nullableString,
  kind: kindEnum,
  mapKeys: z.array(z.string().trim().min(1).max(80)).optional(),
  sortOrder: z.number().optional(),
  published: z.boolean().optional(),
});

export const updateCategorySchema = upsertCategorySchema.partial().omit({ slug: true });
