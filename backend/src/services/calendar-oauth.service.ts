import jwt from 'jsonwebtoken';

import { env } from '../config/index.js';
import {
  CALENDAR_PROVIDERS,
  HTTP_STATUS,
  type CalendarProvider,
} from '../constants/index.js';
import { omitUndefined } from '../helpers/object.js';
import { calendarConnectionRepository } from '../repositories/calendar-connection.repository.js';
import { calendarEventRepository } from '../repositories/calendar-event.repository.js';
import { AppError, NotFoundError, ValidationError } from '../utils/errors.js';

type OAuthState = {
  sub: string;
  provider: CalendarProvider;
  typ: 'cal_oauth';
};

type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | null;
  scope?: string;
  email?: string;
};

type ExternalEvent = {
  externalId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
};

function isProvider(value: string): value is CalendarProvider {
  return (CALENDAR_PROVIDERS as readonly string[]).includes(value);
}

function providerConfigured(provider: CalendarProvider): boolean {
  if (provider === 'google') {
    return Boolean(env.GOOGLE_CALENDAR_CLIENT_ID && env.GOOGLE_CALENDAR_CLIENT_SECRET);
  }
  return Boolean(env.MICROSOFT_CALENDAR_CLIENT_ID && env.MICROSOFT_CALENDAR_CLIENT_SECRET);
}

function requireConfigured(provider: CalendarProvider) {
  if (!providerConfigured(provider)) {
    throw new ValidationError(
      provider === 'google'
        ? 'Google Calendar is not configured. Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET.'
        : 'Outlook Calendar is not configured. Set MICROSOFT_CALENDAR_CLIENT_ID and MICROSOFT_CALENDAR_CLIENT_SECRET.',
    );
  }
}

function signOAuthState(userId: string, provider: CalendarProvider): string {
  return jwt.sign({ sub: userId, provider, typ: 'cal_oauth' } satisfies OAuthState, env.JWT_SECRET, {
    expiresIn: '15m',
  });
}

function verifyOAuthState(state: string): OAuthState {
  const payload = jwt.verify(state, env.JWT_SECRET) as OAuthState;
  if (payload.typ !== 'cal_oauth' || !payload.sub || !isProvider(payload.provider)) {
    throw new ValidationError('Invalid OAuth state');
  }
  return payload;
}

