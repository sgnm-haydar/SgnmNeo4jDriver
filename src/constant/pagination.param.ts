/**
 * Common Pagination DTO for all  APIs
 */
export class PaginationNeo4jParams {
  page?: number;

  limit?: number;

  orderBy?: string;

  orderByColumn?: string;

  class_name?: string;
}
