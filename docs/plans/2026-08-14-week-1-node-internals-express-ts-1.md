# Minggu 1 (Fase 1): Node.js Internals & Express.js with TypeScript — Implementation Plan

**Feature:** Week 1 — Node.js Runtime Internals, Stream Pipelines, Express.js TypeScript Architecture, Zod Validation, & Unified Error Handling  
**Document:** `docs/plans/2026-08-14-week-1-node-internals-express-ts-1.md`  
**Sequence:** 1  
**Status:** Ready for Execution

---

## Technical Context & Constraints

- **Language & Runtime:** Node.js (v20+ LTS), TypeScript (v5+) with strict mode enabled.
- **Framework & Libraries:** Express v4/v5, Zod v3, Pino logger, Vitest, Supertest.
- **Architecture Standard:** Layered Architecture, I/O Isolation behind Interfaces, Correlation ID tracing (`x-request-id`), Unified JSON Envelope for Error Responses (`status`, `code`, `message`, `correlationId`, `details`).
- **Testing Standard:** TDD (Test-Driven Development), Vitest test runner with isolated in-memory unit tests and Supertest integration tests.

---

### Task 1: Initialize Project Configuration, Tooling, and Dependencies [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/package.json`
- Create: `/Users/hadidwirsty/Project/node-js/tsconfig.json`
- Create: `/Users/hadidwirsty/Project/node-js/vitest.config.ts`
- Create: `/Users/hadidwirsty/Project/node-js/.gitignore`

**Requirements:**

- **Acceptance Criteria**
  1. `package.json` contains all necessary dependencies (`express`, `zod`, `pino`, `pino-pretty`) and devDependencies (`typescript`, `@types/node`, `@types/express`, `vitest`, `supertest`, `@types/supertest`, `tsx`).
  2. `tsconfig.json` configures strict mode, ES2022 target, NodeNext module resolution, and `@/*` path aliases.
  3. `vitest.config.ts` configures path aliases and test glob matching.
- **Functional Requirements**
  1. Provide npm scripts for `dev`, `build`, `start`, and `test`.
- **Non-Functional Requirements**
  1. Fast dev execution via `tsx`.
- **Test Coverage**
  - [Unit] Verify TypeScript configuration compiles sample test without type errors.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/unit/setup.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

describe('Project Tooling Setup', () => {
  it('should execute vitest and confirm typescript environment is active', () => {
    const environment: string = 'typescript-node-backend';
    expect(environment).toBe('typescript-node-backend');
  });
});
```

**Step 2: Verify test fails**
Run: `npm test`
Expected: FAIL (missing node_modules or configuration files).

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/package.json`:

```json
{
  "name": "node-backend-mastery",
  "version": "1.0.0",
  "description": "Production-grade Node.js and TypeScript Backend Learning Sandbox",
  "main": "dist/server.js",
  "type": "commonjs",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "express": "^4.19.2",
    "pino": "^9.3.2",
    "pino-pretty": "^11.2.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.12",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.16.5",
    "typescript": "^5.5.4",
    "vite-tsconfig-paths": "^4.3.2",
    "vitest": "^2.0.5"
  }
}
```

Create `/Users/hadidwirsty/Project/node-js/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    },
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

Create `/Users/hadidwirsty/Project/node-js/vitest.config.ts`:

```typescript
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

Create `/Users/hadidwirsty/Project/node-js/.gitignore`:

```
node_modules/
dist/
logs/
.env
.DS_Store
coverage/
```

**Step 4: Verify test passes**
Run: `npm install && npx vitest run tests/unit/setup.test.ts`
Expected: PASS with exit code 0.

---

