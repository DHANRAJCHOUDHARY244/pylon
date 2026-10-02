import { Types } from 'mongoose';

import { NotFoundError, ValidationError } from '../utils/errors.js';
import { QuoteMessage } from '../models/quote-message.model.js';
import { ProposalSign } from '../models/proposal-sign.model.js';
import { Project } from '../models/project.model.js';
import { Customer } from '../models/customer.model.js';
import { Site } from '../models/site.model.js';
import { notificationService } from './notification.service.js';
import { emitToProject, emitToUser } from '../socket.js';

export class QuoteChatService {
  /** CRM inbox: all quote chat threads for the signed-in designer. */
  async listThreads(userId: string) {
    const projects = await Project.find({ createdBy: userId })
      .select('_id title status customerId updatedAt')
      .lean();
    if (projects.length === 0) return [];

    const projectIds = projects.map((p) => p._id);
    const grouped = await QuoteMessage.aggregate<{
      _id: Types.ObjectId;
      lastMessage: {
        body: string;
        author: string;
        authorName: string;
        createdAt: Date;
      };
      messageCount: number;
      unreadCount: number;
    }>([
      { $match: { projectId: { $in: projectIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$projectId',
          lastMessage: {
            $first: {
              body: '$body',
              author: '$author',
              authorName: '$authorName',
              createdAt: '$createdAt',
            },
          },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$author', 'customer'] },
                    { $eq: [{ $ifNull: ['$readByStaffAt', null] }, null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    const byId = new Map(grouped.map((g) => [String(g._id), g]));
    const customerIds = [...new Set(projects.map((p) => String(p.customerId)))];
    const [customers, sites, signs] = await Promise.all([
      Customer.find({ _id: { $in: customerIds } })
        .select('_id name email phone')
        .lean(),
      Site.find({ projectId: { $in: projectIds } })
        .select('projectId address')
        .lean(),
      ProposalSign.find({ projectId: { $in: projectIds } })
        .select('projectId token status viewCount lastViewedAt')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const customerById = new Map(customers.map((c) => [String(c._id), c]));
    const siteByProject = new Map(sites.map((s) => [String(s.projectId), s]));
    const signByProject = new Map<string, (typeof signs)[number]>();
    for (const s of signs) {
      const key = String(s.projectId);
      if (!signByProject.has(key)) signByProject.set(key, s);
    }

    const threads = projects
      .map((p) => {
        const id = String(p._id);
        const g = byId.get(id);
        if (!g) return null;
        const customer = customerById.get(String(p.customerId));
        const site = siteByProject.get(id);
        const sign = signByProject.get(id);
        return {
          projectId: id,
          title: p.title,
          status: p.status,
          customerName: customer?.name ?? 'Customer',
          customerEmail: customer?.email ?? null,
          customerPhone: customer?.phone ?? null,
          address: site?.address ?? null,
          messageCount: g.messageCount,
          unreadCount: g.unreadCount,
          lastMessage: {
            body: g.lastMessage.body,
            author: g.lastMessage.author,
            authorName: g.lastMessage.authorName,
            createdAt: g.lastMessage.createdAt,
          },
          signToken: sign?.token ?? null,
          signStatus: sign?.status ?? null,
          viewCount: Number(sign?.viewCount ?? 0),
          lastViewedAt: sign?.lastViewedAt ?? null,
          href: `/chats?project=${id}`,
          previewHref: `/proposals/${id}/preview`,
        };
      })
      .filter((t): t is NonNullable<typeof t> => t != null)
      .sort((a, b) => {
        const ta = new Date(a.lastMessage.createdAt).getTime();
        const tb = new Date(b.lastMessage.createdAt).getTime();
        return tb - ta;
      });

    return threads;
  }

  async markThreadRead(projectId: string, userId: string) {
    const project = await Project.findById(projectId);
    if (!project || String(project.createdBy) !== userId) {
      throw new NotFoundError('Project not found');
    }
    await QuoteMessage.updateMany(
      {
        projectId: project._id,
        author: 'customer',
        readByStaffAt: null,
      },
      { readByStaffAt: new Date() },
    );
    return { ok: true };
  }

  async listPublic(token: string) {
    const sign = await ProposalSign.findOne({ token });
    if (!sign) throw new NotFoundError('Signing link not found');
    const items = await QuoteMessage.find({ projectId: sign.projectId })
      .sort({ createdAt: 1 })
      .limit(200);
    return items.map((m) => m.toJSON());
  }

  async postPublic(
    token: string,
    body: { authorName?: string; message?: string },
  ) {
    const text = String(body.message ?? '').trim();
    if (!text) throw new ValidationError('Message is required');
    const sign = await ProposalSign.findOne({ token });
    if (!sign) throw new NotFoundError('Signing link not found');
    if (sign.expiresAt.getTime() < Date.now()) {
      throw new ValidationError('This signing link has expired');
    }

    const authorName = String(body.authorName || sign.customerName || 'Customer').trim();
    const msg = await QuoteMessage.create({
      projectId: sign.projectId,
      signToken: token,
      author: 'customer',
      authorName,
      body: text,
    });

    await notificationService.create({
      userId: String(sign.createdBy),
      kind: 'quote_chat',
      title: 'Customer message on quote',
      body: `${authorName}: ${text.slice(0, 120)}`,
      href: `/chats?project=${String(sign.projectId)}`,
      projectId: String(sign.projectId),
      meta: { token, messageId: String(msg._id) },
    });

    const payload = msg.toJSON();
    emitToUser(String(sign.createdBy), 'quote:chat', payload);
    emitToProject(String(sign.projectId), 'quote:chat', payload);

    return payload;
  }

  async listForProject(projectId: string, userId: string) {
    const project = await Project.findById(projectId);
    if (!project || String(project.createdBy) !== userId) {
      throw new NotFoundError('Project not found');
    }
    const items = await QuoteMessage.find({ projectId: new Types.ObjectId(projectId) })
      .sort({ createdAt: 1 })
      .limit(200);
    return items.map((m) => m.toJSON());
  }

  async postStaff(
    projectId: string,
    userId: string,
    body: { authorName?: string; message?: string },
  ) {
    const text = String(body.message ?? '').trim();
    if (!text) throw new ValidationError('Message is required');
    const project = await Project.findById(projectId);
    if (!project || String(project.createdBy) !== userId) {
      throw new NotFoundError('Project not found');
    }

    const msg = await QuoteMessage.create({
      projectId: project._id,
      author: 'staff',
      authorName: String(body.authorName || 'Designer').trim(),
      body: text,
      createdBy: new Types.ObjectId(userId),
      readByStaffAt: new Date(),
    });

    await QuoteMessage.updateMany(
      {
        projectId: project._id,
        author: 'customer',
        readByStaffAt: null,
      },
      { readByStaffAt: new Date() },
    );

    const payload = msg.toJSON();
    emitToProject(projectId, 'quote:chat', payload);
    emitToUser(userId, 'quote:chat', payload);
    return payload;
  }
}

export const quoteChatService = new QuoteChatService();
