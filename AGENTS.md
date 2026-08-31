# AGENTS.md — Midnight Coffee

## Purpose
This repository is an intentionally small e-commerce application used for AI-assisted software engineering training.

## Prime directive
Keep it simple. Readability and easy modification are more important than scalability or abstraction purity.

## Stack
- Node.js 22
- Next.js App Router
- React
- TypeScript
- npm
- JSON seed + in-memory server data

## Hard constraints
Do not introduce a database, ORM, Docker, customer authentication, real payment provider, Redis, queues, microservices, or architecture layers unless the task explicitly requires them.

Do not replace the in-memory datastore with persistence. Server restart resetting state is intentional.

Use integer cents for money in application logic.

## Design
Use `DESIGN.md` as the visual source of truth. Adapt it to the coffee shop rather than cloning Shopify. Keep the UI dark-first and restrained.

## Code behavior
- Prefer shallow folders and direct functions.
- Reuse existing code before creating abstractions.
- Admin credentials for this demo are intentionally `admin / admin1234` when admin is implemented.
- Never persist or expose full simulated card number, CVV or expiration.
- Public users have no login.

## Working method
Before coding:
1. Read the relevant existing files.
2. Read the current task under `tasks/`.
3. Make the smallest coherent implementation.

Before finishing:
1. Run `npm run lint`.
2. Run `npm run build`.
3. Fix failures caused by your changes.
4. Summarize changed files and verification results.

Avoid broad refactors unrelated to the task.