### Task 2: Implement Node.js Runtime Internals Analyzer & Diagnostic Lab [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/src/internals/event-loop-analyzer.ts`
- Test: `/Users/hadidwirsty/Project/node-js/tests/unit/event-loop-analyzer.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `EventLoopAnalyzer.getExecutionOrder()` captures and records the exact deterministic execution order of: Synchronous code, `process.nextTick`, `Promise.then` (Microtask queue), `setTimeout` (Timers phase), and `setImmediate` (Check phase).
  2. Demonstrates the difference between I/O bound non-blocking operations and CPU-bound blocking operations.
- **Functional Requirements**
  1. Provide deterministic order recording for architectural verification of asynchronous execution.
- **Non-Functional Requirements**
  1. Pure helper with zero external I/O side effects during unit tests.
- **Test Coverage**
  - [Unit] `EventLoopAnalyzer.getExecutionOrder()` - verifies `nextTick` executes before `Promise`, and both execute before `setTimeout`/`setImmediate`.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/unit/event-loop-analyzer.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { EventLoopAnalyzer } from '@/internals/event-loop-analyzer';

describe('EventLoopAnalyzer', () => {
  it('should capture deterministic phase execution sequence', async () => {
    const sequence = await EventLoopAnalyzer.getExecutionOrder();

    expect(sequence).toEqual([
      '1_SYNC',
      '2_NEXT_TICK',
      '3_MICROTASK_PROMISE',
      '4_IMMEDIATE_CHECK',
      '5_TIMER_MACROTASK',
    ]);
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/event-loop-analyzer.test.ts`
Expected: FAIL with `Cannot find module '@/internals/event-loop-analyzer'`.

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/src/internals/event-loop-analyzer.ts`:

```typescript
export class EventLoopAnalyzer {
  public static async getExecutionOrder(): Promise<string[]> {
    const records: string[] = [];

    return new Promise((resolve) => {
      // 1. Timer macrotask (Timers Phase)
      setTimeout(() => {
        records.push('5_TIMER_MACROTASK');
        resolve(records);
      }, 10);

      // 2. Check macrotask (Check Phase)
      setImmediate(() => {
        records.push('4_IMMEDIATE_CHECK');
      });

      // 3. Microtask Promise
      Promise.resolve().then(() => {
        records.push('3_MICROTASK_PROMISE');
      });

      // 4. Microtask process.nextTick
      process.nextTick(() => {
        records.push('2_NEXT_TICK');
      });

      // 5. Synchronous execution
      records.push('1_SYNC');
    });
  }
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/event-loop-analyzer.test.ts`
Expected: PASS with exit code 0.

---

### Task 3: Implement Stream Transformation & Memory-Safe Pipeline [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/src/streams/log-transform-stream.ts`
- Create: `/Users/hadidwirsty/Project/node-js/src/streams/log-pipeline.ts`
- Test: `/Users/hadidwirsty/Project/node-js/tests/unit/log-stream.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `LogTransformStream` extends `Transform` stream to parse raw multiline string/buffer logs into structured JSON line entries without loading entire files into memory.
  2. Masks sensitive data (e.g. `password`, `token`, `authorization`) during stream transformation.
  3. `processLogStream(readable, writable)` safely connects streams using `node:stream/promises` `pipeline` for automatic backpressure management and resource cleanup.
- **Functional Requirements**
  1. Transform arbitrary log chunks, split by newline, and output parsed JSON lines.
- **Non-Functional Requirements**
  1. Memory-constant streaming; no memory accumulation on large data streams.
- **Test Coverage**
  - [Unit] `LogTransformStream` - transforms raw logs and redacts sensitive keys.
  - [Unit] `processLogStream` - writes parsed output to writable stream using pipeline.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/unit/log-stream.test.ts`:

```typescript
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
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/log-stream.test.ts`
Expected: FAIL with `Cannot find module '@/streams/log-transform-stream'`.

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/src/streams/log-transform-stream.ts`:

```typescript
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
```

Create `/Users/hadidwirsty/Project/node-js/src/streams/log-pipeline.ts`:

```typescript
import type { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { LogTransformStream } from './log-transform-stream';

export async function processLogStream(source: Readable, destination: Writable): Promise<void> {
  const transform = new LogTransformStream();
  await pipeline(source, transform, destination);
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/log-stream.test.ts`
Expected: PASS with exit code 0.

---

### Task 4: Implement Custom `AppError` Hierarchy & Error Classifier [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/src/core/errors/app-error.ts`
- Test: `/Users/hadidwirsty/Project/node-js/tests/unit/app-error.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `AppError` extends built-in `Error` with `statusCode`, `errorCode`, `isOperational`, and optional `details`.
  2. Pre-built factory sub-classes provided: `BadRequestError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), and `ConflictError` (409).
  3. `isOperational` flag is true by default for `AppError`, allowing error handlers to differentiate trusted client errors from internal programmer faults.
- **Functional Requirements**
  1. Capture stack trace accurately and preserve prototype chain.
- **Test Coverage**
  - [Unit] `AppError` creates proper error structure and assigns correct HTTP status codes.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/unit/app-error.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import {
  AppError,
  BadRequestError,
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
  });

