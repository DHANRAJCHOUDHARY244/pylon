export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
} as const;

export const MESSAGES = {
  SUCCESS: 'Success',
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  RESOURCE: 'Resource',
  LOGIN_SUCCESS: 'Logged in successfully',
} as const;

export const COLLECTIONS = {
  USERS: 'users',
  CUSTOMERS: 'customers',
  PROJECTS: 'projects',
  SITES: 'sites',
  DESIGNS: 'designs',
  BRANDING: 'branding',
  LEADS: 'leads',
  DEALS: 'deals',
  TASKS: 'tasks',
  CALENDAR_EVENTS: 'calendar_events',
  CALENDAR_CONNECTIONS: 'calendar_connections',
  PANELS: 'panels',
  BATTERIES: 'batteries',
  INVERTERS: 'inverters',
} as const;

export const CALENDAR_PROVIDERS = ['google', 'outlook'] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];

export const CALENDAR_EVENT_SOURCES = ['local', 'google', 'outlook'] as const;
export type CalendarEventSource = (typeof CALENDAR_EVENT_SOURCES)[number];

export const DEAL_STAGES = [
  'new',
  'contacted',
  'quoted',
  'site_inspected',
  'awaiting_deposit',
  'won',
  'lost',
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const TASK_STATUSES = ['open', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export { DESIGN_SCHEMA_VERSION } from './design.js';

export const AUTH = {
  BEARER_PREFIX: 'Bearer ',
} as const;

export const PAGINATION: {
  DEFAULT_PAGE: number;
  DEFAULT_LIMIT: number;
  MAX_LIMIT: number;
} = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const DEFAULT_SORT: Record<string, 1 | -1> = {
  createdAt: -1,
};

export const DEFAULT_PAGINATION_LIMIT: number = PAGINATION.DEFAULT_LIMIT;
