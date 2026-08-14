# Frontend to Backend Engineer Acceleration Roadmap — Design Document

**Tanggal:** 2026-08-14  
**Status:** Approved  
**Target Role:** Mid-Level Backend Engineer (Node.js & TypeScript Ecosystem)  
**Profil Learner:** 3 Tahun Frontend Experience (React, Next.js, Vue, Nuxt, Angular, TypeScript)  
**Alokasi Waktu:** ~45–50 Jam/Minggu (Weekdays 8 jam/hari, Weekend 4–6 jam/hari) selama 5 Minggu

---

## 1. Ringkasan Eksekutif

Dokumen ini merancang peta jalan (_roadmap_) pembelajaran terstruktur untuk transisi dari Frontend Engineer berpengalaman ke Backend Engineer profesional menggunakan ekosistem Node.js dan TypeScript.

Roadmap ini menyintesis keunggulan dari 3 kurikulum kursus Udemy terbaik:

1. _NodeJS: The Complete Guide_ (Maximilian Schwarzmüller) — Komprehensif: Express, MVC, REST, GraphQL, WebSocket.
2. _The Complete Node.js Bootcamp: JS, TS, APIs, SQL & NoSQL_ — Modern TypeScript, Prisma, PostgreSQL & MongoDB.
3. _Node.js, Express, MongoDB & More_ (Jonas Schmedtmann) — Node.js Internals (Event Loop, Streams, Thread Pool), Architecture & Security.

Dengan memanfaatkan keahlian TypeScript dan pemahaman siklus HTTP dari sisi frontend, materi dasar yang tidak relevan (seperti JavaScript dasar, DOM, dan Server-Side Templating Engines seperti Pug/EJS) dilewati. Pembelajaran difokuskan 100% pada kompetensi inti backend: _Runtime Internals, Database Modeling & Transactions, Clean Layered Architecture, Security & Authentication, In-Memory Caching & Background Queues, Automated Testing,_ serta _Containerization & Deployment_.

---

## 2. Tujuan & Kriteria Sukses

### 2.1 Tujuan Utama

- Menguasai arsitektur internal Node.js runtime untuk mampu mendiagnosis bottleneck performa, memory leak, dan blocking I/O.
- Merancang dan mengoptimalkan database relasional (PostgreSQL) menggunakan SQL murni dan ORM modern bertipe aman (Prisma).
- Membangun RESTful API berskala enterprise dengan Clean Layered Architecture (Controller-Service-Repository), validasi ketat (Zod), dan penanganan error terpadu.
- Mengimplementasikan sistem autentikasi standar industri (JWT Access + Refresh Token Rotation + Redis Blacklist) dan proteksi keamanan berbasis OWASP API Top 10.
- Menguasai optimasi performa dengan Redis Caching, pemrosesan tugas latar belakang dengan BullMQ, dan pengujian otomatis terisolasi (Vitest & Supertest).
- Mengemas aplikasi backend ke dalam multi-stage Docker container siap rilis (_production-grade_).

### 2.2 Kriteria Sukses (Deliverables)

- [ ] **Milestone 1:** Lulus implementasi _Streaming File Processor & Express TS Boilerplate_ dengan unified error handler dan Zod validation.
- [ ] **Milestone 2:** Lulus perancangan skema PostgreSQL normal (3NF), migrasi Prisma, transaksi atomik ACID, dan seeder data.
- [ ] **Milestone 3:** Lulus pembuatan _Multi-Tenant Auth & User Management API_ dengan refresh token rotation, RBAC, dan proteksi OWASP.
- [ ] **Milestone 4:** Lulus integrasi Redis Caching, BullMQ worker queue, WebSockets, dan >80% test coverage menggunakan Vitest & Supertest.
- [ ] **Milestone 5:** Selesai Capstone Project lengkap dengan OpenAPI (Swagger) documentation, multi-stage Dockerfile (<150MB), dan GitHub Actions CI pipeline.

---

## 3. Pendekatan yang Dipilih: Modern TypeScript-First & Production Architecture

- **Rationale:** Menghindari penulisan JavaScript mentah yang tidak terpakai di lingkungan profesional modern, memanfaatkan kemahiran TypeScript yang sudah dimiliki, dan langsung menerapkan pola arsitektur yang digunakan oleh tim _engineering_ skala menengah hingga enterprise.
- **Trade-off & Mitigasi:** Membutuhkan pemahaman konsep arsitektur tingkat lanjut lebih cepat. Dimodelkan melalui _milestone project_ bertahap setiap minggunya.

