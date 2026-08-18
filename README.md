<div align="center">
  <a href="https://github.com/hadidwirsty/node-backend-mastery">
    <img src="https://raw.githubusercontent.com/github/explore/80688e429a7d4ef2fca1e82350fe8e3517d3494d/topics/nodejs/nodejs.png" alt="Node.js Logo" width="80" height="80">
  </a>

  <h2 align="center">Node.js Backend Mastery</h2>

  <p align="center">
    A production-grade Node.js and TypeScript backend architecture designed for robust, scalable, and memory-safe enterprise services.
    <br />
    <a href="docs/specs/2026-08-14-backend-engineer-roadmap-design.md"><strong>Explore the Roadmap »</strong></a>
    ·
    <a href="docs/plans/2026-08-14-week-1-node-internals-express-ts-1.md">View Week 1 Plan</a>
    ·
    <a href="https://github.com/hadidwirsty/node-backend-mastery/issues">Report Issue</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
    <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
    <img src="https://img.shields.io/badge/Vitest-2.x-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest">
    <img src="https://img.shields.io/badge/Zod-3.x-3E67B1?style=for-the-badge&logo=zod&logoColor=white" alt="Zod">
    <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License">
  </p>
</div>

---

## 📖 About The Project

**Node.js Backend Mastery** is a modular backend project built with a **TypeScript-First & Clean Architecture** paradigm. It bridges the gap between frontend web development and enterprise-grade backend engineering by mastering core runtime mechanics, memory-safe data streaming, deterministic event loop behavior, strict schema boundary validation, and centralized observability.

### ✨ Key Architectural Features

- **🧠 Node.js Runtime Internals & Event Loop Lab:** Verified deterministic scheduling order across Microtasks (`process.nextTick`, `Promise`), Macrotasks (`setImmediate`, `setTimeout`), and Call Stack.
- **🌊 Memory-Safe Stream Pipelines:** High-throughput log transformation utilizing `node:stream/promises` `pipeline` and `Transform` streams with automatic backpressure and PII data masking (`***REDACTED***`).
- **🛡️ Centralized Error Handling & JSON Envelope:** Custom `AppError` hierarchy differentiating operational errors from system faults, returning unified RFC-style error envelopes.
- **🏷️ Distributed Tracing & Observability:** Injects and propagates `x-request-id` (Correlation ID) across the entire request lifecycle paired with ultra-fast structured JSON logging via `Pino`.
- **🔒 Strict Schema Validation:** Decoupled input validation middleware powered by `Zod` covering `req.body`, `req.query`, and `req.params`.
- **🧪 Test-Driven Development (TDD):** Comprehensive unit and integration test suite using `Vitest` and `Supertest` without physical port collision.
- **🛑 Graceful Shutdown:** Connection draining handling OS signals (`SIGINT`, `SIGTERM`) with failsafe timeouts for zero-downtime containerized deployments.

---

## 🛠️ Built With

- **Runtime:** [Node.js (v20+ LTS)](https://nodejs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Validation:** [Zod](https://zod.dev/)
- **Logger:** [Pino](https://getpino.io/) & [Pino-Pretty](https://github.com/pinojs/pino-pretty)
- **Testing:** [Vitest](https://vitest.dev/) & [Supertest](https://github.com/ladjs/supertest)
- **Runner:** [tsx](https://github.com/privatenumber/tsx)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/hadidwirsty/node-backend-mastery.git
   cd node-backend-mastery
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run in development mode (with hot-reloading):**

   ```bash
   npm run dev
   ```

4. **Execute automated test suites:**

   ```bash
   # Run all tests once
   npm test

   # Run tests in watch mode
   npm run test:watch
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 🔌 API Endpoints Reference

### 1. Health & Liveness Probe

- **Endpoint:** `GET /api/v1/health`
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "status": "UP",
      "uptime": 12.45,
      "timestamp": "2026-08-14T14:30:00.000Z"
    }
  }
  ```

### 2. Streaming Log Transformer & Sanitizer

- **Endpoint:** `POST /api/v1/logs/transform`
- **Header:** `Content-Type: text/plain`
- **Body:**
  ```text
  INFO 2026-08-14 User logged in with password=SecretPassword123
  WARN 2026-08-14 API request failed with token=BearerSecureToken999
  ```
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "level": "INFO",
        "timestamp": "2026-08-14",
        "message": "User logged in with password=***REDACTED***",
        "processedAt": "2026-08-14T14:30:05.123Z"
      },
      {
        "level": "WARN",
        "timestamp": "2026-08-14",
        "message": "API request failed with token=***REDACTED***",
        "processedAt": "2026-08-14T14:30:05.124Z"
      }
    ]
  }
  ```

---

## 🗺️ 5-Week Acceleration Roadmap

| Phase      | Focus Area                                            |      Status      | Deliverable                                        |
| :--------- | :---------------------------------------------------- | :--------------: | :------------------------------------------------- |
| **Week 1** | **Node.js Internals & Express TypeScript Core**       | ✅ **Completed** | _Streaming Data Pipeline & Express TS Boilerplate_ |
| **Week 2** | **PostgreSQL, Advanced SQL & Prisma ORM**             |   🔄 _Next Up_   | _E-Commerce Data Engine with Atomic Transactions_  |
| **Week 3** | **Clean Architecture, Dual-Token JWT & API Security** |   ⏳ _Planned_   | _Multi-Tenant SaaS Auth & RBAC API_                |
| **Week 4** | **Redis Caching, BullMQ Queues & WebSockets**         |   ⏳ _Planned_   | _Real-Time Task & Event Processing Service_        |
| **Week 5** | **Observability, Dockerization & Capstone Project**   |   ⏳ _Planned_   | _Production-Ready FinTech Management REST API_     |

---

## 📁 Project Structure

```
.
├── docs/
│   ├── plans/          # Atomic TDD Implementation plans
│   └── specs/          # Technical design documents & roadmaps
├── src/
│   ├── core/
│   │   ├── errors/     # AppError hierarchy & classification
│   │   ├── logging/    # Structured Pino logger
│   │   └── middlewares/# Correlation ID, Zod validation, Global error handler
│   ├── internals/      # Node.js Event Loop analyzer & diagnostic lab
│   ├── routes/         # Express API routers (health, log-stream)
│   ├── streams/        # Transform streams & memory-safe pipelines
│   ├── app.ts          # Express application factory & middleware setup
│   └── server.ts       # Server entrypoint & graceful shutdown lifecycle
├── tests/
│   ├── integration/    # Supertest HTTP integration test suites
│   └── unit/           # Isolated unit test suites
├── tsconfig.json       # TypeScript strict configuration
├── vitest.config.ts    # Vitest runner configuration
└── package.json
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👤 Author

**Muhammad Hadid Wiransetyo**

- GitHub: [@hadidwirsty](https://github.com/hadidwirsty)
- Repository: [node-backend-mastery](https://github.com/hadidwirsty/node-backend-mastery)
