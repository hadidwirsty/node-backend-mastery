# Context Memory — node-backend-mastery
_Last updated: 2026-08-14_

> **Status Proyek:** Fase Perencanaan — Source code belum ada. Seluruh implementasi didefinisikan di `docs/plans/`. Proyek ini adalah learning sandbox untuk transisi Frontend → Backend Engineer.

---

## Project Overview

**node-backend-mastery** adalah learning sandbox produksi-grade untuk transisi dari Frontend Engineer (React/Next.js/TypeScript) ke Backend Engineer berbasis Node.js dan TypeScript. Proyek ini mengikuti roadmap 5 minggu intensif dengan target kompetensi: Node.js Internals, PostgreSQL & Prisma ORM, Clean Architecture, Auth & Security, Redis/BullMQ, dan Containerization.

---

## Tech Stack

| Category | Library / Tool | Version |
|----------|---------------|---------|
| Runtime | Node.js LTS | v20+ |
| Language | TypeScript | ^5.5.4 |
| Framework | Express | ^4.19.2 |
| Validation | Zod | ^3.23.8 |
| Logger | Pino + pino-pretty | ^9.3.2 / ^11.2.2 |
| Test Runner | Vitest | ^2.0.5 |
| Integration Test | Supertest | ^7.0.0 |
| Dev Executor | tsx (watch mode) | ^4.16.5 |
| Build | tsc (TypeScript compiler) | ^5.5.4 |
| Path Alias Resolver | vite-tsconfig-paths | ^4.3.2 |
| **Week 2+** ORM | Prisma | TBD |
| **Week 2+** Database | PostgreSQL | TBD |
| **Week 3+** Auth | argon2id / bcrypt + JWT | TBD |
| **Week 4+** Cache | Redis + ioredis | TBD |
| **Week 4+** Queue | BullMQ | TBD |
| **Week 4+** WebSocket | Socket.io atau ws | TBD |
| **Week 5+** Container | Docker + docker-compose | TBD |
| **Week 5+** CI | GitHub Actions | TBD |
| **Week 5+** API Docs | @asteasolutions/zod-to-openapi | TBD |

---

## Architecture

**Style:** Layered Architecture (Routing → Controller → Service → Repository)

**Prinsip Inti:**
- Clean separation of concerns — setiap layer independen dari layer di atasnya
- I/O Isolation: semua operasi I/O di-abstract di balik interface
- Correlation ID tracing via `x-request-id` header — wajib di seluruh log lifecycle request
- Unified JSON Error Envelope: `{ status, code, message, correlationId, details? }`
- TDD-first: setiap implementasi didahului test yang gagal (Red → Green → Refactor)
- Operational Error vs Programming Error dibedakan via `AppError.isOperational` flag

