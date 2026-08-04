# Contributing to Coding Club SATI — Backend

Thanks for helping build the Coding Club SATI backend. This document covers branch naming, commit conventions, and the pull request process — follow it for every change, no matter how small, so we keep a clean history and a live API that never breaks.

## Table of Contents

- [Before You Start](#before-you-start)
- [Branch Naming Conventions](#branch-naming-conventions)
- [Commit Message Convention](#commit-message-convention)
- [Development Workflow](#development-workflow)
- [Code & Architecture Standards](#code--architecture-standards)
- [Pull Request Rules](#pull-request-rules)
- [Protected Branches](#protected-branches)
- [Reporting Bugs & Requesting Features](#reporting-bugs--requesting-features)

## Before You Start

Set up your local environment by following the [README](README.md#getting-started) — install dependencies, configure `.env`/`.env.dev`, and confirm the server boots (`npm run dev`) and responds at `GET /ping` before you start making changes.

## Branch Naming Conventions

Branch names are lowercase, hyphen-separated, and prefixed with the type of work:

| Prefix | For | Example |
|---|---|---|
| `feature/` | New functionality | `feature/event-register-click-tracking` |
| `fix/` | Bug fixes | `fix/gallery-cover-validation` |
| `docs/` | Documentation only | `docs/update-api-reference` |
| `refactor/` | Internal restructuring, no behavior change | `refactor/extract-pagination-helper` |
| `test/` | Adding or updating tests | `test/contact-info-coverage` |
| `chore/` | Tooling, dependency bumps, config | `chore/bump-mongoose-v9` |
| `hotfix/` | Urgent production fixes | `hotfix/cors-origin-misconfig` |

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/). Keep commits small and atomic — one logical change per commit — so the history reads as a changelog on its own.

```
<type>: <short, imperative description>
```

| Type | Use for |
|---|---|
| `feat` | A new endpoint, field, or capability |
| `fix` | A bug fix |
| `docs` | Documentation changes (README, API reference, comments) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | A performance improvement |
| `test` | Adding or updating test scripts |
| `chore` | Dependency bumps, config, tooling, anything else |
| `build` | Changes to build/start scripts or dependency versions |

**Examples**

```bash
git commit -m "feat: add featured-photo cap to gallery album endpoint"
git commit -m "fix: return 404 instead of 500 for a missing batch"
git commit -m "docs: document the contact-info PUT endpoint"
git commit -m "refactor: extract shared pagination helper"
git commit -m "test: add coverage for register-click deduplication"
```

## Development Workflow

Never commit directly to `main` or `dev`. For every task:

1. **Sync with `dev`:**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create your branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make atomic, conventional commits** as you work (see above).

4. **Verify before pushing** — all of the following should be true:
   - The server starts cleanly with no errors: `npm start` (or `npm run dev`)
   - No leftover debug `console.log` statements (intentional error/warning logging via `console.error`/`console.warn`, as used throughout `utils/errorHandler.js` and elsewhere, is fine and expected)
   - Any new or changed mutating endpoint validates its input with a Zod schema, wired up through the existing `validateBody` middleware
   - The relevant script in `tests/` passes against your local server, or a new one is added for new endpoints — see [Testing](README.md#testing) and `tests/_helpers.sh` for the pattern
   - No `.env` files, credentials, or other secrets are staged (`git status` before committing)
   - `API.md` / `MODELS.md` are updated if you added, removed, or changed a route, request/response shape, or schema field

5. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code & Architecture Standards

To keep the codebase consistent as it grows, follow the patterns already established rather than introducing new ones for the same problem:

- **ES modules** throughout (`import`/`export`); target Node ≥ 20.6.0.
- **Thin controllers.** For standard create/update/delete, use the shared factories in `utils/crudHandlers.js` (`createHandler`, `updateHandler`, `removeHandler`) instead of hand-rolled `try/catch` blocks — they already handle validation hooks, error normalization, and consistent responses.
- **Validate everything.** Every mutating route pairs a Zod schema (defined alongside its Mongoose model) with the `validateBody` middleware. Use `.strict()` so unexpected fields are rejected, not silently ignored.
- **Consistent errors.** Route errors through `utils/errorHandler.js`'s `handleControllerError` rather than writing ad hoc `res.status(500)` handling.
- **Consistent auth.** Gate admin-only routes with `attachAdminStatus` + `requireAdmin`, matching how existing routes in `routes/` do it.
- **No hardcoded config or secrets.** Read configuration from `process.env`; if you add a new environment variable, document it in `.env.example` and the README's environment variable table.
- **Match existing naming.** Follow the naming already used for similar handlers/files in the resource you're touching (e.g. `fetchOne`, not `getById`) so the codebase reads uniformly across resources.

## Pull Request Rules

- **Target `dev`**, never `main`, for feature and fix PRs.
- **No self-merges.** At least one core maintainer or senior reviewer must review and approve before merging.
- **Describe the change.** State what changed, why, and link the related issue if one exists.
- **Pass the checklist** from [Development Workflow](#development-workflow) before requesting review — reviewers will bounce PRs that skip it.

## Protected Branches

`main` and `dev` are protected on GitHub. Direct pushes to either are rejected by the server — all changes land through a reviewed pull request. This is enforced to keep the deployed API stable and the history readable.

## Reporting Bugs & Requesting Features

Open a GitHub issue and include:

- What you expected to happen vs. what actually happened
- Steps to reproduce (endpoint, request body, and any relevant response)
- Your environment (Node version, whether you're on `dev`/`main`, local vs. deployed)

For feature requests, a short description of the use case is more useful than a full spec — we'll flesh out the details together in the issue thread.
