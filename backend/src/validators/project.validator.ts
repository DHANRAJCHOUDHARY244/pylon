import { z } from 'zod';

import { DESIGN_SCHEMA_VERSION } from '../constants/index.js';

const placedPanelSchema = z.object({
  id: z.string().min(1),
  catalogId: z.string().min(1),
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  orientation: z.enum(['portrait', 'landscape']).optional(),
  groupId: z.string().nullable().optional(),
  existing: z.boolean().optional(),
  masked: z.boolean().optional(),
  stringId: z.string().nullable().optional(),
  optimizerCatalogId: z.string().nullable().optional(),
  widthM: z.number().positive().optional(),
  heightM: z.number().positive().optional(),
});

const roofRectSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  pitchDeg: z.number().optional(),
  azimuthDeg: z.number().optional(),
});

export const createProjectSchema = z.object({
  title: z.string().trim().min(2).max(240),
  customerName: z.string().trim().min(2).max(160),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().max(40).optional(),
  address: z.string().trim().min(5).max(400),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  inverterCatalogId: z.string().trim().min(1),
  batteryCatalogId: z.string().trim().min(1).nullable().optional(),
  status: z.enum(['draft', 'sent', 'signed', 'won']).optional(),
});

/** Accept full studio object graph (roof_face, string, inverter, …). */
const designObjectSchema = z
  .object({
    type: z.string().min(1),
    id: z.string().min(1),
  })
  .passthrough();

export const saveDesignSchema = z.object({
  panels: z.array(placedPanelSchema),
  roofs: z.array(roofRectSchema),
  objects: z.array(designObjectSchema).optional(),
  mapCenter: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  mapOrigin: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  mapBearing: z.number().optional(),
  mapPitch: z.number().optional(),
  zoom: z.number().min(1).max(24),
  schemaVersion: z.number().int().positive().max(DESIGN_SCHEMA_VERSION).optional(),
  proposalId: z.string().min(1).nullable().optional(),
  moduleTempC: z.number().optional(),
  coldDesignTempC: z.number().optional(),
  designVoltageDcV: z.number().nullable().optional(),
  designVoltageAcV: z.number().nullable().optional(),
  siteAddress: z.string().trim().min(5).max(400).nullable().optional(),
  mapImageryMode: z.enum(["hybrid", "satellite", "roadmap", "fallback"]).optional(),
  activeImageryId: z.string().nullable().optional(),
  production: z.record(z.string(), z.unknown()).optional(),
  shading: z.record(z.string(), z.unknown()).optional(),
  sld: z.record(z.string(), z.unknown()).optional(),
});

export const updateSiteSchema = z.object({
  address: z.string().trim().min(5).max(400),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const updateEquipmentSchema = z.object({
  inverterCatalogId: z.string().trim().min(1).optional(),
  batteryCatalogId: z.string().trim().min(1).nullable().optional(),
  status: z.enum(['draft', 'sent', 'signed', 'won']).optional(),
});

export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});
