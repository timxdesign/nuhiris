export interface IApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

export interface IApiSuccess<T> {
  success: true;
  data: T;
  meta: IApiMeta;
}

export interface IApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    requestId: string;
  };
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IApiPaginated<T> {
  success: true;
  data: T[];
  pagination: IPagination;
  meta: IApiMeta;
}

export type IApiResponse<T> = IApiSuccess<T> | IApiError;
