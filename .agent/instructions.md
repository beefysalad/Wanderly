# Wanderly - AI Agent Rules & Conventions

This file provides context and rules for any AI agent working on the Wanderly project.

## Project Overview

Wanderly is a group trip planning platform built with Next.js 15, Prisma 6, and Firebase Auth.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4, TanStack Query.
- **Backend**: Next.js API Routes, Prisma 6, PostgreSQL.
- **Auth**: Firebase Authentication (Client) + Firebase Admin SDK (Server).
- **Communication**: Socket.io for real-time updates.

## Architecture & Conventions

### 1. API Gateway (Obfuscation)

In production, all API calls MUST route through the gateway to hide the internal directory structure.

- **Gateway Endpoint**: `/api/wanderly-api` (internally mapped to `src/app/api/v1/gateway/route.ts`).
- **Trigger**: The Request Interceptor in `lib/axios.ts` handles this automatically.
- **Header**: Use `X-Api-Target` to specify the real internal API path (e.g., `/api/groups/[id]`).
- **Testing**: Enable via `NEXT_PUBLIC_ENABLE_GATEWAY=true` in `.env`.

### 2. Rate Limiting

The gateway is protected by a rate limiter.

- **Limit**: 100 requests per minute per IP.
- **Implementation**: Managed by `gatewayRateLimiter` in `lib/rate-limit.ts`.
- **Response**: Returns `429 Too Many Requests`.

### 3. API Authentication

- Use the `withAuth` HOC in `lib/auth/with-auth.ts` to protect API routes.
- The `AuthContext` provides the authenticated user's `uid` and other details.

### 4. Database Access

- Use the singleton Prisma client in `lib/prisma.ts`.
- Models are defined in `prisma/schema.prisma`.

### 5. Git & PR Workflow

- **Branching**: Work is primarily done in `dev` and merged to `prod`.
- **PR Titles**: The `create-pr` GitHub Action automatically uses the **latest commit message subject** as the PR title.

## Directory Structure

- `src/app/`: App router pages and components.
- `src/app/api/`: Internal API routes (hidden from browser in prod).
- `lib/`: Shared utilities and singleton instances (prisma, axios, firebase).
- `components/`: UI components (shadcn/ui elements).
- `.agent/`: AI agent instructions and architecture documentation.

## Guidelines

- **Always use `lib/axios.ts`** for API calls to ensure gateway/auth headers are handled.
- **Never expose internal API paths** directly in frontend code; let the axios interceptor handle the mapping.
- **Check `lib/helper.ts`** for existing utility functions before writing new ones.
