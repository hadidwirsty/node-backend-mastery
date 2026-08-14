import type { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { LogTransformStream } from './log-transform-stream';

export async function processLogStream(source: Readable, destination: Writable): Promise<void> {
  const transform = new LogTransformStream();
  await pipeline(source, transform, destination);
}
