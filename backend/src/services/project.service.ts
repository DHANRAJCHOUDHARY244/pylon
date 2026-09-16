import { Types } from 'mongoose';

import { BaseService } from '../base/base.service.js';
import { DESIGN_SCHEMA_VERSION, PAGINATION } from '../constants/index.js';
import { buildPaginatedResult, getPagination } from '../helpers/response.js';
import type { IProject, ProjectDocument } from '../models/project.model.js';
import { customerRepository } from '../repositories/customer.repository.js';
import { designRepository } from '../repositories/design.repository.js';
import {
  projectRepository,
  type CreateProjectInput as RepoCreateProjectInput,
} from '../repositories/project.repository.js';
import { siteRepository } from '../repositories/site.repository.js';
import type { BaseEntity, PaginatedResult, PaginationQuery } from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';

export type ProjectResponse = BaseEntity & {
  title: string;
  status: string;
  customerId: string;
  inverterCatalogId: string;
  batteryCatalogId: string | null;
  createdBy: string;
};

export type ProjectListItemResponse = ProjectResponse & {
  customerName: string;
  customerEmail: string;
  address: string;
  lat: number;
  lng: number;
};

export type CreateProjectBundleInput = {
  title: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address: string;
  lat?: number;
  lng?: number;
  inverterCatalogId: string;
  batteryCatalogId?: string | null;
  status?: IProject['status'];
};

export type ProjectDetailResponse = ProjectResponse & {
  customer: { id: string; name: string; email: string; phone?: string };
  site: { id: string; address: string; lat: number; lng: number };
  designId: string;
};

const DEFAULT_MAP = { lat: -33.8688, lng: 151.2093 };
const DEFAULT_ROOF = [{ id: 'rf_default', x: 70, y: 80, w: 320, h: 220 }];

export class ProjectService extends BaseService<IProject, ProjectResponse, RepoCreateProjectInput> {
  constructor() {
    super(projectRepository);
  }

  protected override getEntityLabel(): string {
    return 'Project';
  }

  protected serialize(entity: ProjectDocument): ProjectResponse {
    const json = entity.toJSON() as unknown as Record<string, unknown>;
    return {
      id: String(json.id),
      title: String(json.title),
      status: String(json.status),
      customerId: String(json.customerId),
      inverterCatalogId: String(json.inverterCatalogId),
      batteryCatalogId: json.batteryCatalogId ? String(json.batteryCatalogId) : null,
      createdBy: String(json.createdBy),
      createdAt: json.createdAt as string,
      updatedAt: json.updatedAt as string,
    };
  }

