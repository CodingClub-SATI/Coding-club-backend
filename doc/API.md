# API Reference

REST API for the Coding Club SATI website backend — built with Express and MongoDB.

**Base URL:** `/api` (e.g. `https://your-domain.com/api`)
**Content-Type:** `application/json` for all endpoints except file uploads, which use `multipart/form-data`.

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Rate Limiting & CORS](#rate-limiting--cors)
- [Endpoint Summary](#endpoint-summary)
- [Auth](#auth)
- [Events](#events)
- [Projects](#projects)
- [Gallery](#gallery)
- [Team](#team)
- [Contact Messages](#contact-messages)
- [Contact Info](#contact-info)
- [Updates](#updates)
- [Stats](#stats)
- [Image Uploads](#image-uploads)
- [Environment Variables](#environment-variables)

---

## Authentication

The API has a single admin account, seeded from environment variables at first startup — there is no public sign-up.

Admin endpoints use an **HttpOnly cookie** (`admin_token`) containing a JWT, set on successful login. Send requests with credentials included (e.g. `fetch(url, { credentials: 'include' })`) so the cookie is attached automatically.

Endpoints below are marked **Public** or **Admin**. Admin endpoints return `401 Unauthorized` without a valid session.

## Response Format

Successful responses return the resource (or an array/pagination wrapper) as JSON. Errors follow a consistent shape:

```json
{ "message": "Human-readable error description" }
```

Validation errors additionally include the raw validation issues:

```json
{ "message": "Validation failed.", "errors": [ /* field-level issues */ ] }
```

**Common status codes**

| Code | Meaning |
|---|---|
| 200 / 201 | Success |
| 400 | Invalid request body/params |
| 401 | Authentication required or invalid credentials |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 429 | Too many requests |
| 500 | Server error |

Requests to a route that doesn't exist at all (rather than a valid route with a missing resource) get a generic `404 { "message": "Invalid route parameter value." }`.

## Rate Limiting & CORS

Every `/api` request is subject to a global limit of **200 requests per 15 minutes per IP**. A handful of sensitive auth endpoints have their own, tighter limits on top of that:

| Endpoint | Limit |
|---|---|
| `POST /api/auth/login` | 10 per 15 min per IP |
| `POST /api/auth/password/otp` | 5 per 15 min per IP |
| `PUT /api/auth/password` | 20 per 15 min per IP |

Requests over a limit receive `429` with a JSON `message`.

State-changing requests (`POST`/`PUT`/`PATCH`/`DELETE`) must originate from an allowed origin (configured via `FRONTEND_URLS`, plus `http://localhost:5173`/`http://localhost:3000` in development) — other origins get `403 { "message": "Request origin not allowed." }`. `GET` requests aren't origin-restricted.

## Pagination

List endpoints (Events, Projects, Gallery albums, Contacts, Updates) support optional pagination via query parameters:

| Param | Effect |
|---|---|
| `page`, `pageSize` | Returns `{ data, page, pageSize, total, totalPages }`. `pageSize` defaults to 20 if omitted/invalid, capped at 100. |
| `limit` (no `page`) | Returns a plain array capped at `limit` (max 100). |
| *(none)* | Returns all matching results as a plain array (Updates defaults to the 20 most recent — see [Updates](#updates)). |

---

## Endpoint Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/ping` | Public | Health check |
| POST | `/api/auth/login` | Public | Admin login |
| POST | `/api/auth/logout` | Public | Logout |
| GET | `/api/auth/verify` | Admin | Verify session |
| POST | `/api/auth/password/otp` | Admin | Request password-change OTP |
| PUT | `/api/auth/password` | Admin | Change password |
| GET | `/api/events` | Public | List events |
| GET | `/api/events/:id` | Public | Get an event |
| POST | `/api/events` | Admin | Create an event |
| PUT | `/api/events/:id` | Admin | Update an event |
| DELETE | `/api/events/:id` | Admin | Delete an event |
| POST | `/api/events/:id/register-click` | Public | Track a registration click |
| GET | `/api/projects` | Public | List projects |
| POST | `/api/projects` | Admin | Create a project |
| PUT | `/api/projects/:id` | Admin | Update a project |
| DELETE | `/api/projects/:id` | Admin | Delete a project |
| GET | `/api/gallery` | Public | List albums |
| GET | `/api/gallery/highlights` | Public | Featured photos across albums |
| GET | `/api/gallery/:albumId` | Public | Get an album |
| POST | `/api/gallery` | Admin | Create an album |
| PUT | `/api/gallery/:albumId` | Admin | Update an album |
| DELETE | `/api/gallery/:albumId` | Admin | Delete an album |
| POST | `/api/gallery/:albumId/photos` | Admin | Add photos to an album |
| PUT | `/api/gallery/:albumId/photos/:photoId` | Admin | Update a photo |
| DELETE | `/api/gallery/:albumId/photos/:photoId` | Admin | Remove a photo |
| GET | `/api/team/public` | Public | Public team roster |
| GET | `/api/team/admin/batches` | Admin | List all batches |
| POST | `/api/team/admin/batches` | Admin | Create a batch |
| PATCH | `/api/team/admin/batches/:batch` | Admin | Archive/unarchive a batch |
| DELETE | `/api/team/admin/batches/:batch` | Admin | Delete a batch |
| POST | `/api/team/admin/members` | Admin | Add a member |
| PATCH | `/api/team/admin/members/:id` | Admin | Update a member |
| DELETE | `/api/team/admin/members/:id` | Admin | Remove a member |
| GET | `/api/team/admin/leadership` | Admin | Get leadership mapping |
| PUT | `/api/team/admin/leadership` | Admin | Set leadership mapping |
| POST | `/api/contacts` | Public | Submit a contact form |
| GET | `/api/contacts` | Admin | List contact messages |
| PUT | `/api/contacts/:id` | Admin | Update a message |
| DELETE | `/api/contacts/:id` | Admin | Delete a message |
| GET | `/api/contact-info` | Public | Get club contact info |
| PUT | `/api/contact-info` | Admin | Update club contact info |
| GET | `/api/updates` | Public | List announcements |
| POST | `/api/updates` | Admin | Create an announcement |
| PUT | `/api/updates/:id` | Admin | Update an announcement |
| DELETE | `/api/updates/:id` | Admin | Delete an announcement |
| GET | `/api/stats` | Public | Public site statistics |
| GET | `/api/admin/stats` | Admin | Admin dashboard statistics |
| POST | `/api/upload` | Admin | Upload an image |
| DELETE | `/api/upload` | Admin | Delete an uploaded image |
| POST | `/api/upload/event/:id/:asset` | Admin | Upload an event logo/banner |
| DELETE | `/api/upload/event/:id/:asset` | Admin | Remove an event logo/banner |

---

## Auth

### `POST /api/auth/login`
**Public.** Authenticates the admin and sets the session cookie.

**Body**

| Field | Type | Required |
|---|---|---|
| `username` | string | Yes |
| `password` | string | Yes |

**Response `200`**
```json
{ "success": true }
```
**Errors:** `400` invalid input · `401` invalid credentials

### `POST /api/auth/logout`
**Public.** Clears the session cookie and invalidates it server-side.

**Response `200`**
```json
{ "success": true }
```

### `GET /api/auth/verify`
**Admin.** Confirms the current session is valid.

**Response `200`**
```json
{ "valid": true, "username": "admin" }
```

### `POST /api/auth/password/otp`
**Admin.** Emails a one-time password to the admin's registered email, required to complete a password change.

**Response `200`**
```json
{ "success": true, "message": "OTP Sent" }
```

### `PUT /api/auth/password`
**Admin.** Changes the admin password.

**Body**

| Field | Type | Required |
|---|---|---|
| `currentPassword` | string | Yes |
| `newPassword` | string | Yes — see strength rule below |
| `otp` | string | Yes — from the OTP endpoint above, valid for 5 minutes |

`newPassword` must be at least 8 characters **and** satisfy at least 3 of these 5 criteria: 8+ chars, 12+ chars, mixed upper/lower case, contains a number, contains a symbol. (In practice: 8+ chars, mixed case, and a number is enough — a symbol isn't strictly required.)

**Response `200`**
```json
{ "success": true, "message": "Password updated successfully." }
```
**Errors:** `400` weak password / invalid or expired OTP · `401` wrong current password

A successful password change increments the account's session version, which invalidates **every** active session — including the one making this request. Log in again afterward to get a fresh `admin_token`.

---

## Events

### `GET /api/events`
**Public.** Supports [pagination](#pagination).

**Query params:** `status` (`upcoming`|`completed`), `type` (`Workshop`|`Hackathon`|`Competition`|`Seminar`), `featured` (`true`), `includeArchived` (`true`, admin only). An invalid `status` or `type` value returns `400`.

### `GET /api/events/:id`
**Public.** Returns a single event. Archived events are only visible to admins (fetched by an admin session, regardless of the `archived` flag). Increments the event's view counter — repeat views from the same IP for the same event within a 12-hour window don't increment it again.

### `POST /api/events`
**Admin.**

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | max 200 chars |
| `type` | string | Yes | `Workshop`, `Hackathon`, `Competition`, `Seminar` |
| `status` | string | Yes | `upcoming`, `completed` |
| `featured` | boolean | No | default `false` |
| `archived` | boolean | No | default `false` |
| `date` | date | No | |
| `time` | string | No | max 50 chars |
| `reportingTime` | string | No | max 50 chars |
| `venue` | string | No | max 200 chars |
| `description` | string | No | max 5000 chars |
| `logoUrl` / `bannerUrl` | url | No | |
| `registrationLink` | url | No | |
| `tags` | string[] | No | up to 20 |

**Response `201`** — the created event
**Errors:** `400` validation · `409` an event with the same title and date already exists

### `PUT /api/events/:id`
**Admin.** Same body as create; all fields optional.

### `DELETE /api/events/:id`
**Admin.** Deletes the event and its associated images.

### `POST /api/events/:id/register-click`
**Public.** Increments the event's registration-click counter — like view counts, repeat clicks from the same IP within a 12-hour window don't increment it again.

**Response `200`**
```json
{ "registerClickCount": 3 }
```

> Creating an event also auto-posts an [Update](#updates) announcement (best-effort — a failure here doesn't fail the event creation).

---

## Projects

### `GET /api/projects`
**Public.** Supports [pagination](#pagination). Unlike Events/Gallery/Contacts, this list has no archived-filtering or `includeArchived` param — every project is returned regardless of its `archived` flag (which, in the current API, can't be set anyway; see [Project model note](MODELS.md#project)).

**Query params:** `category`, `sort=stars`

### `POST /api/projects`
**Admin.**

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | max 200 chars |
| `team` | string | Yes | max 200 chars |
| `members` | integer | Yes | 1–1000 |
| `tech` | string[] | No | up to 20 |
| `description` | string | Yes | max 3000 chars |
| `github` | url | Yes | |
| `demo` | url | No | |
| `category` | string | Yes | max 100 chars |

`stars` and `forks` are populated automatically from the GitHub API and cannot be set directly.

**Response `201`** — the created project
**Errors:** `400` validation · `409` a project with the same title and team already exists

### `PUT /api/projects/:id`
**Admin.** Same body as create; all fields optional. Changing `github` re-syncs `stars`/`forks`.

### `DELETE /api/projects/:id`
**Admin.**

> In addition to syncing on create/update, a background job re-fetches `stars`/`forks` for every project with a `github` link every 6 hours.

---

## Gallery

### `GET /api/gallery`
**Public.** Supports [pagination](#pagination). Query params: `search` (matches album title), `includeArchived` (`true`, admin only).

### `GET /api/gallery/highlights`
**Public.** Up to 12 featured photos across all albums (respects `includeArchived`, admin only). If no photos are marked `featured` anywhere, falls back to the first photo of up to 12 albums instead.

### `GET /api/gallery/:albumId`
**Public.** Returns the album, including its photos. Archived albums are only visible to admins.

### `POST /api/gallery`
**Admin.**

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | Yes | max 200 chars |
| `date` | string | No | max 50 chars |
| `cover` | url | No | must be empty at creation — set it after adding photos |

**Response `201`** — the created album (empty photo list)
**Errors:** `409` an album with the same title and date already exists

### `PUT /api/gallery/:albumId`
**Admin.** Same fields as create, plus `archived` (boolean). `cover` must match the `src` of a photo already in the album.

### `DELETE /api/gallery/:albumId`
**Admin.** Deletes the album and all its photos.

### `POST /api/gallery/:albumId/photos`
**Admin.** Adds one or more photos.

**Body**
```json
{ "photos": [ { "src": "https://...", "caption": "optional", "featured": false } ] }
```
1–50 photos per call. An album may have at most **10** featured photos.

**Response `201`** — the updated album
**Errors:** `409` featured photo cap reached

### `PUT /api/gallery/:albumId/photos/:photoId`
**Admin.** Body: `src`, `caption`, `featured` — all optional. If this photo is the album's current `cover` and `src` changes, the album's `cover` is updated to follow it automatically.

### `DELETE /api/gallery/:albumId/photos/:photoId`
**Admin.** If this photo is the album's current `cover`, the cover is cleared (set to `""`).

---

## Team

### `GET /api/team/public`
**Public.** Returns members grouped by (non-archived) batch, plus a resolved leadership object. `enrollmentNumber` is omitted from public output.

```json
{
  "batches": [ { "batch": "2025", "archived": false, "members": [ /* ... */ ] } ],
  "leadership": {
    "convenors": [ /* full member objects */ ],
    "coConvenors": [ /* full member objects */ ],
    "departmentLeads": [ { "...memberFields": "...", "clubPosition": "Design" } ]
  }
}
```
Note this shape differs from the admin leadership endpoints below: ids are resolved into full member objects, and `departmentHeads` becomes a `departmentLeads` array (each entry is a member plus a `clubPosition` string). Any referenced member id that no longer exists is silently dropped.

### `GET /api/team/admin/batches`
**Admin.** All batches (archived or not), each with its members and `memberCount`. Each member also carries an `isLeadership` boolean flag.

### `POST /api/team/admin/batches`
**Admin.** Body: `{ "batch": "2025" }` (1–50 chars).
**Errors:** `409` batch already exists

### `PATCH /api/team/admin/batches/:batch`
**Admin.** Body: `{ "archived": true }`.

### `DELETE /api/team/admin/batches/:batch`
**Admin.** Fails with `400` if the batch still has members assigned.

### `POST /api/team/admin/members`
**Admin.**

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `enrollmentNumber` | string | Yes | globally unique |
| `fullName` | string | Yes | max 200 chars |
| `specialization` | string | No | max 200 chars |
| `batch` | string | Yes | must reference an existing batch |
| `skills` | string[] | No | up to 3 |
| `avatarUrl` | url | No | |
| `github`, `linkedin`, `instagram`, `x` | url | No | |

**Errors:** `400` batch does not exist · `409` enrollment number already exists

### `PATCH /api/team/admin/members/:id`
**Admin.** Same fields as create; all optional. If `avatarUrl` changes, the old image is deleted from Catbox.

### `DELETE /api/team/admin/members/:id`
**Admin.** Also removes the member from any leadership role and deletes their avatar image from Catbox.

### `GET /api/team/admin/leadership`
**Admin.**

### `PUT /api/team/admin/leadership`
**Admin.** Full replacement — all fields required on every call.

```json
{
  "convenors": [123456789],
  "coConvenors": [],
  "departmentHeads": { "Design": 123456790 }
}
```
`convenors`/`coConvenors`: up to 2 member IDs each. `departmentHeads`: up to 20 entries. All referenced IDs must exist.

---

## Contact Messages

### `POST /api/contacts`
**Public.** Submits a contact form message.

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | max 100 chars |
| `email` | string | Yes | valid email |
| `requestType` | string | Yes | `Collaboration`, `Join Club`, `Sponsorship`, `General Inquiry`, `Other` |
| `message` | string | Yes | max 2000 chars |
| `honeypot` | string | No | Anti-spam trap field — must be left empty/omitted. Never stored. |

**Response `201`**
```json
{ "message": "Thanks for reaching out — we'll get back to you soon.", "id": 123456789 }
```
**Errors:** `409` identical message already submitted from this email

### `GET /api/contacts`
**Admin.** Supports [pagination](#pagination).

**Query params:** `status` (`New`|`Read`), `requestType` (`Collaboration`|`Join Club`|`Sponsorship`|`General Inquiry`|`Other`), `includeArchived` (`true`). An invalid `status` or `requestType` value returns `400`.

### `PUT /api/contacts/:id`
**Admin.** Body: `status` (`New`|`Read`), `archived` (boolean) — both optional.

### `DELETE /api/contacts/:id`
**Admin.**

---

## Contact Info

A single record holding the club's public contact details.

### `GET /api/contact-info`
**Public.**

### `PUT /api/contact-info`
**Admin.** All fields optional.

| Field | Type |
|---|---|
| `email` | string |
| `phone` | string |
| `youtube` | url |
| `github`, `instagram`, `linkedin`, `x`, `discord`, `whatsapp` | `{ url, showOnSidebar, showOnFooter }` |

```json
{
  "email": "club@example.com",
  "github": { "url": "https://github.com/codingclub-sati", "showOnFooter": true }
}
```

---

## Updates

Short announcements shown on the site (e.g. an update is auto-posted whenever a new event is created).

### `GET /api/updates`
**Public.** Supports [pagination](#pagination); returns the 20 most recent by default.

### `POST /api/updates`
**Admin.** Body: `{ "message": "..." }` (1–1000 chars).

### `PUT /api/updates/:id`
**Admin.**

### `DELETE /api/updates/:id`
**Admin.**

---

## Stats

### `GET /api/stats`
**Public.**
```json
{ "totalEvents": 12, "activeMembers": 40, "studentProjects": 8, "workshops": 5 }
```
`totalEvents`/`workshops` exclude archived events. `studentProjects` counts all projects (archived or not — see the [Projects](#projects) note). `activeMembers` counts members belonging to non-archived batches.

### `GET /api/admin/stats`
**Admin.**
```json
{ "totalEvents": 15, "totalProjects": 8, "newContactMessages": 3, "totalMembers": 40 }
```
`totalEvents` here includes archived events (unlike the public `totalEvents` above). `totalMembers` is computed the same way as public `activeMembers` (non-archived batches only).

---

## Image Uploads

Images are hosted on [Catbox](https://catbox.moe). Uploads accept JPEG, PNG, WEBP, or GIF, up to 2 MB, sent as `multipart/form-data` with the file in a field named `image`. The file's actual bytes are checked against its declared MIME type (magic-number check) — a mismatched or renamed file is rejected with `400`, even if the declared `Content-Type` looks valid.

### `POST /api/upload`
**Admin.** Generic upload — returns a URL you can store on any resource yourself.

**Response `200`**
```json
{ "url": "https://files.catbox.moe/abc123.jpg" }
```

### `DELETE /api/upload`
**Admin.** Body: `{ "url": "https://files.catbox.moe/..." }`.

### `POST /api/upload/event/:id/:asset`
**Admin.** `:asset` is `logoURL` or `bannerURL`. Uploads and attaches the image to the event in one step. If the event already had an image in that slot, the old file is deleted from Catbox afterward.

**Response `200`**
```json
{ "event": { "id": 123, "logoUrl": "https://files.catbox.moe/...", "...": "..." } }
```

### `DELETE /api/upload/event/:id/:asset`
**Admin.** Removes the image from the event and deletes the file. `404` if the event has no image in that slot to remove.

**Response `200`**
```json
{ "event": { "id": 123, "logoUrl": null, "...": "..." } }
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | Yes | MongoDB connection string |
| `PORT` | No | Server port (default `3000`) |
| `NODE_ENV` | No | `production` or `development` |
| `FRONTEND_URLS` | Recommended | Comma-separated list of allowed CORS origins |
| `TRUST_PROXY_HOPS` | Recommended in production | Number of reverse-proxy hops in front of the server (usually `1`); required for the rate limiter to read the real client IP correctly behind a proxy/load balancer |
| `JWT_SECRET` | Yes | Signs the admin session token |
| `ADMIN_PASSWORD` | Yes (first run) | Seeds the initial admin account |
| `ADMIN_EMAIL` | No | Admin email / OTP recipient |
| `SMTP_EMAIL` / `SMTP_PASSWORD` | For OTP emails | Gmail SMTP credentials |
| `CATBOX_USERHASH` | No | Ties uploads to a Catbox account |
| `GITHUB_TOKEN` | No | Raises the GitHub API rate limit used for project stats |