async function exchangeGoogleCode(code: string): Promise<TokenBundle> {
  const body = new URLSearchParams({
    code,
    client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
    client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_CALENDAR_REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new AppError(
      typeof json.error_description === 'string' ? json.error_description : 'Google token exchange failed',
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  const accessToken = String(json.access_token ?? '');
  const refreshToken = typeof json.refresh_token === 'string' ? json.refresh_token : undefined;
  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  const scope = typeof json.scope === 'string' ? json.scope : undefined;

  let email: string | undefined;
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { email?: string };
      email = profile.email;
    }
  } catch {
    /* optional */
  }

  return omitUndefined({
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    scope,
    email,
  }) as TokenBundle;
}

async function exchangeOutlookCode(code: string): Promise<TokenBundle> {
  const body = new URLSearchParams({
    code,
    client_id: env.MICROSOFT_CALENDAR_CLIENT_ID,
    client_secret: env.MICROSOFT_CALENDAR_CLIENT_SECRET,
    redirect_uri: env.MICROSOFT_CALENDAR_REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new AppError(
      typeof json.error_description === 'string' ? json.error_description : 'Outlook token exchange failed',
      HTTP_STATUS.BAD_REQUEST,
    );
  }
  const accessToken = String(json.access_token ?? '');
  const refreshToken = typeof json.refresh_token === 'string' ? json.refresh_token : undefined;
  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  const scope = typeof json.scope === 'string' ? json.scope : undefined;

  let email: string | undefined;
  try {
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (profileRes.ok) {
      const profile = (await profileRes.json()) as { mail?: string; userPrincipalName?: string };
      email = profile.mail || profile.userPrincipalName;
    }
  } catch {
    /* optional */
  }

  return omitUndefined({
    accessToken,
    refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    scope,
    email,
  }) as TokenBundle;
}

async function refreshGoogleToken(refreshToken: string): Promise<TokenBundle> {
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CALENDAR_CLIENT_ID,
    client_secret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new AppError('Google token refresh failed — reconnect Google Calendar', HTTP_STATUS.UNAUTHORIZED);
  }
  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  return omitUndefined({
    accessToken: String(json.access_token ?? ''),
    refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    scope: typeof json.scope === 'string' ? json.scope : undefined,
  }) as TokenBundle;
}

async function refreshOutlookToken(refreshToken: string): Promise<TokenBundle> {
  const body = new URLSearchParams({
    client_id: env.MICROSOFT_CALENDAR_CLIENT_ID,
    client_secret: env.MICROSOFT_CALENDAR_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new AppError('Outlook token refresh failed — reconnect Outlook Calendar', HTTP_STATUS.UNAUTHORIZED);
  }
  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600;
  return omitUndefined({
    accessToken: String(json.access_token ?? ''),
    refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : refreshToken,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
    scope: typeof json.scope === 'string' ? json.scope : undefined,
  }) as TokenBundle;
}

async function fetchGoogleEvents(accessToken: string): Promise<ExternalEvent[]> {
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('maxResults', '100');

  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const json = (await res.json()) as {
    items?: Array<{
      id?: string;
      summary?: string;
      description?: string;
      location?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new AppError(json.error?.message ?? 'Failed to fetch Google Calendar events', HTTP_STATUS.BAD_REQUEST);
  }

  return (json.items ?? [])
    .filter((item) => item.id)
    .map((item) => {
      const allDay = Boolean(item.start?.date && !item.start?.dateTime);
      const startsAt = new Date(item.start?.dateTime ?? item.start?.date ?? Date.now());
      const endsAt = new Date(item.end?.dateTime ?? item.end?.date ?? startsAt.getTime() + 3600000);
      return omitUndefined({
        externalId: String(item.id),
        title: item.summary?.trim() || 'Untitled event',
        startsAt,
        endsAt,
        allDay,
        location: item.location,
        notes: item.description,
      }) as ExternalEvent;
    });
}

async function fetchOutlookEvents(accessToken: string): Promise<ExternalEvent[]> {
  const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const end = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
  const url =
    `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${encodeURIComponent(start)}` +
    `&endDateTime=${encodeURIComponent(end)}&$top=100&$orderby=start/dateTime`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'outlook.timezone="UTC"',
    },
  });
  const json = (await res.json()) as {
    value?: Array<{
      id?: string;
      subject?: string;
      bodyPreview?: string;
      location?: { displayName?: string };
      isAllDay?: boolean;
      start?: { dateTime?: string };
      end?: { dateTime?: string };
    }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new AppError(json.error?.message ?? 'Failed to fetch Outlook Calendar events', HTTP_STATUS.BAD_REQUEST);
  }

  return (json.value ?? [])
    .filter((item) => item.id)
    .map((item) => {
      const startsAt = new Date(`${item.start?.dateTime ?? ''}Z`.replace('ZZ', 'Z'));
      const endsAt = new Date(`${item.end?.dateTime ?? ''}Z`.replace('ZZ', 'Z'));
      return omitUndefined({
        externalId: String(item.id),
        title: item.subject?.trim() || 'Untitled event',
        startsAt: Number.isNaN(startsAt.getTime()) ? new Date() : startsAt,
        endsAt: Number.isNaN(endsAt.getTime()) ? new Date(Date.now() + 3600000) : endsAt,
        allDay: Boolean(item.isAllDay),
        location: item.location?.displayName,
        notes: item.bodyPreview,
      }) as ExternalEvent;
    });
}