  async listForUser(
    userId: string,
    query: PaginationQuery & { q?: string } = {},
  ): Promise<PaginatedResult<ProjectListItemResponse>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION.DEFAULT_LIMIT;
    const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);
    const q = (query.q ?? '').trim().toLowerCase();

    // Fetch a wider window when searching so title/customer/address filters work.
    const fetchSkip = q ? 0 : skip;
    const fetchLimit = q ? Math.min(200, Math.max(safeLimit * 5, 50)) : safeLimit;

    const [items, totalOwned] = await Promise.all([
      projectRepository.findByOwner(userId, fetchSkip, fetchLimit),
      projectRepository.countByOwner(userId),
    ]);

    const enriched = await Promise.all(
      items.map(async (item) => {
        const base = this.serialize(item);
        const customer = await customerRepository.findById(String(item.customerId));
        const site = await siteRepository.findByProjectId(String(item._id));
        const customerJson = customer
          ? (customer.toJSON() as unknown as Record<string, unknown>)
          : null;
        const siteJson = site ? (site.toJSON() as unknown as Record<string, unknown>) : null;
        return {
          ...base,
          customerName: customerJson ? String(customerJson.name) : '—',
          customerEmail: customerJson ? String(customerJson.email) : '',
          address: siteJson ? String(siteJson.address) : '',
          lat: siteJson ? Number(siteJson.lat) : DEFAULT_MAP.lat,
          lng: siteJson ? Number(siteJson.lng) : DEFAULT_MAP.lng,
        } satisfies ProjectListItemResponse;
      }),
    );

    const filtered = q
      ? enriched.filter(
          (row) =>
            row.title.toLowerCase().includes(q) ||
            row.customerName.toLowerCase().includes(q) ||
            row.customerEmail.toLowerCase().includes(q) ||
            row.address.toLowerCase().includes(q),
        )
      : enriched;

    const total = q ? filtered.length : totalOwned;
    const pageItems = q ? filtered.slice(skip, skip + safeLimit) : filtered;

    return buildPaginatedResult(pageItems, safePage, safeLimit, total);
  }

  async createForUser(userId: string, input: CreateProjectBundleInput): Promise<ProjectDetailResponse> {
    const ownerId = new Types.ObjectId(userId);

    const customerPayload: {
      name: string;
      email: string;
      createdBy: Types.ObjectId;
      phone?: string;
    } = {
      name: input.customerName,
      email: input.customerEmail,
      createdBy: ownerId,
    };
    if (input.customerPhone) {
      customerPayload.phone = input.customerPhone;
    }

    const customer = await customerRepository.create(customerPayload);

    const project = await projectRepository.create({
      title: input.title,
      status: input.status ?? 'draft',
      customerId: customer._id,
      inverterCatalogId: input.inverterCatalogId,
      batteryCatalogId: input.batteryCatalogId ?? null,
      createdBy: ownerId,
    });

    const site = await siteRepository.create({
      projectId: project._id,
      address: input.address,
      lat: input.lat ?? DEFAULT_MAP.lat,
      lng: input.lng ?? DEFAULT_MAP.lng,
    });

    const design = await designRepository.create({
      projectId: project._id,
      proposalId: null,
      schemaVersion: DESIGN_SCHEMA_VERSION,
      version: 1,
      isCurrent: true,
      panels: [],
      roofs: DEFAULT_ROOF,
      objects: DEFAULT_ROOF.map((r) => ({
        type: 'roof_rect' as const,
        id: r.id,
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
      })),
      mapCenter: { lat: site.lat, lng: site.lng },
      zoom: 19,
      createdBy: ownerId,
    });

    const base = this.serialize(project);
    const customerJson = customer.toJSON() as unknown as Record<string, unknown>;
    const siteJson = site.toJSON() as unknown as Record<string, unknown>;

    const customerOut: ProjectDetailResponse['customer'] = {
      id: String(customerJson.id),
      name: String(customerJson.name),
      email: String(customerJson.email),
    };
    if (customerJson.phone) {
      customerOut.phone = String(customerJson.phone);
    }

    return {
      ...base,
      customer: customerOut,
      site: {
        id: String(siteJson.id),
        address: String(siteJson.address),
        lat: Number(siteJson.lat),
        lng: Number(siteJson.lng),
      },
      designId: String(design._id),
    };
  }

  async getDetailForUser(projectId: string, userId: string): Promise<ProjectDetailResponse> {
    const project = await projectRepository.findOwnedById(projectId, userId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const customer = await customerRepository.findById(String(project.customerId));
    const site = await siteRepository.findByProjectId(projectId);
    const design = await designRepository.findCurrentByProjectId(projectId);

    if (!customer || !site || !design) {
      throw new NotFoundError('Project data incomplete');
    }

    const customerJson = customer.toJSON() as unknown as Record<string, unknown>;
    const siteJson = site.toJSON() as unknown as Record<string, unknown>;
    const base = this.serialize(project);

    const customerOut: ProjectDetailResponse['customer'] = {
      id: String(customerJson.id),
      name: String(customerJson.name),
      email: String(customerJson.email),
    };
    if (customerJson.phone) {
      customerOut.phone = String(customerJson.phone);
    }

    return {
      ...base,
      customer: customerOut,
      site: {
        id: String(siteJson.id),
        address: String(siteJson.address),
        lat: Number(siteJson.lat),
        lng: Number(siteJson.lng),
      },
      designId: String(design._id),
    };
  }

  async updateSiteForUser(
    projectId: string,
    userId: string,
    input: { address: string; lat?: number; lng?: number },
  ): Promise<ProjectDetailResponse> {
    await this.assertOwned(projectId, userId);
    const site = await siteRepository.findByProjectId(projectId);
    if (!site) {
      throw new NotFoundError('Site not found');
    }

    const patch: { address: string; lat?: number; lng?: number } = {
      address: input.address,
    };
    if (input.lat != null) patch.lat = input.lat;
    if (input.lng != null) patch.lng = input.lng;

    const updated = await siteRepository.updateById(String(site._id), patch);
    if (!updated) {
      throw new NotFoundError('Site not found');
    }

    const design = await designRepository.findCurrentByProjectId(projectId);
    if (design) {
      await designRepository.updateById(String(design._id), {
        siteAddress: input.address,
        ...(input.lat != null && input.lng != null
          ? { mapCenter: { lat: input.lat, lng: input.lng } }
          : {}),
      });
    }

    return this.getDetailForUser(projectId, userId);
  }

  async updateEquipmentForUser(
    projectId: string,
    userId: string,
    input: {
      inverterCatalogId?: string;
      batteryCatalogId?: string | null;
      status?: IProject['status'];
    },
  ): Promise<ProjectDetailResponse> {
    await this.assertOwned(projectId, userId);
    const patch: {
      inverterCatalogId?: string;
      batteryCatalogId?: string | null;
      status?: IProject['status'];
    } = {};
    if (input.inverterCatalogId) patch.inverterCatalogId = input.inverterCatalogId;
    if (input.batteryCatalogId !== undefined) patch.batteryCatalogId = input.batteryCatalogId;
    if (input.status) patch.status = input.status;

    const updated = await projectRepository.updateById(projectId, patch);
    if (!updated) {
      throw new NotFoundError('Project not found');
    }
    return this.getDetailForUser(projectId, userId);
  }

  private async assertOwned(projectId: string, userId: string) {
    const project = await projectRepository.findOwnedById(projectId, userId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
  }
}

export const projectService = new ProjectService();