**Error Response Envelope (wajib dipatuhi):**
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "correlationId": "uuid-v4",
  "details": [...]
}
```

**Success Response Envelope:**
```json
{
  "status": "success",
  "data": { ... }
}
```

---

## Directory Structure

```
node-js/
├── docs/                         # Dokumentasi proyek
│   ├── plans/                    # Implementation plans TDD per minggu
│   │   └── 2026-08-14-week-1-node-internals-express-ts-1.md
│   └── specs/                    # Design documents & roadmap
│       └── 2026-08-14-backend-engineer-roadmap-design.md
│
├── src/                          # Source code utama
│   ├── internals/                # Node.js runtime helpers
│   │   └── event-loop-analyzer.ts # Event loop phase sequence analyzer
│   ├── streams/                  # Stream classes
│   │   ├── log-transform-stream.ts # Log parsing & sanitization transform stream
│   │   └── log-pipeline.ts       # Pipeline processor with backpressure management
│   ├── core/
│   │   ├── errors/               # Custom AppError hierarchy
│   │   │   └── app-error.ts      # AppError and HTTP error subclasses
│   │   ├── logging/              # Logging infrastructure
│   │   │   └── logger.ts         # Pino singleton structured logger
│   │   └── middlewares/          # Express middleware pipeline
│   │       ├── correlation-id.middleware.ts # x-request-id header & correlation tracer
│   │       ├── validate.middleware.ts # Zod request validator
│   │       └── error.middleware.ts    # Centralized global error handler
│   ├── routes/                   # Route modules
│   │   ├── health.route.ts       # Service health check & uptime endpoint
│   │   └── log-stream.route.ts   # Streaming log transformation endpoint
│   ├── app.ts                    # Express app factory (createApp)
│   └── server.ts                 # Server entrypoint + graceful shutdown
│
├── tests/                        # Test suite
│   ├── unit/                     # Unit tests (Vitest, in-memory, no I/O)
│   │   ├── setup.test.ts         # Initial tooling setup test
│   │   ├── event-loop-analyzer.test.ts # Event loop phase sequence unit test
│   │   ├── log-stream.test.ts    # Stream transformation & pipeline unit test
│   │   ├── app-error.test.ts     # AppError hierarchy unit test
│   │   ├── correlation-id.middleware.test.ts # Correlation ID middleware unit test
│   │   ├── validate.middleware.test.ts # Request validation middleware unit test
│   │   ├── error.middleware.test.ts # Global error handler unit test
│   │   └── server.test.ts        # Server instance creation unit test
│   └── integration/              # Integration tests (Supertest)
│       └── api.test.ts           # End-to-end API integration tests
│
├── .agents/                      # Agent configurations
│   └── rules/
│       └── project-context.md    # Context Memory ini
│
├── package.json                  # Dependencies & npm scripts
├── tsconfig.json                 # TypeScript root configuration (strict, NodeNext, @/*)
├── tsconfig.build.json           # Production build TypeScript configuration
├── .prettierrc                   # Prettier formatting + import sorting rules
├── .prettierignore               # Prettier ignore patterns
├── vitest.config.ts              # Vitest configuration with path alias
└── .gitignore                    # Git ignore rules
```

---

## Code Conventions

- **Formatter & Imports:** Prettier dengan plugin `@trivago/prettier-plugin-sort-imports` (Node built-ins → third-party → `@/*` internal → `./` relative)
- **File naming:** `kebab-case.ts` (contoh: `app-error.ts`, `correlation-id.middleware.ts`)
- **Class naming:** `PascalCase` (contoh: `AppError`, `LogTransformStream`)
- **Function naming:** `camelCase` (contoh: `createApp`, `correlationIdMiddleware`, `validateRequest`)
- **Variable naming:** `camelCase`
- **Constants:** `SCREAMING_SNAKE_CASE` untuk env vars
- **Middleware pattern:** Named function export, bukan arrow default export
- **Factory pattern:** App dibuat via `createApp()` factory — bukan top-level singleton (memudahkan testing)
- **Import ordering:** Node built-ins → third-party → internal (`@/` alias) → relative
- **Path alias:** `@/*` → `src/*` (wajib gunakan alias, hindari deep relative imports)
- **Module system:** CommonJS (`"type": "commonjs"` di package.json, compiled via NodeNext)
- **Strict TypeScript:** `strict: true`, `esModuleInterop: true`, `skipLibCheck: true`
- **Interface naming:** Prefix `I` tidak digunakan; nama deskriptif langsung (contoh: `StructuredLog`)

---

## External Integrations

| Service | Purpose | Integration Method | Status |
|---------|---------|-------------------|--------|
| PostgreSQL | Relational database (Week 2+) | Prisma ORM | Planned |
| Redis | Caching + BullMQ Queue broker (Week 4+) | ioredis SDK | Planned |
| S3 / Supabase Storage | File/image upload (Week 3+) | REST SDK | Planned |
| SMTP / Email Provider | Email verification + notifications (Week 3+) | SDK / BullMQ job | Planned |
| GitHub Actions | CI pipeline (Week 5) | YAML config | Planned |

---

## Environment Variables

| Key | Purpose |
|-----|---------|
| `PORT` | HTTP server port (default: 3000) |
| `NODE_ENV` | Environment mode (`development` / `production`) — mengontrol pino-pretty transport |
| `LOG_LEVEL` | Pino log level (default: `info`) |
| `DATABASE_URL` | PostgreSQL connection string (Week 2+) |
| `JWT_ACCESS_SECRET` | JWT signing secret untuk access token (Week 3+) |
| `JWT_REFRESH_SECRET` | JWT signing secret untuk refresh token (Week 3+) |
| `REDIS_URL` | Redis connection URL (Week 4+) |

> ⚠️ File `.env.example` belum ada — perlu dibuat saat Week 2 (database integration).

---

## Development Commands

| Action | Command |
|--------|---------|
| Start dev (watch) | `npm run dev` → `tsx watch src/server.ts` |
| Build production | `npm run build` → `tsc -p tsconfig.build.json` |
| Start production | `npm run start` → `node dist/server.js` |
| Run all tests | `npm test` → `vitest run` |
| Test watch mode | `npm run test:watch` → `vitest` |
| Run single test | `npx vitest run tests/unit/<file>.test.ts` |
| Format all files | `npm run format` → `prettier --write .` |
| Check formatting | `npm run format:check` → `prettier --check .` |

---

## Key Files

| File | Role |
|------|------|
| `docs/specs/2026-08-14-backend-engineer-roadmap-design.md` | Master roadmap design — 5-week curriculum spec, approved |
| `docs/plans/2026-08-14-week-1-node-internals-express-ts-1.md` | Week 1 implementation plan — 9 tasks TDD, ready for execution |
| `src/app.ts` | Express app factory — entry point arsitektur |
| `src/server.ts` | Server entrypoint + graceful shutdown (SIGTERM/SIGINT) |
| `src/core/errors/app-error.ts` | Custom error hierarchy (AppError + factory subclasses) |
| `src/core/middlewares/error.middleware.ts` | Global error handler — ZodError, AppError, generic 500 |
| `src/core/middlewares/correlation-id.middleware.ts` | x-request-id injection middleware |
| `src/core/middlewares/validate.middleware.ts` | Zod request validation middleware |
| `src/core/logging/logger.ts` | Pino singleton logger |
| `vitest.config.ts` | Vitest + path alias config |
| `tsconfig.json` | TypeScript config (strict, CommonJS, `@/*` alias) |

---

## Learning Roadmap Status

| Week | Tema | Status |
|------|------|--------|
| **Week 1** | Node.js Internals, Streams, Express TS, Zod, Error Handling | 🟢 Selesai (9/9 Tasks Lolos & Terverifikasi) |
| **Week 2** | PostgreSQL, Advanced SQL, Prisma ORM | 🔲 Belum direncanakan |
| **Week 3** | Clean Architecture, JWT Auth, RBAC, OWASP | 🔲 Belum direncanakan |
| **Week 4** | Redis, BullMQ, WebSockets, Testing >80% | 🔲 Belum direncanakan |
| **Week 5** | Structured Logging, Docker, OpenAPI, CI/CD | 🔲 Belum direncanakan |

---

## Known Decisions & Constraints

- **CommonJS dengan NodeNext:** `"type": "commonjs"` di package.json, dikompilasi dengan TypeScript NodeNext untuk kompatibilitas ekosistem dan type resolution Node built-ins.
- **tsx untuk dev:** Zero-config TypeScript execution tanpa compile step — lebih cepat dari `ts-node`.
- **Vitest bukan Jest:** Dipilih karena kecepatan tinggi dan native TypeScript support tanpa config tambahan.
- **Factory pattern untuk app:** `createApp()` (bukan singleton global) wajib dipertahankan agar Supertest integration test bisa membuat instance baru per suite.
- **Pino bukan Winston:** Lebih performant (structured JSON by default) dengan `pino-pretty` untuk development readability.
- **Prettier & Import Sorting:** Dikonfigurasi otomatis via `@trivago/prettier-plugin-sort-imports` sesuai standar hierarkis clean code (Node built-in → third-party → internal `@/*` → relative).
- **Unified error envelope wajib:** Semua error response HARUS menggunakan format `{ status, code, message, correlationId, details? }` — tidak boleh ada format lain.
- **TDD non-negotiable:** Setiap implementasi WAJIB dimulai dari failing test (Red) sebelum production code (Green).
- **Scope Week 1 selesai:** Fondasi Node.js internals, streams, Express TS architecture, Zod validation, and centralized error handling telah 100% terimplementasi dan lulus seluruh pengujian (19 tests di 9 test files).
- **Out of scope (5 weeks):** Server-Side Rendering, Microservices (Kafka/RabbitMQ/gRPC), Kubernetes, Serverless.
