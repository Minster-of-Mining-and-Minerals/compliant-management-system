export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  success: boolean;
  message: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: any;
}
