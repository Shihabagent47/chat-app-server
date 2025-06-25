import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/api-response.interfaces';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const errorResponse: ApiResponse = {
      success: false,
      message: this.getErrorMessage(exception),
      errors: this.getErrorMessages(exceptionResponse),
    };

    response.status(status).json(errorResponse);
  }

  private getErrorMessage(exception: HttpException): string {
    const status = exception.getStatus();

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Invalid request data';
      case HttpStatus.UNAUTHORIZED:
        return 'Authentication required';
      case HttpStatus.FORBIDDEN:
        return 'Access denied';
      case HttpStatus.NOT_FOUND:
        return 'Resource not found';
      case HttpStatus.CONFLICT:
        return 'Resource already exists';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal server error';
      default:
        return exception.message || 'An error occurred';
    }
  }

  private getErrorMessages(exceptionResponse: any): string[] {
    if (typeof exceptionResponse === 'string') {
      return [exceptionResponse];
    }

    if (exceptionResponse?.message) {
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message;
      }
      return [exceptionResponse.message];
    }

    return ['An unexpected error occurred'];
  }
}
