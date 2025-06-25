export class ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  meta?: {
    page?: number;
    total?: number;
    limit?: number;
    totalPages?: number;
  };
}
