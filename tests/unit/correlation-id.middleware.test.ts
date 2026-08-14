import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { correlationIdMiddleware } from '@/core/middlewares/correlation-id.middleware';

describe('correlationIdMiddleware', () => {
  it('should reuse existing x-request-id header', () => {
    const req = {
      headers: { 'x-request-id': 'custom-trace-123' },
    } as unknown as Request;

    const setHeaderMock = vi.fn();
    const res = {
      setHeader: setHeaderMock,
    } as unknown as Response;

    const next = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBe('custom-trace-123');
    expect(setHeaderMock).toHaveBeenCalledWith('x-request-id', 'custom-trace-123');
    expect(next).toHaveBeenCalled();
  });

  it('should generate a valid UUID when header is missing', () => {
    const req = {
      headers: {},
    } as unknown as Request;

    const setHeaderMock = vi.fn();
    const res = {
      setHeader: setHeaderMock,
    } as unknown as Response;

    const next = vi.fn();

    correlationIdMiddleware(req, res, next);

    expect(req.correlationId).toBeDefined();
    expect(req.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(setHeaderMock).toHaveBeenCalledWith('x-request-id', req.correlationId);
    expect(next).toHaveBeenCalled();
  });
});
