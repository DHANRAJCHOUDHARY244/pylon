import { BaseRepository } from '../base/base.repository.js';
import { Project, type IProject, type ProjectDocument } from '../models/project.model.js';
import { Types } from 'mongoose';

export type CreateProjectInput = {
  title: string;
  status?: IProject['status'];
  customerId: Types.ObjectId;
  inverterCatalogId: string;
  batteryCatalogId?: string | null;
  createdBy: Types.ObjectId;
};

export type UpdateProjectInput = Partial<
  Pick<IProject, 'title' | 'status' | 'inverterCatalogId' | 'batteryCatalogId'>
>;

export class ProjectRepository extends BaseRepository<IProject, CreateProjectInput, UpdateProjectInput> {
  constructor() {
    super(Project);
  }

  async findByOwner(createdBy: string, skip: number, limit: number): Promise<ProjectDocument[]> {
    return this.findMany({
      filter: { createdBy: new Types.ObjectId(createdBy) } as Partial<IProject>,
      skip,
      limit,
      sort: { updatedAt: -1 },
    });
  }

  async countByOwner(createdBy: string): Promise<number> {
    return this.count({ createdBy: new Types.ObjectId(createdBy) } as Partial<IProject>);
  }

  async findOwnedById(id: string, createdBy: string): Promise<ProjectDocument | null> {
    const doc = await this.findById(id);
    if (!doc || String(doc.createdBy) !== createdBy) {
      return null;
    }
    return doc;
  }
}

export const projectRepository = new ProjectRepository();