---

## 4. Kurikulum Terperinci Per Fase (5 Minggu)

```
┌─────────────────────────────────────────────────────────────────────────┐
│               5-WEEK INTENSIVE BACKEND ROADMAP (TS + NODE)              │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
   ┌─────────────────────────────────┴─────────────────────────────────┐
   ▼                                                                   ▼
[Week 1: Runtime & Express TS]                       [Week 2: PostgreSQL & Prisma ORM]
 - Event Loop, Libuv, Streams                         - Normalization, Indexing, ACID
 - Express Pipeline & Zod                             - Prisma Migrations & Relations
   │                                                                   │
   └─────────────────────────────────┬─────────────────────────────────┘
                                     │
                                     ▼
                  [Week 3: Clean Architecture & Security]
                   - Controller -> Service -> Repository
                   - JWT Refresh Token Rotation & RBAC
                   - OWASP API Top 10 Hardening
                                     │
   ┌─────────────────────────────────┴─────────────────────────────────┐
   ▼                                                                   ▼
[Week 4: Performance & Testing]                      [Week 5: DevOps & Capstone]
 - Redis Caching & BullMQ Queues                      - Structured Logging (Pino)
 - WebSockets (Realtime)                              - Docker & Docker Compose
 - Vitest + Supertest (>80% Coverage)                 - OpenAPI Docs & Production CI
```

---

### 4.1 Minggu 1: Node.js Internals, Asynchronous I/O & Express.js with TypeScript

#### Topik Pembelajaran:

1. **Arsitektur Runtime Node.js:**
   - Komponen V8 Engine vs Libuv (C++ library).
   - Event Loop Architecture: 6 fase (Timers, Pending Callbacks, Idle/Prepare, Poll, Check `setImmediate`, Close Callbacks).
   - Microtask Queue (`process.nextTick`, Promise callbacks) vs Macrotask Queue.
   - Libuv Thread Pool: Kapan thread pool digunakan (File I/O, DNS, Crypto, Zlib), konfigurasi `UV_THREADPOOL_SIZE`.
   - Single-Threaded Concurrency: Menghindari CPU-bound blocking pada main event loop.
2. **Node.js Core Modules & Data Streaming:**
   - `stream` module: Readable, Writable, Duplex, dan Transform streams. `pipeline` API untuk memory-safe streaming.
   - `buffer` module: Alokasi memori biner, manipulasi buffer, dan konversi encoding (UTF-8, Base64, Hex).
   - `events` module: `EventEmitter` pattern, memory leak listeners handling.
   - `fs/promises` & `path` module.
3. **Express.js Fundamental dengan TypeScript:**
   - Inisialisasi lingkungan modern: `typescript`, `tsx`, `@types/node`, `@types/express`, ESLint, Prettier.
   - Request/Response Lifecycle dan Middleware Pipeline (`app.use`, route-specific middleware, third-party middleware).
   - Unified Error Handling: Pembuatan kelas kustom `AppError` turunan dari `Error`, Centralized Error Handler Middleware yang membedakan _Operational Errors_ vs _Programming/Fatal Errors_.
   - Request Validation: Validasi skema input (body, query, params) menggunakan **Zod** dengan custom validation middleware.

#### Milestone Project 1:

- **Nama:** _Streaming Data Pipeline & Express TS Core Boilerplate_
- **Spesifikasi:** Server Express TypeScript yang menerima unggahan file log/CSV besar, memproses dan mengekstrak metrik menggunakan Transform Streams tanpa membebani RAM, dilengkapi Zod validation middleware, request latency logger, dan global error handler.

---

### 4.2 Minggu 2: Relational Databases (PostgreSQL), Advanced SQL & Prisma ORM

#### Topik Pembelajaran:

1. **Fundamental Database Relasional (PostgreSQL):**
   - Prinsip Desain Skema: Entitas, Primary Key (UUID vs Auto-incrementing BigInt), Foreign Key, Aturan On Delete/On Update (`CASCADE`, `RESTRICT`, `SET NULL`).
   - Normalisasi Data: 1NF, 2NF, 3NF untuk integritas data dan eliminasi redundansi.
   - Indexing Strategies: B-Tree Indexes, Composite/Compound Indexes, Unique Indexes, Partial Indexes. Kapan index mempercepat query dan kapan memperlambat write.
