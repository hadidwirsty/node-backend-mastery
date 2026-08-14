import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '@/core/errors/app-error';
import { logger } from '@/core/logging/logger';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = req.correlationId || 'unknown';

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      correlationId,
      details,
    });
    return;
  }

  // 2. Operational Application Error
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      code: err.errorCode,
      message: err.message,
      correlationId,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // 3. Unhandled System / Programming Error (Non-operational)
  logger.error(
    {
      correlationId,
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
    },
    'Unhandled exception occurred',
  );

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal error occurred.',
    correlationId,
  });
}
