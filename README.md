# Coding Club SATI — Backend

REST API powering the Coding Club SATI website — events, projects, gallery, team roster, contact form, and site content. Built with Express 5 and MongoDB.

[![Node](https://img.shields.io/badge/node-%3E%3D20.6.0-339933?logo=node.js&logoColor=white)](package.json)
[![License: ISC](https://img.shields.io/badge/license-ISC-blue.svg)](#license)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Events** — CRUD, view/registration-click analytics, archiving, auto-posted announcements on creation
- **Projects** — CRUD with automatic GitHub star/fork syncing
- **Gallery** — albums with embedded photos, featured-photo highlights, per-album feature cap
- **Team** — batches, members, and a leadership mapping (convenors/co-convenors/department heads)
- **Contact** — public contact form with spam-honeypot protection, admin inbox
- **Site content** — contact info, announcements/updates feed, public and admin stats
- **Image uploads** — Catbox-hosted, size/MIME/magic-byte validated, with automatic cleanup of replaced/orphaned files
- **Admin auth** — single-admin, cookie-based JWT sessions, OTP-gated password changes
- Security hardening: Helmet, rate limiting, strict CORS allow-listing, Zod-validated input on every mutating endpoint

## Tech Stack

| Concern | Library |
|---|---|
| Runtime | Node.js (ES modules) |
| Framework | [Express 5](https://expressjs.com/) |
| Database / ODM | [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) |
| Validation | [Zod](https://zod.dev/) |
| Auth | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) + HttpOnly cookies, [bcrypt](https://github.com/kelektiv/node.bcrypt.js) |
| File uploads | [Multer](https://github.com/expressjs/multer) (memory storage) + [node-catbox](https://github.com/godu/node-catbox) |
| Email | [Nodemailer](https://nodemailer.com/) (OTP delivery) |
| Security | [Helmet](https://helmetjs.github.io/), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit), [cors](https://github.com/expressjs/cors) |

## Project Structure

```
.
├── controllers/       # Request handlers — one file per resource
├── middlewares/       # Auth gating, request validation, param checks
├── models/            # Mongoose schemas + paired Zod validation schemas
├── routes/            # Express routers — one file per resource
├── utils/             # Shared helpers (CRUD factory, pagination, error
│                       # handling, ID generation, GitHub sync, etc.)
├── jobs/               # Background jobs (periodic GitHub stats sync)
├── tests/             # Integration test scripts (bash/curl) + a
│                       # dependency-free unit test — see Testing
├── index.js            # App entry point — middleware, routing, DB connect
└── package.json
```

Each resource follows the same shape: `routes/xRoutes.js` → `controllers/xController.js` → `models/xModel.js`, with shared CRUD logic factored into `utils/crudHandlers.js` so individual controllers only need to define what's different about that resource.

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.6.0
- A **MongoDB** database (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- *(Optional, for full functionality)* a [Catbox](https://catbox.moe/) user hash, Gmail SMTP app-password, and a GitHub personal access token — see [Environment Variables](#environment-variables)

### Installation

```bash
git clone https://github.com/CodingClub-SATI/Coding-club-backend.git
cd Coding-club-backend
npm install
```

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

> `npm run dev` (see below) loads its config from **`.env.dev`** instead of `.env` — copy `.env.example` to `.env.dev` as well if you'll be using the dev server.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | ✅ | MongoDB connection string. The server will not start without it. |
| `PORT` | – | Port to listen on (default `3000`) |
| `NODE_ENV` | – | `development` or `production` |
| `FRONTEND_URLS` | Recommended in production | Comma-separated list of allowed CORS origins |
| `TRUST_PROXY_HOPS` | Recommended in production | Number of reverse-proxy hops in front of the server (usually `1`); required for rate limiting to work correctly behind a proxy/load balancer |
| `JWT_SECRET` | ✅ for login | Secret used to sign admin session tokens |
| `ADMIN_PASSWORD` | ✅ on first run | Seeds the initial admin account (username is always `admin`) |
| `ADMIN_EMAIL` | – | Admin email / OTP recipient (default `codingclub@satiengg.in`) |
| `SMTP_EMAIL` / `SMTP_PASSWORD` | For OTP emails | Gmail credentials used to send password-change OTPs |
| `CATBOX_USERHASH` | – | Ties image uploads to a Catbox account (anonymous uploads work without it, but can't reliably be deleted/replaced later) |
| `GITHUB_TOKEN` | – | Raises the GitHub API rate limit used for project star/fork syncing |

See [`.env.example`](.env.example) for the full template. The server logs a warning at startup for any optional variable that's missing, and exits immediately if a required one is missing.

## Running the Server

```bash
npm start       # production mode — loads .env
npm run dev     # development mode — loads .env.dev, auto-restarts via nodemon
```

On first successful database connection, if no admin account exists yet, one is seeded automatically from `ADMIN_PASSWORD`/`ADMIN_EMAIL`. Check that the server is up with:

```bash
curl http://localhost:3000/ping   # → pong
```

## Testing

`tests/` contains two kinds of tests:

- **`tests/unit/utils_and_schemas.test.mjs`** — a dependency-free unit test for pure logic (`utils/*.js`) and Zod validation schemas (`models/*.js`). It imports modules directly and needs no running server or database:
  ```bash
  node tests/unit/utils_and_schemas.test.mjs
  ```
- **`tests/<resource>/API_test_*.sh`** — black-box integration tests: bash scripts that run real `curl` requests against a **running instance** of the server (not unit tests, no mocking), grouped into subfolders by resource (`tests/auth/`, `tests/events/`, `tests/gallery/`, `tests/projects/`, `tests/team/`, `tests/contact/`, `tests/uploads/`, `tests/misc/`). Each script is self-contained and named after the endpoint(s) it covers.

Run everything at once with the summary runner:

```bash
# 1. Start the server against a database you don't mind writing test data to
npm run dev

# 2. In another terminal
ADMIN_USERNAME=admin ADMIN_PASSWORD=your-password bash tests/run_all.sh
```

Or run an individual script the same way:

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=your-password bash tests/auth/API_test_login.sh

# Optionally point at a different host
BASE_URL=http://localhost:4000 bash tests/events/API_test_getAll.sh
```

`ADMIN_USERNAME`/`ADMIN_PASSWORD` default to `admin`/`password123` if unset — override them to match your seeded admin. Scripts that need an authenticated session log in automatically and store the cookie in `tests/cookies.txt` (git-ignored).

A few scripts (`events/API_test_update.sh`, `events/API_test_remove.sh`, `gallery/API_test_album_update.sh`, `gallery/API_test_album_remove.sh`, `projects/API_test_update.sh`, `projects/API_test_remove.sh`) need an id as an argument, taken from their paired `*_create.sh` script's output — `run_all.sh` skips these automatically and lists them at the end.

> ⚠️ These scripts create and delete real documents. Run them against a local or staging database, never against production.

## API Documentation

- **[API Reference](API.md)** — every endpoint, request/response shapes, and error codes
- **[Data Models](MODELS.md)** — every MongoDB collection and its schema

## Security

- Passwords and OTPs are hashed with bcrypt before storage; sessions use HttpOnly, `SameSite`-restricted cookies
- All mutating endpoints validate input with Zod (`.strict()` schemas — unknown fields are rejected)
- Admin sessions can be invalidated globally (logout, password change) via a server-side token-version counter
- Uploaded images are size/MIME-restricted and verified against their real file signature, not just the declared `Content-Type`
- Helmet, a global + per-route rate limiter, and a strict CORS origin allow-list are applied to every request

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming, commit conventions, and the pull request process before opening a PR.

## License

Distributed under the **ISC License**. See [`package.json`](package.json) for details.