2. **Advanced SQL Mastery:**
   - Relasi Kompleks & JOIN: `INNER JOIN`, `LEFT JOIN`, `RIGHT JOIN`, `FULL OUTER JOIN`, Self-join.
   - Agregasi & Grouping: `COUNT`, `SUM`, `AVG`, `GROUP BY`, `HAVING`.
   - Transaksi Database: `BEGIN`, `COMMIT`, `ROLLBACK`, Prinsip ACID (Atomicity, Consistency, Isolation, Durability).
   - Isolation Levels: `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE` dan fenomena _Dirty Read_, _Non-repeatable Read_, _Phantom Read_.
3. **Modern ORM dengan Prisma:**
   - Prisma Schema: Model, Relations (`@relation` 1:1, 1:N, N:M), Enums, Field attributes (`@id`, `@default`, `@updatedAt`).
   - Prisma Migrate: Siklus hidup migrasi database, generated client.
   - Prisma Client CRUD & Advanced Queries: Filtering, Pagination (Offset-based vs Cursor-based), Nested writes, Relation queries (`include` vs `select`).
   - Atomic Transactions: `prisma.$transaction([ ... ])` dan Interactive Transactions `prisma.$transaction(async (tx) => { ... })`.
   - Seeding Database: Script seeding otomatis untuk data development dan testing.
4. **Perbandingan NoSQL (MongoDB & Mongoose):**
   - Karakteristik Document DB, konsep Embedding vs Referencing, analisis kapan memilih Relational (SQL) vs Document (NoSQL).

#### Milestone Project 2:

- **Nama:** _E-Commerce Engine Data Layer_
- **Spesifikasi:** Skema database e-commerce lengkap (Users, Products, Categories, Orders, OrderItems, Inventory) dengan PostgreSQL dan Prisma. Fitur: Paginasi cursor, filter multi-kriteria, transaksi checkout atomik (mengurangi stok dan membuat order dalam satu transaksi yang aman dari race-condition), dan script database seed.

---

### 4.3 Minggu 3: Clean Architecture, Authentication, Authorization & API Security

#### Topik Pembelajaran:

1. **Pola Arsitektur Layered (3-Tier Architecture):**
   - **Routing Layer:** Mendefinisikan endpoint, HTTP method, dan mengikat middleware.
   - **Controller Layer:** Menerima input HTTP, memanggil Service, dan mengembalikan HTTP response / status code yang tepat.
   - **Service Layer (Business Logic):** Logika murni bisnis, independen dari framework HTTP.
   - **Repository / DAL Layer:** Abstraksi akses ke database (Prisma Client).
   - Prinsip Dependency Inversion & Single Responsibility Principle (SRP).
2. **Autentikasi & Otorisasi:**
   - Kriptografi Kata Sandi: Hashing satu arah menggunakan **Argon2id** atau **Bcrypt** dengan salt factor yang aman.
   - JSON Web Token (JWT): Struktur JWT (Header, Payload, Signature), stateless session.
   - Dual-Token Pattern:
     - _Access Token:_ Masa aktif singkat (15 menit), dikirim via header `Authorization: Bearer <token>`.
     - _Refresh Token:_ Masa aktif panjang (7 hari), disimpan aman di `HttpOnly` Secure Cookie atau database.
     - _Refresh Token Rotation & Revocation:_ Mengganti refresh token setiap kali digunakan dan mendeteksi token reuse untuk mencegah pencurian token.
   - Role-Based Access Control (RBAC): Middleware penjaga hak akses berdasarkan peran (e.g. `USER`, `ADMIN`, `MANAGER`) dan permissions granuler.
3. **Keamanan API (OWASP API Security Top 10):**
   - HTTP Security Headers dengan `helmet`.
   - Cross-Origin Resource Sharing (`cors`) dengan whitelist domain spesifik.
   - Rate Limiting: Mencegah serangan brute-force dan DoS menggunakan `express-rate-limit`.
   - Sanitasi Input: Pencegahan NoSQL injection, XSS, dan HTTP Parameter Pollution (`hpp`).
4. **File Management & Cloud Storage:**
   - Parsing `multipart/form-data` dengan `multer`.
   - Kompresi & manipulasi gambar dengan `sharp`.
   - Upload streaming ke Object Storage (S3 / Supabase Storage / MinIO).

#### Milestone Project 3:

- **Nama:** _Enterprise Multi-Tenant Auth & Membership API_
- **Spesifikasi:** REST API lengkap dengan struktur Controller-Service-Repository. Fitur registrasi, verifikasi email, login dengan JWT Dual-Token (Access + Refresh Token rotation), middleware proteksi RBAC, update profil + upload avatar ke cloud storage, serta security headers dan rate limiting.

