import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  const correlationId =
    typeof existingId === 'string' && existingId.trim().length > 0 ? existingId : randomUUID();

  req.correlationId = correlationId;
  res.setHeader('x-request-id', correlationId);

  next();
}
