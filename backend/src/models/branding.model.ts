import { Schema, model, type HydratedDocument, type Model } from 'mongoose';

import { COLLECTIONS } from '../constants/index.js';
import { DEFAULT_BRANDING_COLORS, DEFAULT_BRANDING_COPY } from '../constants/branding.js';

export interface IBrandingColors {
  background: string;
  foreground: string;
  muted: string;
  surface: string;
  surfaceSolid: string;
  border: string;
  accent: string;
  accentStrong: string;
  accentSoft: string;
  sidebar: string;
  sidebarText: string;
  success: string;
  danger: string;
  warning: string;
}

export interface IBranding {
  workspaceKey: string;
  productName: string;
  tagline: string;
  logoUrl: string | null;
  logoMarkUrl: string | null;
  faviconUrl: string | null;
  loginHeadline: string;
  loginSubheadline: string;
  loginHeroTitle: string;
  loginHeroBody: string;
  signupHeadline: string;
  signupSubheadline: string;
  signupHeroTitle: string;
  signupHeroBody: string;
  supportEmail: string | null;
  supportUrl: string | null;
  fontFamily: string;
  radiusPx: number;
  colors: IBrandingColors;
  createdAt: Date;
  updatedAt: Date;
}

const colorsSchema = new Schema<IBrandingColors>(
  {
    background: { type: String, required: true },
    foreground: { type: String, required: true },
    muted: { type: String, required: true },
    surface: { type: String, required: true },
    surfaceSolid: { type: String, required: true },
    border: { type: String, required: true },
    accent: { type: String, required: true },
    accentStrong: { type: String, required: true },
    accentSoft: { type: String, required: true },
    sidebar: { type: String, required: true },
    sidebarText: { type: String, required: true },
    success: { type: String, required: true },
    danger: { type: String, required: true },
    warning: { type: String, required: true },
  },
  { _id: false },
);

const brandingSchema = new Schema<IBranding>(
  {
    workspaceKey: { type: String, required: true, unique: true, index: true },
    productName: { type: String, required: true, trim: true, maxlength: 80 },
    tagline: { type: String, required: true, trim: true, maxlength: 200 },
    logoUrl: { type: String, default: null, trim: true },
    logoMarkUrl: { type: String, default: null, trim: true },
    faviconUrl: { type: String, default: null, trim: true },
    loginHeadline: { type: String, required: true, trim: true, maxlength: 120 },
    loginSubheadline: { type: String, required: true, trim: true, maxlength: 240 },
    loginHeroTitle: { type: String, required: true, trim: true, maxlength: 200 },
    loginHeroBody: { type: String, required: true, trim: true, maxlength: 400 },
    signupHeadline: { type: String, required: true, trim: true, maxlength: 120 },
    signupSubheadline: { type: String, required: true, trim: true, maxlength: 240 },
    signupHeroTitle: { type: String, required: true, trim: true, maxlength: 200 },
    signupHeroBody: { type: String, required: true, trim: true, maxlength: 400 },
    supportEmail: { type: String, default: null, trim: true, maxlength: 200 },
    supportUrl: { type: String, default: null, trim: true, maxlength: 400 },
    fontFamily: {
      type: String,
      default:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif',
      trim: true,
      maxlength: 300,
    },
    radiusPx: { type: Number, default: 18, min: 8, max: 28 },
    colors: { type: colorsSchema, required: true, default: () => ({ ...DEFAULT_BRANDING_COLORS }) },
  },
  {
    timestamps: true,
    collection: COLLECTIONS.BRANDING,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const raw = ret as Record<string, unknown>;
        const id = String(raw['_id']);
        delete raw['_id'];
        delete raw['__v'];
        delete raw['workspaceKey'];
        return { id, ...raw };
      },
    },
  },
);

export type BrandingDocument = HydratedDocument<IBranding>;
export type BrandingModel = Model<IBranding>;

export const Branding = model<IBranding>('Branding', brandingSchema);

export function buildDefaultBranding(workspaceKey: string): Omit<IBranding, 'createdAt' | 'updatedAt'> {
  return {
    workspaceKey,
    productName: DEFAULT_BRANDING_COPY.productName,
    tagline: DEFAULT_BRANDING_COPY.tagline,
    logoUrl: null,
    logoMarkUrl: null,
    faviconUrl: null,
    loginHeadline: DEFAULT_BRANDING_COPY.loginHeadline,
    loginSubheadline: DEFAULT_BRANDING_COPY.loginSubheadline,
    loginHeroTitle: DEFAULT_BRANDING_COPY.loginHeroTitle,
    loginHeroBody: DEFAULT_BRANDING_COPY.loginHeroBody,
    signupHeadline: DEFAULT_BRANDING_COPY.signupHeadline,
    signupSubheadline: DEFAULT_BRANDING_COPY.signupSubheadline,
    signupHeroTitle: DEFAULT_BRANDING_COPY.signupHeroTitle,
    signupHeroBody: DEFAULT_BRANDING_COPY.signupHeroBody,
    supportEmail: null,
    supportUrl: null,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", sans-serif',
    radiusPx: 18,
    colors: { ...DEFAULT_BRANDING_COLORS },
  };
}
