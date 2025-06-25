import { ApiResponse } from '../interfaces/api-response.interfaces';

export class ResponseUtil {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Operation completed successfully',
    };
  }

  static successWithMeta<T>(
    data: T,
    meta: { page: number; limit: number; total: number; pages: number },
    message?: string,
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      meta,
      message: message || 'Data retrieved successfully',
    };
  }

  static error(message: string, errors?: string[]): ApiResponse<null> {
    return {
      success: false,
      data: null,
      message,
      errors,
    };
  }

  static validationError(errors: string[]): ApiResponse<null> {
    return {
      success: false,
      data: null,
      message: 'Validation failed',
      errors,
    };
  }
}
