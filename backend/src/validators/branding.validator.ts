import { z } from 'zod';

const color = z.string().trim().min(3).max(80);

const colorsSchema = z.object({
  background: color,
  foreground: color,
  muted: color,
  surface: color,
  surfaceSolid: color,
  border: color,
  accent: color,
  accentStrong: color,
  accentSoft: color,
  sidebar: color,
  sidebarText: color,
  success: color,
  danger: color,
  warning: color,
});

const optionalUrl = z.union([z.string().trim().url(), z.literal(''), z.null()]).optional();

export const updateBrandingSchema = z.object({
  productName: z.string().trim().min(1).max(80).optional(),
  tagline: z.string().trim().min(1).max(200).optional(),
  logoUrl: optionalUrl,
  logoMarkUrl: optionalUrl,
  faviconUrl: optionalUrl,
  loginHeadline: z.string().trim().min(1).max(120).optional(),
  loginSubheadline: z.string().trim().min(1).max(240).optional(),
  loginHeroTitle: z.string().trim().min(1).max(200).optional(),
  loginHeroBody: z.string().trim().min(1).max(400).optional(),
  signupHeadline: z.string().trim().min(1).max(120).optional(),
  signupSubheadline: z.string().trim().min(1).max(240).optional(),
  signupHeroTitle: z.string().trim().min(1).max(200).optional(),
  signupHeroBody: z.string().trim().min(1).max(400).optional(),
  supportEmail: z.union([z.string().trim().email(), z.literal(''), z.null()]).optional(),
  supportUrl: optionalUrl,
  fontFamily: z.string().trim().min(3).max(300).optional(),
  radiusPx: z.number().int().min(8).max(28).optional(),
  colors: colorsSchema.optional(),
});