---

### 4.4 Minggu 4: Caching (Redis), Background Queues (BullMQ), WebSockets & Testing

#### Topik Pembelajaran:

1. **In-Memory Data Caching dengan Redis:**
   - Struktur data Redis: Strings, Hashes, Lists, Sets, Sorted Sets.
   - Pola Caching: _Cache-Aside (Lazy Loading)_, _Write-Through_, dan _TTL (Time-To-Live)_.
   - Strategi Invalidation Cache: Menghapus cache saat data di database diperbarui.
   - Penanganan Isu Caching: Mencegah _Cache Stampede / Thundering Herd_ dan _Cache Penetration_.
2. **Asynchronous Background Jobs dengan BullMQ & Redis:**
   - Konsep Producer, Queue, dan Worker.
   - Penanganan tugas berat: Pengiriman email notifikasi, generasi laporan PDF/Excel, webhook retries.
   - Konfigurasi Job: Delayed jobs, repeatable/cron jobs, exponential backoff retry mechanism, event listeners (`completed`, `failed`).
3. **Komunikasi Real-Time (WebSockets):**
   - Protokol WebSocket vs HTTP Polling / Server-Sent Events (SSE).
   - Implementasi dengan `Socket.io` atau `ws` di TypeScript.
   - Autentikasi koneksi WebSocket via JWT pada saat handshake.
   - Konsep Rooms dan Namespaces untuk isolasi komunikasi antar pengguna/grup.
4. **Pengujian Otomatis Backend (Automated Testing):**
   - Piramida Pengujian: Unit Tests vs Integration Tests vs End-to-End (E2E).
   - Test Runner: **Vitest** (kecepatan tinggi, native TypeScript support) atau Jest.
   - Integration Testing API dengan **Supertest**: Menguji endpoint HTTP secara riil.
   - Database Testing Strategy: Menjalankan test database terisolasi (PostgreSQL via Docker/Testcontainers) dengan migrasi dan rollback otomatis per test suite.
   - Mocking: Mocking external API services dan queue workers.

#### Milestone Project 4:

- **Nama:** _High-Performance Real-Time Task & Event Processing Service_
- **Spesifikasi:** Sistem API yang menerapkan cache Redis untuk endpoint read-heavy, antrean BullMQ untuk memproses task berat di latar belakang, push notifikasi real-time via WebSocket ke room pengguna terkait saat task selesai, dan dilengkapi unit & integration test suite dengan coverage >80%.

---

### 4.5 Minggu 5: Observability, Dockerization, OpenAPI Docs & Capstone Project

#### Topik Pembelajaran:

1. **Structured Logging & Observability:**
   - Logging terstruktur (JSON format) dengan **Pino** (high-performance) atau **Winston**.
   - Log Levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
   - Request Tracing: Pembuatan Correlation ID / Request ID (`x-request-id`) yang disematkan di seluruh log selama lifecycle request berlangsung.
   - Health Checks & Readiness Probes: Endpoint `/healthz` (liveness) dan `/ready` (memeriksa konektivitas Database & Redis).
2. **Dokumentasi API Otomatis (OpenAPI 3.0 / Swagger):**
   - Standar OpenAPI Specification.
   - Integrasi otomatis dari skema validasi Zod menggunakan `@asteasolutions/zod-to-openapi` atau Swagger-UI-Express.
   - Menyajikan dokumentasi interaktif yang dapat diuji langsung oleh frontend/klien.
3. **Containerization & CI/CD:**
   - Multi-stage `Dockerfile`:
     - Stage 1: Dependency installation.
     - Stage 2: TypeScript build (`tsc`).
     - Stage 3: Production runner (hanya menyertakan production node_modules dan dist JS, user non-root `node`, ukuran image < 150MB).
   - `docker-compose.yml`: Orkestrasi lokal untuk Backend App, PostgreSQL, Redis, dan Adminer.
   - CI Pipeline (GitHub Actions): Otomasi linting, type-checking (`tsc --noEmit`), eksekusi unit/integration test, dan build container image.

#### Milestone Project 5 (Final Capstone):