async function pushGoogleEvent(
  accessToken: string,
  event: { title: string; startsAt: Date; endsAt: Date; location?: string; notes?: string; allDay?: boolean },
): Promise<string | null> {
  const body = event.allDay
    ? {
        summary: event.title,
        description: event.notes,
        location: event.location,
        start: { date: event.startsAt.toISOString().slice(0, 10) },
        end: { date: event.endsAt.toISOString().slice(0, 10) },
      }
    : {
        summary: event.title,
        description: event.notes,
        location: event.location,
        start: { dateTime: event.startsAt.toISOString() },
        end: { dateTime: event.endsAt.toISOString() },
      };
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ?? null;
}

async function pushOutlookEvent(
  accessToken: string,
  event: { title: string; startsAt: Date; endsAt: Date; location?: string; notes?: string; allDay?: boolean },
): Promise<string | null> {
  const body = {
    subject: event.title,
    body: event.notes ? { contentType: 'Text', content: event.notes } : undefined,
    location: event.location ? { displayName: event.location } : undefined,
    isAllDay: Boolean(event.allDay),
    start: {
      dateTime: event.startsAt.toISOString().replace(/\.\d{3}Z$/, ''),
      timeZone: 'UTC',
    },
    end: {
      dateTime: event.endsAt.toISOString().replace(/\.\d{3}Z$/, ''),
      timeZone: 'UTC',
    },
  };
  const res = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { id?: string };
  return json.id ?? null;
}

export class CalendarOAuthService {
  providerStatus() {
    return {
      google: { configured: providerConfigured('google') },
      outlook: { configured: providerConfigured('outlook') },
    };
  }

  async listConnections(userId: string) {
    const docs = await calendarConnectionRepository.findByOwner(userId);
    const status = this.providerStatus();
    return {
      google: {
        configured: status.google.configured,
        connected: docs.some((d) => d.provider === 'google'),
        email: docs.find((d) => d.provider === 'google')?.email,
        lastSyncedAt: docs.find((d) => d.provider === 'google')?.lastSyncedAt ?? null,
      },
      outlook: {
        configured: status.outlook.configured,
        connected: docs.some((d) => d.provider === 'outlook'),
        email: docs.find((d) => d.provider === 'outlook')?.email,
        lastSyncedAt: docs.find((d) => d.provider === 'outlook')?.lastSyncedAt ?? null,
      },
    };
  }

  getAuthUrl(userId: string, provider: string) {
    if (!isProvider(provider)) throw new ValidationError('Provider must be google or outlook');
    requireConfigured(provider);
    const state = signOAuthState(userId, provider);

    if (provider === 'google') {
      const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      url.searchParams.set('client_id', env.GOOGLE_CALENDAR_CLIENT_ID);
      url.searchParams.set('redirect_uri', env.GOOGLE_CALENDAR_REDIRECT_URI);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('scope', 'openid email profile https://www.googleapis.com/auth/calendar.events');
      url.searchParams.set('access_type', 'offline');
      url.searchParams.set('prompt', 'consent');
      url.searchParams.set('state', state);
      return { url: url.toString(), provider };
    }

    const url = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    url.searchParams.set('client_id', env.MICROSOFT_CALENDAR_CLIENT_ID);
    url.searchParams.set('redirect_uri', env.MICROSOFT_CALENDAR_REDIRECT_URI);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('response_mode', 'query');
    url.searchParams.set('scope', 'openid profile email offline_access User.Read Calendars.ReadWrite');
    url.searchParams.set('state', state);
    return { url: url.toString(), provider };
  }

  frontendRedirect(provider: CalendarProvider, ok: boolean, message?: string) {
    const url = new URL('/calendar', env.FRONTEND_URL);
    if (ok) url.searchParams.set('connected', provider);
    else url.searchParams.set('calendar_error', message ?? 'Calendar connection failed');
    return url.toString();
  }

