import { Types } from 'mongoose';

import { DEAL_STAGES, PAGINATION } from '../constants/index.js';
import { omitUndefined } from '../helpers/object.js';
import { buildPaginatedResult, getPagination } from '../helpers/response.js';
import type { ICalendarEvent } from '../models/calendar-event.model.js';
import type { IDeal } from '../models/deal.model.js';
import type { ILead } from '../models/lead.model.js';
import type { ITask } from '../models/task.model.js';
import { calendarEventRepository } from '../repositories/calendar-event.repository.js';
import { customerRepository } from '../repositories/customer.repository.js';
import { dealRepository } from '../repositories/deal.repository.js';
import { leadRepository } from '../repositories/lead.repository.js';
import { taskRepository } from '../repositories/task.repository.js';
import { calendarOAuthService } from './calendar-oauth.service.js';
import type { PaginatedResult, PaginationQuery } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';

function oid(id: string | Types.ObjectId | null | undefined) {
  if (id == null || id === '') return null;
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

function ownerFilter(userId: string) {
  return { createdBy: new Types.ObjectId(userId) };
}

function serializeDoc(doc: { toJSON: () => unknown }) {
  return doc.toJSON() as Record<string, unknown>;
}

export class CrmService {
  /* ——— Leads ——— */
  async listLeads(userId: string, query: PaginationQuery & { q?: string; status?: string } = {}) {
    const { page, limit, skip } = getPagination(query.page ?? 1, query.limit ?? PAGINATION.DEFAULT_LIMIT);
    const [items, total] = await Promise.all([
      leadRepository.findByOwner(userId, skip, limit),
      leadRepository.countByOwner(userId),
    ]);
    let mapped = items.map((d) => serializeDoc(d));
    const q = (query.q ?? '').trim().toLowerCase();
    if (q) {
      mapped = mapped.filter((item) =>
        [item.name, item.email, item.phone, item.company, item.address]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    if (query.status) {
      mapped = mapped.filter((item) => item.status === query.status);
    }
    return buildPaginatedResult(mapped, mapped.length < total && q ? mapped.length : total, page, limit);
  }

  async createLead(userId: string, body: Partial<ILead>) {
    const doc = await leadRepository.create(
      omitUndefined({
        name: String(body.name),
        email: body.email || undefined,
        phone: body.phone || undefined,
        company: body.company || undefined,
        address: body.address || undefined,
        status: body.status ?? 'new',
        source: body.source || undefined,
        notes: body.notes || undefined,
        valueAud: body.valueAud,
        createdBy: userId,
      }),
    );
    return serializeDoc(doc);
  }

  async updateLead(userId: string, id: string, body: Partial<ILead>) {
    const existing = await leadRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Lead');
    const updated = await leadRepository.updateById(
      id,
      omitUndefined({
        ...body,
        email: body.email === '' ? undefined : body.email,
      }) as never,
    );
    return serializeDoc(updated!);
  }

  async deleteLead(userId: string, id: string) {
    const existing = await leadRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Lead');
    await leadRepository.deleteById(id);
  }

  async getLead(userId: string, id: string) {
    const lead = await leadRepository.findById(id);
    if (!lead || String(lead.createdBy) !== userId) throw new NotFoundError('Lead');

    const [deals, tasks, events] = await Promise.all([
      dealRepository.findByOwner(userId, 0, 100),
      taskRepository.findByOwner(userId, 0, 100),
      calendarEventRepository.findByOwner(userId, 0, 100),
    ]);

    const leadId = String(lead._id);
    return {
      ...serializeDoc(lead),
      related: {
        deals: deals
          .filter((d) => d.leadId && String(d.leadId) === leadId)
          .map((d) => serializeDoc(d)),
        tasks: tasks
          .filter((d) => d.leadId && String(d.leadId) === leadId)
          .map((d) => serializeDoc(d)),
        events: events
          .filter((d) => d.leadId && String(d.leadId) === leadId)
          .map((d) => serializeDoc(d)),
      },
    };
  }

  async convertLead(
    userId: string,
    id: string,
    body: { title?: string; valueAud?: number; createContact?: boolean } = {},
  ) {
    const lead = await leadRepository.findById(id);
    if (!lead || String(lead.createdBy) !== userId) throw new NotFoundError('Lead');

    let customerId: Types.ObjectId | null = null;
    if (body.createContact !== false && lead.email) {
      const existingContacts = await customerRepository.findMany({
        filter: ownerFilter(userId) as never,
        skip: 0,
        limit: 200,
      });
      const match = existingContacts.find(
        (c) => c.email.toLowerCase() === String(lead.email).toLowerCase(),
      );
      if (match) {
        customerId = match._id as Types.ObjectId;
      } else {
        const created = await customerRepository.create(
          omitUndefined({
            name: lead.name,
            email: String(lead.email),
            phone: lead.phone || undefined,
            createdBy: new Types.ObjectId(userId),
          }),
        );
        customerId = created._id as Types.ObjectId;
      }
    }

    const deal = await dealRepository.create(
      omitUndefined({
        title: body.title?.trim() || `${lead.name} — opportunity`,
        stage: 'new' as const,
        valueAud: body.valueAud ?? lead.valueAud ?? 0,
        contactName: lead.name,
        contactEmail: lead.email || undefined,
        contactPhone: lead.phone || undefined,
        address: lead.address || undefined,
        leadId: lead._id,
        customerId,
        notes: lead.notes || undefined,
        createdBy: userId,
      }),
    );

    await leadRepository.updateById(id, { status: 'converted' });
    return {
      lead: serializeDoc(lead),
      deal: serializeDoc(deal),
      contactId: customerId ? String(customerId) : null,
    };
  }

  async searchWorkspace(userId: string, qRaw: string) {
    const q = qRaw.trim().toLowerCase();
    if (!q) {
      return { leads: [], deals: [], contacts: [], tasks: [], events: [] };
    }

    const [leads, deals, contacts, tasks, events] = await Promise.all([
      leadRepository.findByOwner(userId, 0, 50),
      dealRepository.findByOwner(userId, 0, 50),
      customerRepository.findMany({
        filter: ownerFilter(userId) as never,
        skip: 0,
        limit: 50,
        sort: { createdAt: -1 },
      }),
      taskRepository.findByOwner(userId, 0, 50),
      calendarEventRepository.findByOwner(userId, 0, 50),
    ]);

    const match = (...vals: unknown[]) =>
      vals.filter(Boolean).some((v) => String(v).toLowerCase().includes(q));

    return {
      leads: leads
        .filter((d) => match(d.name, d.email, d.phone, d.company, d.address))
        .slice(0, 8)
        .map((d) => serializeDoc(d)),
      deals: deals
        .filter((d) => match(d.title, d.contactName, d.contactEmail, d.address))
        .slice(0, 8)
        .map((d) => serializeDoc(d)),
      contacts: contacts
        .filter((d) => match(d.name, d.email, d.phone))
        .slice(0, 8)
        .map((d) => serializeDoc(d)),
      tasks: tasks
        .filter((d) => match(d.title, d.notes))
        .slice(0, 8)
        .map((d) => serializeDoc(d)),
      events: events
        .filter((d) => match(d.title, d.location, d.notes))
        .slice(0, 8)
        .map((d) => serializeDoc(d)),
    };
  }

  /* ——— Deals ——— */
  async listDeals(userId: string, query: PaginationQuery & { q?: string; stage?: string } = {}) {
    const items = await dealRepository.findByOwner(userId, 0, 200);
    let mapped = items.map((d) => serializeDoc(d));
    const q = (query.q ?? '').trim().toLowerCase();
    if (q) {
      mapped = mapped.filter((item) =>
        [item.title, item.contactName, item.contactEmail, item.address]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    if (query.stage) {
      mapped = mapped.filter((item) => item.stage === query.stage);
    }
    return { items: mapped, stages: DEAL_STAGES };
  }

  async createDeal(userId: string, body: Partial<IDeal> & { expectedCloseAt?: string | null }) {
    const doc = await dealRepository.create(
      omitUndefined({
        title: String(body.title),
        stage: body.stage ?? 'new',
        valueAud: body.valueAud ?? 0,
        contactName: body.contactName || undefined,
        contactEmail: body.contactEmail || undefined,
        contactPhone: body.contactPhone || undefined,
        address: body.address || undefined,
        leadId: oid(body.leadId as string | null | undefined),
        customerId: oid(body.customerId as string | null | undefined),
        projectId: oid(body.projectId as string | null | undefined),
        expectedCloseAt: body.expectedCloseAt ? new Date(body.expectedCloseAt) : null,
        notes: body.notes || undefined,
        starred: body.starred ?? false,
        lostReason: body.lostReason || undefined,
        quote: body.quote ?? null,
        createdBy: userId,
      }),
    );
    return serializeDoc(doc);
  }

  async updateDeal(userId: string, id: string, body: Partial<IDeal> & { expectedCloseAt?: string | null }) {
    const existing = await dealRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Deal');
    const patch: Record<string, unknown> = { ...body };
    if ('leadId' in body) patch.leadId = oid(body.leadId as string | null | undefined);
    if ('customerId' in body) patch.customerId = oid(body.customerId as string | null | undefined);
    if ('projectId' in body) patch.projectId = oid(body.projectId as string | null | undefined);
    if ('expectedCloseAt' in body) {
      patch.expectedCloseAt = body.expectedCloseAt ? new Date(String(body.expectedCloseAt)) : null;
    }
    if (body.contactEmail === '') patch.contactEmail = undefined;
    if ('quote' in body) patch.quote = body.quote ?? null;
    const updated = await dealRepository.updateById(id, omitUndefined(patch) as never);
    return serializeDoc(updated!);
  }

  /**
   * Upsert a Quoted deal from a Library project quote snapshot.
   * Also upserts a Lead (and Contact when email is present) so every quote field lands in CRM.
   */
  async syncQuoteToCrm(
    userId: string,
    body: {
      projectId: string;
      title: string;
      stage?: IDeal['stage'];
      valueAud?: number;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
      address?: string;
      customerId?: string | null;
      createLead?: boolean;
      notes?: string;
      quote: NonNullable<IDeal['quote']>;
    },
  ) {
    const quote = {
      ...body.quote,
      syncedAt: body.quote.syncedAt || new Date().toISOString(),
    };
    const valueAud =
      body.valueAud ??
      quote.totalInclGstAud ??
      quote.subtotalInclGstAud ??
      quote.listPriceAud ??
      0;

    let customerId = oid(body.customerId);
    const email = body.contactEmail?.trim();
    if (!customerId && email) {
      const existingContacts = await customerRepository.findMany({
        filter: ownerFilter(userId) as never,
        skip: 0,
        limit: 200,
      });
      const match = existingContacts.find((c) => c.email.toLowerCase() === email.toLowerCase());
      if (match) {
        customerId = match._id as Types.ObjectId;
        if (body.contactName || body.contactPhone) {
          await customerRepository.updateById(
            String(match._id),
            omitUndefined({
              name: body.contactName || match.name,
              phone: body.contactPhone || match.phone,
            }) as never,
          );
        }
      } else if (body.contactName) {
        const created = await customerRepository.create(
          omitUndefined({
            name: body.contactName,
            email,
            phone: body.contactPhone || undefined,
            createdBy: new Types.ObjectId(userId),
          }),
        );
        customerId = created._id as Types.ObjectId;
      }
    }

    let leadId: Types.ObjectId | null = null;
    if (body.createLead !== false && body.contactName) {
      const leads = await leadRepository.findByOwner(userId, 0, 200);
      const existingLead = leads.find((l) => {
        if (email && l.email && l.email.toLowerCase() === email.toLowerCase()) return true;
        if (body.address && l.address && l.address.toLowerCase() === body.address.toLowerCase()) {
          return l.name.toLowerCase() === body.contactName!.toLowerCase();
        }
        return false;
      });
      if (existingLead) {
        leadId = existingLead._id as Types.ObjectId;
        await leadRepository.updateById(
          String(existingLead._id),
          omitUndefined({
            name: body.contactName,
            email: email || existingLead.email,
            phone: body.contactPhone || existingLead.phone,
            address: body.address || existingLead.address,
            status: existingLead.status === 'converted' ? 'converted' : 'qualified',
            source: existingLead.source || 'proposal_quote',
            notes: body.notes || existingLead.notes,
            valueAud,
          }) as never,
        );
      } else {
        const createdLead = await leadRepository.create(
          omitUndefined({
            name: body.contactName,
            email: email || undefined,
            phone: body.contactPhone || undefined,
            address: body.address || undefined,
            status: 'qualified',
            source: 'proposal_quote',
            notes: body.notes || undefined,
            valueAud,
            createdBy: userId,
          }),
        );
        leadId = createdLead._id as Types.ObjectId;
      }
    }

    const existingDeal = await dealRepository.findByOwnerAndProject(userId, body.projectId);
    const dealPayload = omitUndefined({
      title: body.title,
      stage: body.stage ?? 'quoted',
      valueAud,
      contactName: body.contactName || undefined,
      contactEmail: email || undefined,
      contactPhone: body.contactPhone || undefined,
      address: body.address || undefined,
      leadId,
      customerId,
      projectId: oid(body.projectId),
      notes: body.notes || undefined,
      quote,
    });

    const deal = existingDeal
      ? await dealRepository.updateById(String(existingDeal._id), dealPayload as never)
      : await dealRepository.create({
          ...dealPayload,
          title: body.title,
          createdBy: userId,
        } as never);

    if (leadId) {
      await leadRepository.updateById(String(leadId), { status: 'converted' });
    }

    return {
      deal: serializeDoc(deal!),
      leadId: leadId ? String(leadId) : null,
      contactId: customerId ? String(customerId) : null,
      created: !existingDeal,
    };
  }

  async deleteDeal(userId: string, id: string) {
    const existing = await dealRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Deal');
    await dealRepository.deleteById(id);
  }

  /* ——— Contacts (customers) ——— */
  async listContacts(userId: string, query: PaginationQuery & { q?: string } = {}) {
    const { page, limit, skip } = getPagination(query.page ?? 1, query.limit ?? PAGINATION.DEFAULT_LIMIT);
    const all = await customerRepository.findMany({
      filter: ownerFilter(userId) as never,
      skip: 0,
      limit: 200,
      sort: { createdAt: -1 },
    });
    let mapped = all.map((d) => serializeDoc(d));
    const q = (query.q ?? '').trim().toLowerCase();
    if (q) {
      mapped = mapped.filter((item) =>
        [item.name, item.email, item.phone]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)),
      );
    }
    const slice = mapped.slice(skip, skip + limit);
    return buildPaginatedResult(slice, mapped.length, page, limit);
  }

  async createContact(userId: string, body: { name: string; email: string; phone?: string }) {
    const doc = await customerRepository.create(
      omitUndefined({
        name: body.name,
        email: body.email,
        phone: body.phone || undefined,
        createdBy: new Types.ObjectId(userId),
      }),
    );
    return serializeDoc(doc);
  }

  async updateContact(userId: string, id: string, body: { name?: string; email?: string; phone?: string }) {
    const existing = await customerRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Contact');
    const updated = await customerRepository.updateById(id, omitUndefined(body) as never);
    return serializeDoc(updated!);
  }

  async deleteContact(userId: string, id: string) {
    const existing = await customerRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Contact');
    await customerRepository.deleteById(id);
  }

  /* ——— Tasks ——— */
  async listTasks(userId: string, query: PaginationQuery & { status?: string } = {}) {
    const { page, limit, skip } = getPagination(query.page ?? 1, query.limit ?? PAGINATION.DEFAULT_LIMIT);
    const [items, total] = await Promise.all([
      taskRepository.findByOwner(userId, skip, limit),
      taskRepository.countByOwner(userId, query.status ? { status: query.status } : {}),
    ]);
    let mapped = items.map((d) => serializeDoc(d));
    if (query.status) mapped = mapped.filter((i) => i.status === query.status);
    return buildPaginatedResult(mapped, total, page, limit);
  }

  async createTask(userId: string, body: Partial<ITask> & { dueAt?: string | null }) {
    const doc = await taskRepository.create(
      omitUndefined({
        title: String(body.title),
        status: body.status ?? 'open',
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        notes: body.notes || undefined,
        dealId: oid(body.dealId as string | null | undefined),
        leadId: oid(body.leadId as string | null | undefined),
        createdBy: userId,
      }),
    );
    return serializeDoc(doc);
  }

  async updateTask(userId: string, id: string, body: Partial<ITask> & { dueAt?: string | null }) {
    const existing = await taskRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Task');
    const patch: Record<string, unknown> = { ...body };
    if ('dueAt' in body) patch.dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;
    if ('dealId' in body) patch.dealId = oid(body.dealId as string | null | undefined);
    if ('leadId' in body) patch.leadId = oid(body.leadId as string | null | undefined);
    const updated = await taskRepository.updateById(id, omitUndefined(patch) as never);
    return serializeDoc(updated!);
  }

  async deleteTask(userId: string, id: string) {
    const existing = await taskRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Task');
    await taskRepository.deleteById(id);
  }

  /* ——— Calendar ——— */
  async listEvents(
    userId: string,
    query: PaginationQuery & { from?: string; to?: string } = {},
  ): Promise<PaginatedResult<Record<string, unknown>> | { items: Record<string, unknown>[] }> {
    if (query.from && query.to) {
      const items = await calendarEventRepository.findByOwnerInRange(
        userId,
        new Date(query.from),
        new Date(query.to),
      );
      return { items: items.map((d) => serializeDoc(d)) };
    }
    const { page, limit, skip } = getPagination(query.page ?? 1, query.limit ?? PAGINATION.DEFAULT_LIMIT);
    const [items, total] = await Promise.all([
      calendarEventRepository.findByOwner(userId, skip, limit),
      calendarEventRepository.countByOwner(userId),
    ]);
    return buildPaginatedResult(
      items.map((d) => serializeDoc(d)),
      total,
      page,
      limit,
    );
  }

  async createEvent(userId: string, body: Partial<ICalendarEvent> & { startsAt: string; endsAt: string }) {
    const doc = await calendarEventRepository.create(
      omitUndefined({
        title: String(body.title),
        startsAt: new Date(body.startsAt),
        endsAt: new Date(body.endsAt),
        allDay: body.allDay ?? false,
        location: body.location || undefined,
        notes: body.notes || undefined,
        dealId: oid(body.dealId as string | null | undefined),
        leadId: oid(body.leadId as string | null | undefined),
        source: 'local' as const,
        createdBy: userId,
      }),
    );
    const serialized = serializeDoc(doc);

    try {
      await calendarOAuthService.pushLocalEvent(
        userId,
        omitUndefined({
          title: String(body.title),
          startsAt: new Date(body.startsAt),
          endsAt: new Date(body.endsAt),
          location: body.location || undefined,
          notes: body.notes || undefined,
          allDay: body.allDay ?? false,
        }),
      );
    } catch {
      /* external push is best-effort */
    }

    return serialized;
  }

  async updateEvent(
    userId: string,
    id: string,
    body: Partial<ICalendarEvent> & { startsAt?: string; endsAt?: string },
  ) {
    const existing = await calendarEventRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Calendar event');
    const patch: Record<string, unknown> = { ...body };
    if (body.startsAt) patch.startsAt = new Date(body.startsAt);
    if (body.endsAt) patch.endsAt = new Date(body.endsAt);
    if ('dealId' in body) patch.dealId = oid(body.dealId as string | null | undefined);
    if ('leadId' in body) patch.leadId = oid(body.leadId as string | null | undefined);
    const updated = await calendarEventRepository.updateById(id, omitUndefined(patch) as never);
    return serializeDoc(updated!);
  }

  async deleteEvent(userId: string, id: string) {
    const existing = await calendarEventRepository.findById(id);
    if (!existing || String(existing.createdBy) !== userId) throw new NotFoundError('Calendar event');
    await calendarEventRepository.deleteById(id);
  }

  /* ——— Reporting ——— */
  async reportingSummary(userId: string) {
    const [leads, deals, tasks, contacts, events] = await Promise.all([
      leadRepository.countByOwner(userId),
      dealRepository.findByOwner(userId, 0, 500),
      taskRepository.countByOwner(userId, { status: 'open' }),
      customerRepository.count(ownerFilter(userId) as never),
      calendarEventRepository.countByOwner(userId),
    ]);

    const byStage: Record<string, { count: number; valueAud: number }> = {};
    for (const stage of DEAL_STAGES) {
      byStage[stage] = { count: 0, valueAud: 0 };
    }
    let pipelineValue = 0;
    let wonValue = 0;
    let lostCount = 0;
    for (const deal of deals) {
      const stage = deal.stage;
      if (!byStage[stage]) byStage[stage] = { count: 0, valueAud: 0 };
      byStage[stage]!.count += 1;
      byStage[stage]!.valueAud += deal.valueAud ?? 0;
      if (stage === 'won') wonValue += deal.valueAud ?? 0;
      else if (stage === 'lost') lostCount += 1;
      else pipelineValue += deal.valueAud ?? 0;
    }

    return {
      leads,
      contacts,
      openTasks: tasks,
      calendarEvents: events,
      deals: deals.length,
      pipelineValueAud: pipelineValue,
      wonValueAud: wonValue,
      lostDeals: lostCount,
      byStage,
    };
  }
}

export const crmService = new CrmService();
