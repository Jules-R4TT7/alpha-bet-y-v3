# Alpha-bet-y Technical Architecture

## Overview

Alpha-bet-y is a real-time competitive word bidding game where players race to type valid words under letter constraints. This document defines the production architecture targeting 50,000+ users by end of April 2026.

## Demo Review Summary

The existing demo (alpha-bet-y-v2.onrender.com) implements:
- **Game Mechanics**: 2-player word racing with letter constraints, timed 20s rounds
- **Bidding System**: Players bid up point targets or call, adding strategic depth
- **Scoring**: 1pt (<=5 chars), 2pt (6-8 chars), 3pt (9+ chars)
- **Letter Tiers**: Easy (S,C,P,B,M,R,T,A,D - min 5 chars), Medium (E,F,G,H,I,L,N,O,W,U - min 4), Hard (V,K,J,Y - min 4), Brutal (Q,X,Z - min 4)
- **Word Rules**: Dictionary validation, no duplicates, no extensions of played words
- **UI**: Dark themed game interface with bidding controls, score displays, round tracking

## Tech Stack Decision

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 15 (App Router) | SSR for SEO, API routes, React 19, huge ecosystem |
| **Language** | TypeScript | Type safety across full stack |
| **Real-time** | Socket.io | Battle-tested WebSocket lib, auto-reconnect, rooms, fallback transport |
| **Database** | PostgreSQL + Prisma | Relational data (users, games, leaderboards), type-safe ORM |
| **Cache/State** | Redis | Game state, matchmaking queue, session leaderboards, pub/sub |
| **Auth** | NextAuth.js v5 | Social logins (Google, Apple) for viral growth, session management |
| **Styling** | Tailwind CSS | Rapid UI development, mobile-first |
| **Testing** | Vitest + Playwright | Fast unit tests + E2E browser testing |
| **CI/CD** | GitHub Actions | Lint, typecheck, test, build on every PR |
| **Hosting** | Render | Custom Node.js server with WebSocket support, auto-deploy |
| **Validation** | Zod | Runtime schema validation for game events and API inputs |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                   │
│  Next.js App Router │ React 19 │ Tailwind │ Socket.io │
└──────────┬───────────────────────────┬──────────────┘
           │ HTTP/SSR                  │ WebSocket
           ▼                           ▼
┌─────────────────────────────────────────────────────┐
│              Node.js Custom Server (Render)           │
│  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  Next.js      │  │  Socket.io Server             │  │
│  │  API Routes   │  │  - Matchmaking                │  │
│  │  SSR Pages    │  │  - Game rooms                 │  │
│  │  Auth (NAuth) │  │  - Real-time bidding/typing   │  │
│  └──────┬───────┘  └──────────┬───────────────────┘  │
│         │                      │                      │
│         ▼                      ▼                      │
│  ┌──────────────┐  ┌──────────────────────────────┐  │
│  │  Prisma ORM  │  │  Redis (ioredis)             │  │
│  └──────┬───────┘  │  - Game state (TTL)          │  │
│         │          │  - Matchmaking queue          │  │
│         │          │  - Leaderboard (sorted sets)  │  │
│         │          │  - Rate limiting              │  │
│         │          └──────────────────────────────┘  │
└─────────┼───────────────────────────────────────────┘
          ▼
┌──────────────────┐
│   PostgreSQL     │
│  - Users/Auth    │
│  - Game history  │
│  - Daily challs  │
│  - Leaderboards  │
└──────────────────┘
```

## Key Design Decisions

### 1. Monolithic Server (not microservices)
Single Node.js process serves both Next.js pages and Socket.io connections. This simplifies deployment, reduces latency, and is appropriate for our scale target (50K users). We can split later if needed.

### 2. Redis for Game State
Active game state lives in Redis with TTL expiry, not PostgreSQL. This gives sub-millisecond reads for real-time gameplay. Games are persisted to PostgreSQL only on completion for history/leaderboards.

### 3. Server-side Dictionary Validation
Word validation happens server-side only to prevent cheating. We'll use a compressed trie structure for O(1) lookups against a standard English dictionary.

### 4. Social Auth First
Google and Apple sign-in as primary auth methods. Low friction onboarding is critical for viral growth. Guest play available but limited (no leaderboard, no daily challenges).

### 5. Mobile-First Design
Tailwind responsive design targeting mobile browsers first. PWA capabilities planned for phase 2. Native apps deferred until user base justifies the investment.

## Directory Structure

```
alpha-bet-y/
├── .github/workflows/    # CI/CD pipeline
├── prisma/               # Database schema & migrations
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router pages & API routes
│   │   ├── api/          # REST endpoints (auth, leaderboard, etc.)
│   │   ├── play/         # Game UI
│   │   ├── login/        # Auth pages
│   │   └── layout.tsx    # Root layout
│   ├── components/       # Shared React components
│   ├── game/             # Game logic (scoring, validation, constants)
│   ├── lib/              # Shared utilities (db, redis, auth)
│   └── server/           # Custom server with Socket.io
├── docs/                 # Architecture & technical docs
└── tests/                # E2E tests (Playwright)
```

## Scaling Path

1. **Now (0-10K users)**: Single Render instance, managed PostgreSQL, Redis
2. **10K-50K users**: Horizontal scaling with Redis pub/sub for multi-instance Socket.io, connection pooling (PgBouncer)
3. **50K+ users**: CDN for static assets, database read replicas, consider dedicated matchmaking service
