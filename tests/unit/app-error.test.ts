import { describe, expect, it } from 'vitest';

import {
  AppError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@/core/errors/app-error';

describe('AppError & Error Hierarchy', () => {
  it('should instantiate AppError with custom properties', () => {
    const error = new AppError('Custom error message', 422, 'UNPROCESSABLE_ENTITY', {
      field: 'email',
    });
    expect(error.message).toBe('Custom error message');
    expect(error.statusCode).toBe(422);
    expect(error.errorCode).toBe('UNPROCESSABLE_ENTITY');
    expect(error.isOperational).toBe(true);
    expect(error.details).toEqual({ field: 'email' });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should instantiate factory subclasses with correct status codes', () => {
    const badReq = new BadRequestError('Invalid input');
    expect(badReq.statusCode).toBe(400);
    expect(badReq.errorCode).toBe('BAD_REQUEST');
    expect(badReq).toBeInstanceOf(AppError);

    const unauth = new UnauthorizedError();
    expect(unauth.statusCode).toBe(401);
    expect(unauth.message).toBe('Unauthorized');
    expect(unauth.errorCode).toBe('UNAUTHORIZED');

    const forbidden = new ForbiddenError('Access Denied');
    expect(forbidden.statusCode).toBe(403);
    expect(forbidden.errorCode).toBe('FORBIDDEN');

    const notFound = new NotFoundError('User not found');
    expect(notFound.statusCode).toBe(404);
    expect(notFound.errorCode).toBe('NOT_FOUND');

    const conflict = new ConflictError('Email already registered');
    expect(conflict.statusCode).toBe(409);
    expect(conflict.errorCode).toBe('CONFLICT');
  });
});