- **Nama:** _Production-Ready FinTech / Booking Management REST API Platform_
- **Spesifikasi:** Platform backend monolitik modular lengkap yang menggabungkan seluruh modul minggu 1–5:
  - Clean Architecture (TypeScript, Express, Prisma, PostgreSQL).
  - Auth System: Access + Refresh Token Rotation, Password reset via email queue.
  - Core Business Engine: Transaksi atomik dan locking, caching layer Redis.
  - Background Processor: BullMQ worker untuk invoice generation dan notifikasi.
  - Real-time updates: WebSocket room notifications.
  - Keamanan & Observabilitas: OWASP protection, Pino structured logging, `/healthz`.
  - Dokumentasi: Swagger UI interaktif via OpenAPI.
  - DevOps: Multi-stage Dockerfile, Docker Compose, dan GitHub Actions CI config.

---

## 5. Matriks Sumber Belajar Gratis Pengganti Udemy

Untuk menghemat biaya akibat kurs dolar tanpa mengurangi kualitas materi:

| Topik                              | Referensi Resmi & Sumber Utama                                | Link / Sumber Belajar                                                                                                  |
| :--------------------------------- | :------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| **Node.js Internals & Event Loop** | Node.js Official Guides & Libuv Documentation                 | [nodejs.org/en/learn](https://nodejs.org/en/learn), Bert Belder's Event Loop Deep Dive                                 |
| **Streams & Buffers**              | Node.js Stream Handbook (Substack) & Official Docs            | [Node.js Streams Guide](https://nodejs.org/api/stream.html)                                                            |
| **Express & TypeScript Setup**     | TypeScript Official Handbook & Express Best Practices         | [expressjs.com](https://expressjs.com), [typescriptlang.org](https://www.typescriptlang.org)                           |
| **PostgreSQL & Database Design**   | PostgreSQL Tutorial & Use The Index, Luke                     | [postgresqltutorial.com](https://www.postgresqltutorial.com), [use-the-index-luke.com](https://use-the-index-luke.com) |
| **Prisma ORM**                     | Prisma Official Docs & Architecture Guides                    | [prisma.io/docs](https://www.prisma.io/docs)                                                                           |
| **Backend Clean Architecture**     | Microsoft Architecture Guides & Node Best Practices Repo      | [goldbergyoni/nodebestpractices](https://github.com/goldbergyoni/nodebestpractices)                                    |
| **API Security**                   | OWASP API Security Top 10                                     | [owasp.org/www-project-api-security](https://owasp.org/www-project-api-security)                                       |
| **Redis & Caching Patterns**       | Redis University (Free Courses) & Redis Developer Hub         | [university.redis.io](https://university.redis.io)                                                                     |
| **Message Queues (BullMQ)**        | BullMQ Official Documentation & Guide                         | [docs.bullmq.io](https://docs.bullmq.io)                                                                               |
| **Automated Testing**              | Vitest Official Docs & Supertest Reference                    | [vitest.dev](https://vitest.dev)                                                                                       |
| **Docker for Node.js**             | Docker Official Node.js Best Practices & Snyk Container Guide | [docs.docker.com/language/nodejs](https://docs.docker.com/language/nodejs)                                             |

---

## 6. Out of Scope (Tidak Dibahas Pada Iterasi Ini)

Untuk menjaga fokus dan mencegah _cognitive overload_ selama 5 minggu intensif:

- Server-Side HTML Rendering (Pug, EJS, Handlebars) — _Dilewati karena sudah menguasai Next.js/Nuxt_.
- Microservices & Message Broker tingkat enterprise (Apache Kafka, RabbitMQ, gRPC) — _Fokus pada Modular Monolith dengan Redis/BullMQ terlebih dahulu_.
- Kubernetes (K8s) Cluster Management & Helm Charts — _Fokus pada Docker & Docker Compose_.
- Serverless Architecture (AWS Lambda / Cloud Functions) — _Fokus pada Long-running Containerized Server_.

---

## 7. Verifikasi & Self-Review Checklist

- [x] Tidak ada placeholder `TODO` atau `[TBD]` yang tertinggal.
- [x] Tidak ada kontradiksi internal antar fase pembelajaran.
- [x] Kriteria sukses dan deliverables proyek setiap minggu terdefinisi secara presisi.
- [x] Mengakomodasi alokasi waktu nyata (~45–50 jam/minggu) secara realistis.
- [x] Selaras dengan standar Clean Code dan Technical Constitution project.

---

## 8. Langkah Selanjutnya

Dokumen desain ini menjadi fondasi bagi eksekusi belajar Anda. Langkah berikutnya adalah menggunakan workflow `/scaffold-plan` untuk memecah **Minggu 1 (Fase 1)** menjadi _task-task_ implementasi praktis langkah demi langkah di workspace ini.
