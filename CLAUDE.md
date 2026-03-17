# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PaceSync** is a Next.js web app for fitness coaches to create and distribute structured workouts to athletes, with planned integration to sync with wearable devices (Garmin, COROS). Currently in MVP stage — watch device API integrations are pending vendor approval.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:3000
npm run build      # prisma generate && next build
npm run lint       # ESLint
npx prisma migrate dev   # Apply schema changes to the database
npx prisma studio        # Open Prisma GUI for database inspection
```

There are no automated tests — `test-workout.js`, `test-fit.js`, and `decode-garmin.js` are manual scripts for FIT file development.

## Architecture

**Stack:** Next.js App Router, TypeScript, Prisma + PostgreSQL (Neon serverless), NextAuth v5 (beta), Tailwind CSS v4.

### Auth Flow

NextAuth is configured in `app/api/auth/[...nextauth]/route.ts` using a `CredentialsProvider` with bcrypt password verification. The `auth()` helper is used to protect API routes and pages. Unauthenticated requests are redirected to `/login`. Session strategy is JWT.

### API Routes

All API routes live under `app/api/`. The pattern is:
1. Call `auth()` to get the session — return 401 if missing
2. Look up `session.user.email` in the database to get the full user record
3. Scope all queries to that user's data (coaches own workouts/groups)

### Database Models (Prisma)

Key relationships:
- `User` → creates `Workout`s with ordered `WorkoutStep`s
- `User` → creates `Group`s with `GroupMember`s (athletes)
- `WorkoutAssignment` links a `Workout` to a `Group` for scheduling
- `WorkoutSend` tracks when a workout is sent to an individual athlete
- `WatchConnection` stores Garmin/COROS OAuth tokens per user

### Page Structure

Pages under `app/` are server components by default. Interactive pages (workout builder, forms) use `'use client'`. The layout uses a persistent `Sidebar` + `Header` component structure.

- `/dashboard` — coach home
- `/workouts` — list, create (`/workouts/new`), view/edit (`/workouts/[id]`, `/workouts/[id]/edit`)
- `/athletes` — manage athletes and groups (`/athletes/groups/[id]`)
- `/schedule` — assign workouts to groups

### Workout Builder

The workout builder (`app/workouts/new/page.tsx`) manages a tree of steps: top-level steps and repeat blocks (which contain child steps). Steps have a `stepType` (warmup, main, interval, recovery, cooldown), a measure mode (distance or time with units), and a training zone.

### FIT File Export

`app/api/workouts/[id]/fit/route.ts` generates Garmin FIT files from workout data using `@garmin/fitsdk`. This is the bridge for syncing workouts to Garmin devices.

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEXTAUTH_SECRET` — random secret for JWT signing
- `NEXTAUTH_URL` — base URL (e.g. `http://localhost:3000`)
