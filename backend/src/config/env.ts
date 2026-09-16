import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /** Google Calendar OAuth (optional — connect UI disabled until set). */
  GOOGLE_CALENDAR_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_CALENDAR_REDIRECT_URI: z
    .string()
    .optional()
    .default('http://localhost:5000/api/v1/crm/calendar/oauth/google/callback'),
  /** Microsoft / Outlook Calendar OAuth (optional). */
  MICROSOFT_CALENDAR_CLIENT_ID: z.string().optional().default(''),
  MICROSOFT_CALENDAR_CLIENT_SECRET: z.string().optional().default(''),
  MICROSOFT_CALENDAR_REDIRECT_URI: z
    .string()
    .optional()
    .default('http://localhost:5000/api/v1/crm/calendar/oauth/outlook/callback'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${details}`);
  }

  return parsed.data;
}