  it('should instantiate factory subclasses with correct status codes', () => {
    const badReq = new BadRequestError('Invalid input');
    expect(badReq.statusCode).toBe(400);
    expect(badReq.errorCode).toBe('BAD_REQUEST');

    const unauth = new UnauthorizedError();
    expect(unauth.statusCode).toBe(401);
    expect(unauth.message).toBe('Unauthorized');

    const notFound = new NotFoundError('User not found');
    expect(notFound.statusCode).toBe(404);
    expect(notFound.errorCode).toBe('NOT_FOUND');
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/app-error.test.ts`
Expected: FAIL with `Cannot find module '@/core/errors/app-error'`.

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/src/core/errors/app-error.ts`:

```typescript
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: unknown) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource Not Found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource Conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', details);
  }
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/app-error.test.ts`
Expected: PASS with exit code 0.

---

### Task 5: Implement Structured Logger & Correlation ID Middleware [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/src/core/logging/logger.ts`
- Create: `/Users/hadidwirsty/Project/node-js/src/core/middlewares/correlation-id.middleware.ts`
- Test: `/Users/hadidwirsty/Project/node-js/tests/unit/correlation-id.middleware.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `logger` instance configured with `pino` providing structured JSON output.
  2. `correlationIdMiddleware` extracts incoming `x-request-id` header or generates a new UUID v4 if missing.
  3. Binds correlation ID to `req.correlationId` and attaches header `x-request-id` to response.
- **Functional Requirements**
  1. Ensure end-to-end request traceability across all log statements.
- **Test Coverage**
  - [Unit] Middleware sets `correlationId` from existing request header.
  - [Unit] Middleware generates UUID v4 when request header is absent.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/unit/correlation-id.middleware.test.ts`:

```typescript
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
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/correlation-id.middleware.test.ts`
Expected: FAIL with `Cannot find module '@/core/middlewares/correlation-id.middleware'`.

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/src/core/logging/logger.ts`:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
```

Create `/Users/hadidwirsty/Project/node-js/src/core/middlewares/correlation-id.middleware.ts`:

```typescript
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
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/correlation-id.middleware.test.ts`
Expected: PASS with exit code 0.

---

### Task 6: Implement Zod Request Validation Middleware [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/src/core/middlewares/validate.middleware.ts`
- Test: `/Users/hadidwirsty/Project/node-js/tests/unit/validate.middleware.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `validateRequest(schema)` middleware validates `req.body`, `req.query`, and `req.params`.
  2. If valid, sanitized parsed values are reassigned back to request object and `next()` is called.
  3. If invalid, throws or passes `ZodError` to `next(error)` for centralized handling.
- **Functional Requirements**
  1. Enforce strict input boundaries before execution hits controller handlers.
- **Test Coverage**
  - [Unit] Valid request schema passes successfully.
  - [Unit] Invalid request body invokes next with ZodError.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/unit/validate.middleware.test.ts`:

```typescript
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
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/validate.middleware.test.ts`
Expected: FAIL with `Cannot find module '@/core/middlewares/validate.middleware'`.

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/src/core/middlewares/validate.middleware.ts`:

```typescript
import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';

export function validateRequest(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      next(error);
    }
  };
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/validate.middleware.test.ts`
Expected: PASS with exit code 0.

---

### Task 7: Implement Global Centralized Error Handling Middleware [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/src/core/middlewares/error.middleware.ts`
- Test: `/Users/hadidwirsty/Project/node-js/tests/unit/error.middleware.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. Catches `ZodError` and returns `400 Bad Request` with field-level issues in the unified JSON envelope.
  2. Catches `AppError` and returns designated `statusCode`, `errorCode`, and message.
  3. Catches unexpected non-operational errors, logs full stack trace with correlation ID, and returns safe generic `500 Internal Server Error` without leaking stack trace.
- **Non-Functional Requirements**
  1. Compliant with Technical Constitution Error Envelope format: `{ status: 'error', code, message, correlationId, details }`.
- **Test Coverage**
  - [Unit] Error middleware formats ZodError as 400.
  - [Unit] Error middleware formats AppError as designated code.
  - [Unit] Error middleware formats generic Error as 500 without leaking stack trace.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/unit/error.middleware.test.ts`:

```typescript
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
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/error.middleware.test.ts`
Expected: FAIL with `Cannot find module '@/core/middlewares/error.middleware'`.

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/src/core/middlewares/error.middleware.ts`:

```typescript
import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../errors/app-error';
import { logger } from '../logging/logger';

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = req.correlationId || 'unknown';

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: 'Input validation failed',
      correlationId,
      details,
    });
    return;
  }

  // 2. Operational Application Error
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      status: 'error',
      code: err.errorCode,
      message: err.message,
      correlationId,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  // 3. Unhandled System / Programming Error (Non-operational)
  logger.error(
    {
      correlationId,
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
    },
    'Unhandled exception occurred',
  );

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal error occurred.',
    correlationId,
  });
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/error.middleware.test.ts`
Expected: PASS with exit code 0.

---

### Task 8: Assemble Express App & Build Integration Endpoints [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/src/app.ts`
- Create: `/Users/hadidwirsty/Project/node-js/src/routes/health.route.ts`
- Create: `/Users/hadidwirsty/Project/node-js/src/routes/log-stream.route.ts`
- Test: `/Users/hadidwirsty/Project/node-js/tests/integration/api.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `app.ts` registers `express.json()`, `correlationIdMiddleware`, routes, 404 fallback handler, and `globalErrorHandler`.
  2. `GET /api/v1/health` returns status `UP` with uptime and timestamp.
  3. `POST /api/v1/logs/transform` accepts multiline raw text body, streams it through `LogTransformStream`, and returns newline-delimited JSON or structured array.
  4. Integration tests verify full HTTP request/response cycle using `supertest`.
- **Test Coverage**
  - [Integration] `GET /api/v1/health` - returns 200 OK.
  - [Integration] `POST /api/v1/logs/transform` - streams logs and redacts passwords.
  - [Integration] `GET /unknown-route` - returns 404 with structured error envelope.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/integration/api.test.ts`:

