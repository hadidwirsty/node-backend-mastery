import { Buffer } from 'node:buffer';
import { Transform, type TransformCallback } from 'node:stream';

export interface StructuredLog {
  level: string;
  timestamp: string;
  message: string;
  processedAt: string;
}

export class LogTransformStream extends Transform {
  private bufferRemainder: string = '';

  constructor() {
    super();
  }

  public _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    const data = this.bufferRemainder + chunk.toString();
    const lines = data.split('\n');

    // Keep the last partial line in the buffer
    this.bufferRemainder = lines.pop() ?? '';

    for (const line of lines) {
      if (line.trim().length === 0) continue;
      const structured = this.parseAndSanitize(line);
      this.push(JSON.stringify(structured) + '\n');
    }

    callback();
  }

  public _flush(callback: TransformCallback): void {
    if (this.bufferRemainder.trim().length > 0) {
      const structured = this.parseAndSanitize(this.bufferRemainder);
      this.push(JSON.stringify(structured) + '\n');
    }
    callback();
  }

  private parseAndSanitize(rawLine: string): StructuredLog {
    const parts = rawLine.trim().split(' ');
    const level = parts[0] || 'INFO';
    const timestamp = parts[1] || new Date().toISOString();
    let message = parts.slice(2).join(' ');

    // Redact sensitive patterns
    message = message.replace(
      /(password|token|secret|authorization)=([^\s]+)/gi,
      '$1=***REDACTED***',
    );

    return {
      level,
      timestamp,
      message,
      processedAt: new Date().toISOString(),
    };
  }
}
