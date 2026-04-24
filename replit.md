# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `artifacts/api-server` — Express API. Routes for code analysis, variant generation, conversion, and blog listing live in `src/routes/variants.ts`. AI logic is in `src/lib/ai.ts` (OpenAI via Replit AI Integrations). In-memory variant store in `src/lib/store.ts`.
- `artifacts/code-variants` — React + Vite frontend ("Code Variants Studio"). Pages: studio (`/`), techniques blog (`/techniques`, `/blog/:technique`), variant detail (`/variants/:id`).
- `artifacts/mockup-sandbox` — design canvas (unused by the product).

## AI

Uses `@workspace/integrations-openai-ai-server` (Replit AI Integrations / OpenAI). Model: `gpt-5.2`. No API key required from the user.
