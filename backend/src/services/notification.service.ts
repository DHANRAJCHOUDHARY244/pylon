import { Notification, type INotification, type NotificationKind } from '../models/notification.model.js';
import { emitToUser } from '../socket.js';

export class NotificationService {
  async create(input: {
    userId: string;
    kind: NotificationKind;
    title: string;
    body: string;
    href?: string | null;
    projectId?: string | null;
    meta?: Record<string, unknown>;
  }) {
    const doc = await Notification.create({
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      projectId: input.projectId ?? null,
      meta: input.meta ?? {},
    });
    const json = doc.toJSON() as INotification & { id: string };
    emitToUser(input.userId, 'notification:new', json);
    return json;
  }

  async listForUser(userId: string, opts?: { unreadOnly?: boolean; limit?: number }) {
    const filter: Record<string, unknown> = { userId };
    if (opts?.unreadOnly) filter.readAt = null;
    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(opts?.limit ?? 40, 100))
      .lean({ virtuals: true });
    const unreadCount = await Notification.countDocuments({ userId, readAt: null });
    return {
      items: items.map((row) => ({
        ...row,
        id: String(row._id),
      })),
      unreadCount,
    };
  }

  async markRead(userId: string, notificationId: string) {
    const doc = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { readAt: new Date() },
      { new: true },
    );
    return doc?.toJSON() ?? null;
  }

  async markAllRead(userId: string) {
    await Notification.updateMany({ userId, readAt: null }, { readAt: new Date() });
    return { ok: true };
  }
}

export const notificationService = new NotificationService();
