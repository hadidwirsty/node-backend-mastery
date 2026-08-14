import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError } from '@/core/errors/app-error';
import { globalErrorHandler } from '@/core/middlewares/error.middleware';

describe('globalErrorHandler Middleware', () => {
  const mockResponse = () => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  it('should format ZodError with 400 status and field issues', () => {
    const schema = z.object({ age: z.number().min(18) });
    let zodError: unknown;
    try {
      schema.parse({ age: 10 });
    } catch (err) {
      zodError = err;
    }

    const req = { correlationId: 'req-test-1' } as Request;
    const res = mockResponse();
    const next = vi.fn();

    globalErrorHandler(zodError as Error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        code: 'VALIDATION_ERROR',
        correlationId: 'req-test-1',
      }),
    );
  });

  it('should format operational AppError with designated status code', () => {
    const err = new AppError('Forbidden action', 403, 'FORBIDDEN_ACCESS');
    const req = { correlationId: 'req-test-2' } as Request;
    const res = mockResponse();
    const next = vi.fn();

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'FORBIDDEN_ACCESS',
      message: 'Forbidden action',
      correlationId: 'req-test-2',
    });
  });

  it('should return safe 500 error on unhandled exception', () => {
    const err = new Error('Unexpected database socket crash');
    const req = { correlationId: 'req-test-3' } as Request;
    const res = mockResponse();
    const next = vi.fn();

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred.',
      correlationId: 'req-test-3',
    });
  });
});
