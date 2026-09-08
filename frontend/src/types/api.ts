/** Mirrors the backend `ApiError` contract (np.com.lims.common.api.ApiError). */
export interface ApiErrorBody {
  code: string;
  message: string;
  status: number;
  path: string;
  timestamp: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

/** Mirrors the backend `PageResponse<T>` envelope. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors: Array<{ field: string; message: string }>;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = body.status;
    this.fieldErrors = body.fieldErrors ?? [];
  }
}
