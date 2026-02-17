# Wanderly - Project Architecture

This document provides a deep dive into the architecture of Wanderly to assist developers and AI agents.

## Core Services

### 1. API Gateway (`src/app/api/v1/gateway`)

The gateway acts as the single entry point for all API requests in production. It provides security through obfuscation.

- **Proxy Logic**: It reads the `X-Api-Target` header and uses an internal `fetch` to proxy the request. It is **body-agnostic**, meaning it uses `req.arrayBuffer()` to proxy the raw request data (JSON, multipart/form-data, etc.) without modification.
- **Security**: It ensures the target path starts with `/api/` to prevent external access to non-API routes.
- **Resilient Header Handling**: It filters sensitive headers (like `content-encoding`) to avoid conflicts during response streaming and preserves the original `Content-Type` for raw body integrity.

### 4. Admin Module (`src/app/api/admin`)

- **Security**: Protected by `x-admin-password` header check against `ADMIN_PASSWORD` env var.
- **Capabilities**: Full access to User management (Prisma + Firebase) and System Config.

### 2. Rate Limiting (`lib/rate-limit.ts`)

A custom in-memory rate limiter is used to prevent abuse.

- **Storage**: Uses a `Map<string, RateLimitEntry>` to track hits by IP address.
- **Instances**:
  - `gatewayRateLimiter`: 100 requests / minute (Used for the API Gateway).
  - `reviewsRateLimiter`: 10 requests / hour (Used for public review submissions).

### 3. Axios Interceptor (`lib/axios.ts`)

The shared axios instance transparently handles production routing.

- **Interceptors**:
  - Automatically adds Firebase auth tokens or guest session codes.
  - Automatically maps requests to `/api/wanderly-api` in production environments.

## Data Flow

```mermaid
graph TD
    UI[Frontend UI] --> Axios[Axios Instance]
    Axios --> Interceptor[Request Interceptor]
    Interceptor -- Prod --> Gateway[/api/wanderly-api]
    Interceptor -- Dev --> InternalApi
    Gateway --> RateLimit[Rate Limit Check]
    RateLimit -- Pass --> Proxy[Internal Fetch Proxy]
    Proxy --> InternalApi[/api/v1/...]
    InternalApi --> Prisma[Prisma ORM]
    Prisma --> DB[(PostgreSQL)]
```

## Established Conventions

### Authentication

- Use `withAuth(handler)` for all protected API routes.
- Client-side auth uses the `getToken()` helper from `lib/helper.ts`.

### Routing

- Group access is managed via 6-character unique codes.
- Slugs are preferred over IDs for user-facing URLs (migration in progress).

### CI/CD

- GitHub Action `create-pr` triggers on pushes to `dev`.
- It auto-creates/updates a PR to `prod` using the latest commit message as the title for clarity.
