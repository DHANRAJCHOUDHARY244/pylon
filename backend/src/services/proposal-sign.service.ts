import { Types } from 'mongoose';

import { NotFoundError, ValidationError } from '../utils/errors.js';
import { ProposalSign, type SignStep } from '../models/proposal-sign.model.js';
import { Project } from '../models/project.model.js';
import { Customer } from '../models/customer.model.js';
import { Site } from '../models/site.model.js';
import { Design } from '../models/design.model.js';
import { notificationService } from './notification.service.js';
import { emitToProject, emitToUser } from '../socket.js';

const STEPS: SignStep[] = ['review', 'details', 'accept', 'signature', 'complete'];

export class ProposalSignService {
  async createForProject(
    projectId: string,
    userId: string,
    body?: { quoteSnapshot?: Record<string, unknown> | null },
  ) {
    const project = await Project.findById(projectId);
    if (!project || String(project.createdBy) !== userId) {
      throw new NotFoundError('Project not found');
    }
    const customer = await Customer.findById(project.customerId);
    if (!customer) throw new NotFoundError('Customer not found');

    const sign = await ProposalSign.create({
      projectId: project._id,
      createdBy: new Types.ObjectId(userId),
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone ?? null,
      quoteSnapshot: body?.quoteSnapshot ?? null,
      status: 'pending',
      step: 'review',
    });

    project.status = 'sent';
    await project.save();

    await notificationService.create({
      userId,
      kind: 'proposal_sent',
      title: 'Proposal sent for signature',
      body: `${customer.name} can now review and sign “${project.title}”.`,
      href: `/proposals/${projectId}`,
      projectId,
      meta: { token: sign.token },
    });

    emitToUser(userId, 'proposal:sent', { projectId, token: sign.token });
    return {
      ...sign.toJSON(),
      signUrlPath: `/sign/${sign.token}`,
    };
  }

  async getPublicByToken(token: string) {
    const sign = await ProposalSign.findOne({ token });
    if (!sign) throw new NotFoundError('Signing link not found');
    if (sign.expiresAt.getTime() < Date.now()) {
      sign.status = 'expired';
      await sign.save();
      throw new ValidationError('This signing link has expired');
    }

    const project = await Project.findById(sign.projectId);
    if (!project) throw new NotFoundError('Project not found');
    const [customer, site, design] = await Promise.all([
      Customer.findById(project.customerId),
      Site.findOne({ projectId: project._id }),
      Design.findOne({ projectId: project._id }).sort({ updatedAt: -1 }),
    ]);

    if (sign.status === 'pending') {
      sign.status = 'viewed';
    }

    const previousViews = Number(sign.viewCount ?? 0);
    sign.viewCount = previousViews + 1;
    sign.lastViewedAt = new Date();
    await sign.save();

    // Notify on first view and every subsequent open so staff see watch activity.
    await notificationService.create({
      userId: String(sign.createdBy),
      kind: 'proposal_viewed',
      title:
        previousViews === 0
          ? 'Customer opened the proposal'
          : `Customer viewed proposal again (${sign.viewCount}×)`,
      body: `${sign.customerName} ${
        previousViews === 0 ? 'opened' : 're-opened'
      } “${project.title}”.`,
      href: `/proposals/${String(project._id)}/preview`,
      projectId: String(project._id),
      meta: { token, viewCount: sign.viewCount },
    });
    emitToProject(String(project._id), 'proposal:viewed', {
      token,
      viewCount: sign.viewCount,
      lastViewedAt: sign.lastViewedAt,
    });
    emitToUser(String(sign.createdBy), 'proposal:viewed', {
      projectId: String(project._id),
      token,
      viewCount: sign.viewCount,
      lastViewedAt: sign.lastViewedAt,
    });

    return {
      sign: sign.toJSON(),
      project: {
        id: String(project._id),
        title: project.title,
        status: project.status,
        inverterCatalogId: project.inverterCatalogId,
        batteryCatalogId: project.batteryCatalogId,
      },
      customer: customer
        ? {
            name: customer.name,
            email: customer.email,
            phone: customer.phone ?? null,
          }
        : null,
      site: site
        ? {
            address: site.address,
            lat: site.lat,
            lng: site.lng,
          }
        : null,
      design: design
        ? {
            id: String(design._id),
            panels: design.panels ?? [],
            mapCenter: design.mapCenter,
            siteAddress: design.siteAddress,
            production: design.production ?? null,
            modelId: design.panels?.[0]?.catalogId ?? null,
          }
        : null,
      engagement: {
        watched: sign.viewCount > 0,
        viewCount: sign.viewCount,
        lastViewedAt: sign.lastViewedAt,
        status: sign.status,
      },
      steps: STEPS,
      stepIndex: Math.max(0, STEPS.indexOf(sign.step)),
    };
  }

  async advance(
    token: string,
    body: {
      step?: SignStep;
      signerName?: string;
      signerEmail?: string;
      signatureDataUrl?: string;
      acceptedTerms?: boolean;
    },
  ) {
    const sign = await ProposalSign.findOne({ token });
    if (!sign) throw new NotFoundError('Signing link not found');
    if (sign.status === 'signed') return sign.toJSON();
    if (sign.expiresAt.getTime() < Date.now()) {
      throw new ValidationError('This signing link has expired');
    }

    if (body.signerName != null) sign.signerName = body.signerName.trim();
    if (body.signerEmail != null) sign.signerEmail = body.signerEmail.trim().toLowerCase();
    if (body.signatureDataUrl != null) sign.signatureDataUrl = body.signatureDataUrl;
    if (body.acceptedTerms != null) sign.acceptedTerms = body.acceptedTerms;

    if (body.step && STEPS.includes(body.step)) {
      sign.step = body.step;
    }

    if (sign.step === 'complete' || body.step === 'complete') {
      if (!sign.acceptedTerms) throw new ValidationError('Please accept the terms to sign');
      if (!sign.signerName?.trim()) throw new ValidationError('Signer name is required');
      if (!sign.signatureDataUrl) throw new ValidationError('Signature is required');
      sign.status = 'signed';
      sign.signedAt = new Date();
      sign.step = 'complete';

      await Project.findByIdAndUpdate(sign.projectId, { status: 'signed' });

      await notificationService.create({
        userId: String(sign.createdBy),
        kind: 'proposal_signed',
        title: 'Proposal signed',
        body: `${sign.signerName} signed the proposal.`,
        href: `/proposals/${String(sign.projectId)}`,
        projectId: String(sign.projectId),
        meta: { token },
      });
      emitToUser(String(sign.createdBy), 'proposal:signed', {
        projectId: String(sign.projectId),
        token,
      });
      emitToProject(String(sign.projectId), 'proposal:signed', { token });
    }

    await sign.save();
    return sign.toJSON();
  }

  async listForProject(projectId: string, userId: string) {
    const project = await Project.findById(projectId);
    if (!project || String(project.createdBy) !== userId) {
      throw new NotFoundError('Project not found');
    }
    const items = await ProposalSign.find({ projectId }).sort({ createdAt: -1 }).lean({ virtuals: true });
    return items.map((row) => ({
      ...row,
      id: String(row._id),
      watched: Number(row.viewCount ?? 0) > 0,
      viewCount: Number(row.viewCount ?? 0),
      lastViewedAt: row.lastViewedAt ?? null,
    }));
  }
}

export const proposalSignService = new ProposalSignService();
