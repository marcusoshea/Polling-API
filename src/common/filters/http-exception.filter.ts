import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

const PG_UNIQUE_VIOLATION = '23505';

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
    } else if (this.isUniqueViolation(exception)) {
      // Concurrent duplicate insert (e.g. the same vote row from two tabs):
      // a conflict, not a server fault - and never the raw Postgres text.
      status = HttpStatus.CONFLICT;
      errorName = 'Conflict';
      message = 'This record already exists. Please refresh and try again.';
    } else if (exception instanceof Error) {
      // Never expose internal error text (raw driver/ORM messages leak schema
      // details); the full message and stack are still logged below.
      message = 'An unexpected error occurred. Please try again.';
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
      // For sanitized non-HttpException responses (e.g. 409), keep the real
      // cause in the server log even though the client only sees the generic text.
      const detail =
        !(exception instanceof HttpException) && exception instanceof Error
          ? ` [${exception.message}]`
          : '';
      this.logger.warn(
        `${request.method} ${request.url} → ${status}: ${JSON.stringify(message)}${detail}`
      );
    }

    response.status(status).json(errorResponse);
  }

  private isUniqueViolation(exception: unknown): boolean {
    if (!(exception instanceof QueryFailedError)) {
      return false;
    }
    const code =
      (exception as any).code ?? (exception as any).driverError?.code;
    return code === PG_UNIQUE_VIOLATION;
  }
}