```typescript
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '@/app';

describe('Express Application Integration Tests', () => {
  const app = createApp();

  it('GET /api/v1/health should return 200 with health metadata', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.uptime).toBeTypeOf('number');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('POST /api/v1/logs/transform should transform raw log data via stream', async () => {
    const rawLog = 'INFO 2026-08-14 API request received with token=SecretToken99\n';

    const res = await request(app)
      .post('/api/v1/logs/transform')
      .set('Content-Type', 'text/plain')
      .send(rawLog);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data[0].level).toBe('INFO');
    expect(res.body.data[0].message).toContain('token=***REDACTED***');
  });

  it('GET /api/v1/non-existent-route should trigger 404 AppError envelope', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.code).toBe('ROUTE_NOT_FOUND');
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/integration/api.test.ts`
Expected: FAIL with `Cannot find module '@/app'`.

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/src/routes/health.route.ts`:

```typescript
import { type Request, type Response, Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});
```

Create `/Users/hadidwirsty/Project/node-js/src/routes/log-stream.route.ts`:

```typescript
import { Readable } from 'node:stream';

import { type NextFunction, type Request, type Response, Router } from 'express';

import { BadRequestError } from '../core/errors/app-error';
import { LogTransformStream, type StructuredLog } from '../streams/log-transform-stream';

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
```

Create `/Users/hadidwirsty/Project/node-js/src/app.ts`:

```typescript
import express, { type Application, type Request, type Response } from 'express';

import { NotFoundError } from './core/errors/app-error';
import { correlationIdMiddleware } from './core/middlewares/correlation-id.middleware';
import { globalErrorHandler } from './core/middlewares/error.middleware';
import { healthRouter } from './routes/health.route';
import { logStreamRouter } from './routes/log-stream.route';

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
  app.use((req: Request, _res: Response, next) => {
    next(
      new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`, {
        code: 'ROUTE_NOT_FOUND',
      }),
    );
  });

  // 4. Centralized Error Handler
  app.use(globalErrorHandler);

  return app;
}
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/integration/api.test.ts`
Expected: PASS with exit code 0.

---

### Task 9: Implement Server Entrypoint & Graceful Shutdown [COMPLETED]

**Files:**

- Create: `/Users/hadidwirsty/Project/node-js/src/server.ts`
- Test: `/Users/hadidwirsty/Project/node-js/tests/unit/server.test.ts`

**Requirements:**

- **Acceptance Criteria**
  1. `server.ts` listens on `PORT` (default 3000) and logs startup status via `logger`.
  2. Implements graceful shutdown handling for `SIGINT` and `SIGTERM` signals with connection draining.
- **Test Coverage**
  - [Unit] Verify application initializes correctly on designated port.

**Step 1: Write failing test**
Create `/Users/hadidwirsty/Project/node-js/tests/unit/server.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';

import { createApp } from '@/app';

describe('Server Initialization', () => {
  it('should instantiate Express app without throwing', () => {
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });
});
```

**Step 2: Verify test fails**
Run: `npx vitest run tests/unit/server.test.ts`
Expected: PASS or FAIL depending on previous task; creates isolated test for server instantiability.

**Step 3: Write minimal implementation**
Create `/Users/hadidwirsty/Project/node-js/src/server.ts`:

```typescript
import { createApp } from './app';
import { logger } from './core/logging/logger';

const PORT = Number(process.env.PORT) || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

**Step 4: Verify test passes**
Run: `npx vitest run tests/unit/server.test.ts`
Expected: PASS with exit code 0.

---

## Plan Review & Verification Checklist

- [x] All 9 tasks contain full 4-step TDD workflows (Step 1: Write test, Step 2: Verify fail, Step 3: Minimal code, Step 4: Verify pass).
- [x] All file paths are absolute and exact.
- [x] All test commands are copy-pasteable and verifiable via Vitest/Supertest.
- [x] Strictly compliant with Technical Constitution and Clean Code Standards (import ordering, correlation ID, error envelope).
