import express, { type Application, type NextFunction, type Request, type Response } from 'express';

import { AppError } from '@/core/errors/app-error';
import { correlationIdMiddleware } from '@/core/middlewares/correlation-id.middleware';
import { globalErrorHandler } from '@/core/middlewares/error.middleware';
import { healthRouter } from '@/routes/health.route';
import { logStreamRouter } from '@/routes/log-stream.route';

export function createApp(): Application {
  const app = express();

  // 1. Global Core Middlewares
  app.use(express.json());
  app.use(express.text({ type: 'text/plain' }));
  app.use(correlationIdMiddleware);

  // 2. Route Handlers
  app.use('/api/v1', healthRouter);
  app.use('/api/v1', logStreamRouter);

  // 3. Unhandled Route Fallback
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
  });

  // 4. Centralized Error Handler
  app.use(globalErrorHandler);

  return app;
}
