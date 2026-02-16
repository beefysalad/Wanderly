# Travel Schedule App - AI Context & Documentation

## Project Overview

This application is a group travel planner designed to help users organize trips, manage itineraries, split expenses, and coordinate with friends. It focuses on a premium, mobile-first user experience.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Framer Motion for animations
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Firebase Admin SDK & Client SDK (Custom integration)
- **State/Data Fetching**: TanStack Query (React Query) v5
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## Architecture & Folder Structure

- `/src/app`: App Router pages and layouts.
- `/src/app/api`: Backend API endpoints.
- `/src/components/pages`: Page-specific components (e.g., `Budget`, `Dashboard`, `Group`).
- `/src/components/shared`: Reusable UI components (e.g., `ExpenseForm`, `TripCard`).
- `/src/lib`: Utilities, database clients (`prisma.ts`), and helpers.
- `/src/hooks`: Custom hooks (e.g., `useProfile`, `useToast`).
- `/prisma`: Database schema and migrations.

## Key Data Models (Prisma)

- **User**: Core user profile, linked to Firebase Auth ID.
- **Group**: A collection of users (Members) who share trips.
- **Trip**: specific travel event belonging to a Group.
- **Activity**: A schedule item within a Trip.
- **Expense**: A cost record, paid by a User, split among GroupMembers.
- **Budget**: Planned expenditure for a Trip or Activity.
- **PaymentLog**: Record of settlements between users.
- **Notification**: System for alerting users of updates.

## Design System & UX

- **Aesthetic**: "Clean, flat, and modern". Avoids heavy shadows or gradients in favor of solid colors and subtle borders.
- **Mobile-First**: All views must be responsive and optimized for mobile usage (touch targets, readable text).
- **Navigation**: Bottom navigation bar on mobile, often hidden on detailed sub-pages.

## Development Workflows

- **Database Updates**: Modify `prisma/schema.prisma`, then run `npx prisma migrate dev` (or `npx prisma db push` for prototyping).
- **Icons**: Use `lucide-react`. Ensure consistent sizing.
- **API Requests**: Use `axios` (configured in `src/lib/axios.ts` or similar) or `fetch`.
- **Authentication**: Use `useProfile` hook to access current user context.
