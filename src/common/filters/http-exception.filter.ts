import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  error: string;
  message: string | string[];
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let errorName = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorName = exception.name;

      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        // class-validator ValidationPipe produces { message: string[], error: string }
        const body = exceptionResponse as Record<string, any>;
        message = body.message ?? 'Request failed';
        if (body.error) errorName = body.error;
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'An unexpected error occurred';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorName,
      message
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception)
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} → ${status}: ${JSON.stringify(message)}`
      );
    }

    response.status(status).json(errorResponse);
  }
}
