import { DEFAULT_PAGINATION_LIMIT, PAGINATION, MESSAGES } from '../constants/index.js';
import { buildPaginatedResult, getPagination } from '../helpers/response.js';
import type {
  BaseRepositoryContract,
  DocumentWithId,
  PaginatedResult,
  PaginationQuery,
} from '../types/index.js';
import { NotFoundError } from '../utils/errors.js';

export abstract class BaseService<
  TEntity,
  TSerialized extends Record<string, unknown>,
  TCreateInput,
  TUpdateInput = Partial<TCreateInput>,
> {
  protected constructor(
    protected readonly repository: BaseRepositoryContract<TEntity, TCreateInput, TUpdateInput>,
  ) {}

  protected abstract serialize(entity: DocumentWithId<TEntity>): TSerialized;

  protected getEntityLabel(): string {
    return MESSAGES.RESOURCE;
  }

  protected getNotFoundMessage(): string {
    return `${this.getEntityLabel()} not found`;
  }

  async getById(id: string): Promise<TSerialized> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundError(this.getNotFoundMessage());
    }

    return this.serialize(entity);
  }

  async list(query: PaginationQuery = {}): Promise<PaginatedResult<TSerialized>> {
    const page = query.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_PAGINATION_LIMIT;
    const { page: safePage, limit: safeLimit, skip } = getPagination(page, limit);

    const [items, total] = await Promise.all([
      this.repository.findMany({ skip, limit: safeLimit }),
      this.repository.count(),
    ]);

    return buildPaginatedResult(items.map((item) => this.serialize(item)), safePage, safeLimit, total);
  }
}
