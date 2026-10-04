import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  error: string;
  message: string | string[];
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message: string | string[] = 'An unexpected internal error occurred';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      error = exception.name;

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | string[]) || exception.message;
        if (typeof resObj.error === 'string') {
          error = resObj.error;
        }
        if (resObj.details !== undefined) {
          details = resObj.details;
        } else if (resObj.error && typeof resObj.error === 'object') {
          details = resObj.error;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma database errors
      switch (exception.code) {
        case 'P2002': {
          statusCode = HttpStatus.CONFLICT;
          error = 'Conflict';
          const target = (exception.meta?.target as string[])?.join(', ') || 'resource';
          message = `Unique constraint failed on field: ${target}`;
          break;
        }
        case 'P2025': {
          statusCode = HttpStatus.NOT_FOUND;
          error = 'Not Found';
          message = 'The requested resource was not found';
          break;
        }
        default: {
          statusCode = HttpStatus.BAD_REQUEST;
          error = 'Database Error';
          message = 'A database query constraint error occurred';
          break;
        }
      }
      this.logger.warn(`Prisma error [${exception.code}]: ${exception.message}`);
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error('Unknown exception thrown', JSON.stringify(exception));
    }

    const payload: ErrorResponse = {
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
      message,
      ...(details !== undefined ? { details } : {}),
    };

    response.status(statusCode).json(payload);
  }
}