  async handleOAuthCallback(providerParam: string, code: string | undefined, state: string | undefined, error?: string) {
    if (!isProvider(providerParam)) {
      return this.frontendRedirect('google', false, 'Unknown calendar provider');
    }
    if (error) {
      return this.frontendRedirect(providerParam, false, error);
    }
    if (!code || !state) {
      return this.frontendRedirect(providerParam, false, 'Missing OAuth code or state');
    }

    try {
      requireConfigured(providerParam);
      const payload = verifyOAuthState(state);
      if (payload.provider !== providerParam) {
        return this.frontendRedirect(providerParam, false, 'OAuth state provider mismatch');
      }

      const tokens =
        providerParam === 'google' ? await exchangeGoogleCode(code) : await exchangeOutlookCode(code);

      await calendarConnectionRepository.upsertForOwner(
        payload.sub,
        providerParam,
        omitUndefined({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
          scope: tokens.scope,
          email: tokens.email,
        }),
      );

      return this.frontendRedirect(providerParam, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Calendar connection failed';
      return this.frontendRedirect(providerParam, false, message);
    }
  }

  private async getValidAccessToken(userId: string, provider: CalendarProvider): Promise<string> {
    const conn = await calendarConnectionRepository.findByOwnerAndProvider(userId, provider);
    if (!conn) throw new NotFoundError(`${provider === 'google' ? 'Google' : 'Outlook'} Calendar connection`);

    const needsRefresh =
      conn.expiresAt != null && conn.expiresAt.getTime() < Date.now() + 60_000 && Boolean(conn.refreshToken);

    if (!needsRefresh) return conn.accessToken;

    const refreshed =
      provider === 'google'
        ? await refreshGoogleToken(conn.refreshToken!)
        : await refreshOutlookToken(conn.refreshToken!);

    await calendarConnectionRepository.updateById(
      String(conn._id),
      omitUndefined({
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        expiresAt: refreshed.expiresAt,
        scope: refreshed.scope,
      }),
    );
    return refreshed.accessToken;
  }

  async syncProvider(userId: string, provider: string) {
    if (!isProvider(provider)) throw new ValidationError('Provider must be google or outlook');
    requireConfigured(provider);
    const accessToken = await this.getValidAccessToken(userId, provider);
    const events =
      provider === 'google' ? await fetchGoogleEvents(accessToken) : await fetchOutlookEvents(accessToken);

    let imported = 0;
    for (const event of events) {
      await calendarEventRepository.upsertExternal(
        userId,
        provider,
        event.externalId,
        omitUndefined({
          title: event.title,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          allDay: event.allDay,
          location: event.location,
          notes: event.notes,
        }),
      );
      imported += 1;
    }

    const conn = await calendarConnectionRepository.findByOwnerAndProvider(userId, provider);
    if (conn) {
      await calendarConnectionRepository.updateById(String(conn._id), { lastSyncedAt: new Date() });
    }

    return { provider, imported, lastSyncedAt: new Date().toISOString() };
  }

  async disconnect(userId: string, provider: string) {
    if (!isProvider(provider)) throw new ValidationError('Provider must be google or outlook');
    const removed = await calendarConnectionRepository.deleteByOwnerAndProvider(userId, provider);
    if (!removed) throw new NotFoundError('Calendar connection');
    return { provider, disconnected: true };
  }

  /** Best-effort push of a local CRM event to connected calendars. */
  async pushLocalEvent(
    userId: string,
    event: {
      title: string;
      startsAt: Date;
      endsAt: Date;
      location?: string;
      notes?: string;
      allDay?: boolean;
    },
  ) {
    const connections = await calendarConnectionRepository.findByOwner(userId);
    const results: Array<{ provider: CalendarProvider; externalId: string | null }> = [];

    for (const conn of connections) {
      try {
        const accessToken = await this.getValidAccessToken(userId, conn.provider);
        const externalId =
          conn.provider === 'google'
            ? await pushGoogleEvent(accessToken, event)
            : await pushOutlookEvent(accessToken, event);
        results.push({ provider: conn.provider, externalId });
      } catch {
        results.push({ provider: conn.provider, externalId: null });
      }
    }

    return results;
  }
}

export const calendarOAuthService = new CalendarOAuthService();
