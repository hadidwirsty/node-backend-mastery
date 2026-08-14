import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { ZodError, z } from 'zod';

import { validateRequest } from '@/core/middlewares/validate.middleware';

describe('validateRequest Middleware', () => {
  const testSchema = z.object({
    body: z.object({
      email: z.string().email(),
      age: z.number().min(18),
    }),
  });

  it('should call next with no error on valid payload', async () => {
    const req = {
      body: { email: 'john@example.com', age: 25 },
      query: {},
      params: {},
    } as unknown as Request;

    const res = {} as Response;
    const next = vi.fn();

    const middleware = validateRequest(testSchema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('should call next with ZodError on invalid payload', async () => {
    const req = {
      body: { email: 'not-an-email', age: 15 },
      query: {},
      params: {},
    } as unknown as Request;

    const res = {} as Response;
    const next = vi.fn();

    const middleware = validateRequest(testSchema);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const passedError = next.mock.calls[0][0];
    expect(passedError).toBeInstanceOf(ZodError);
  });
});
