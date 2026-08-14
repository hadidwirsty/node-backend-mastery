import { Buffer } from 'node:buffer';
import { Readable, Writable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { processLogStream } from '@/streams/log-pipeline';
import { LogTransformStream } from '@/streams/log-transform-stream';

describe('Stream Transformation & Pipeline', () => {
  it('should transform raw log line and mask sensitive fields', async () => {
    const transform = new LogTransformStream();
    const chunks: string[] = [];

    transform.on('data', (chunk: Buffer) => {
      chunks.push(chunk.toString());
    });

    const sampleLog = 'INFO 2026-08-14 user logged in with password=SecretPassword123\n';
    transform.write(sampleLog);
    transform.end();

    await new Promise((resolve) => transform.on('end', resolve));

    const parsed = JSON.parse(chunks.join(''));
    expect(parsed.level).toBe('INFO');
    expect(parsed.message).toContain('password=***REDACTED***');
  });

  it('should process stream via pipeline from readable to writable', async () => {
    const input = 'WARN 2026-08-14 database high connection count\n';
    const readable = Readable.from([input]);
    const outputChunks: string[] = [];

    const writable = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        outputChunks.push(chunk.toString());
        callback();
      },
    });

    await processLogStream(readable, writable);

    const parsed = JSON.parse(outputChunks.join(''));
    expect(parsed.level).toBe('WARN');
    expect(parsed.message).toBe('database high connection count');
  });
});
