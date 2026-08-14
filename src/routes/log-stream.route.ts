import { Buffer } from 'node:buffer';
import { Readable } from 'node:stream';

import { type NextFunction, type Request, type Response, Router } from 'express';

import { BadRequestError } from '@/core/errors/app-error';
import { LogTransformStream, type StructuredLog } from '@/streams/log-transform-stream';

export const logStreamRouter = Router();

logStreamRouter.post(
  '/logs/transform',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawText = typeof req.body === 'string' ? req.body : '';
      if (!rawText.trim()) {
        throw new BadRequestError('Request body must contain non-empty text log data');
      }

      const results: StructuredLog[] = [];
      const source = Readable.from([rawText]);
      const transform = new LogTransformStream();

      transform.on('data', (chunk: Buffer) => {
        const line = chunk.toString().trim();
        if (line) results.push(JSON.parse(line));
      });

      source.pipe(transform);

      await new Promise<void>((resolve, reject) => {
        transform.on('end', () => resolve());
        transform.on('error', (err) => reject(err));
      });

      res.status(200).json({
        status: 'success',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  },
);
