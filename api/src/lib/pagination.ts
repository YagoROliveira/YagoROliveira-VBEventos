export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 20;
export const MAX_PER_PAGE = 50;

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginationMeta;
};

export function paginate<T>(data: T[], total: number, page: number, perPage: number): Paginated<T> {
  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / perPage),
    },
  };
}

export function offsetOf(page: number, perPage: number): number {
  return (page - 1) * perPage;
}
