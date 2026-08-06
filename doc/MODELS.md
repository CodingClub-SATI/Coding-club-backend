# Data Models

MongoDB collections used by the Coding Club SATI backend, defined with Mongoose. All models use auto-generated `createdAt`/`updatedAt` timestamps. Most models use a numeric `id` field (not MongoDB's `_id`) as their public identifier.

## Overview

| Model | Collection | Description |
|---|---|---|
| [Admin](#admin) | `admins` | The single administrator account |
| [ContactInfo](#contactinfo) | `contactinfos` | Club's public contact details (singleton) |
| [Contact](#contact) | `contacts` | Contact form submissions |
| [TeamMember](#teammember) | `teammembers` | Club members |
| [Batch](#batch) | `batches` | Member cohorts/years |
| [Leadership](#leadership) | `leaderships` | Convenor/co-convenor/department-head mapping (singleton) |
| [Album](#album--photo) | `albums` | Photo albums, with embedded photos |
| [Update](#update) | `updates` | Site announcements |
| [Event](#event) | `events` | Club events and workshops |
| [Project](#project) | `projects` | Student projects |

---

## Admin

The sole administrator account, seeded from environment variables on first run.

| Field | Type | Required | Notes |
|---|---|---|---|
| `username` | String | Yes | Unique |
| `password` | String | Yes | Bcrypt hash |
| `email` | String | Yes | OTP recipient |
| `otp` | String | No | Bcrypt hash of the current one-time password |
| `otpExpiry` | Date | No | OTP expiry (5 minutes after issue) |
| `tokenVersion` | Number | No | Incremented on logout/password change to invalidate active sessions |

---

## ContactInfo

Singleton document with the club's public contact details.

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | String | No | |
| `phone` | String | No | |
| `youtube` | String | No | Plain URL |
| `github`, `instagram`, `linkedin`, `x`, `discord`, `whatsapp` | Object | No | `{ url, showOnSidebar, showOnFooter }` |

---

## Contact

A message submitted through the public contact form.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | Number | Yes | Unique |
| `name` | String | Yes | |
| `email` | String | Yes | |
| `requestType` | String | Yes | `Collaboration`, `Join Club`, `Sponsorship`, `General Inquiry`, `Other` |
| `message` | String | Yes | |
| `status` | String | No | `New` (default), `Read` |
| `archived` | Boolean | No | Default `false` |

**Unique index:** `(email, message)` — prevents identical duplicate submissions.

The submission API also accepts a transient `honeypot` field for spam filtering; it is never persisted to this collection.

---

## TeamMember

A person on the club roster, belonging to a batch.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | Number | Yes | Unique |
| `enrollmentNumber` | String | Yes | Globally unique |
| `fullName` | String | Yes | |
| `specialization` | String | No | |
| `batch` | String | Yes | References `Batch.batch` |
| `skills` | String[] | No | Up to 3 |
| `avatarUrl` | String | No | |
| `github`, `linkedin`, `instagram`, `x` | String | No | Plain URLs |

---

## Batch

A cohort/year grouping that members belong to. Identified by name (`batch`), not a numeric id.

| Field | Type | Required | Notes |
|---|---|---|---|
| `batch` | String | Yes | Unique — acts as the identifier |
| `archived` | Boolean | No | Default `false`; hides the batch's members from the public roster |

---

## Leadership

Singleton document mapping specific team members to leadership roles.

| Field | Type | Notes |
|---|---|---|
| `convenors` | Number[] | Up to 2 `TeamMember.id` values |
| `coConvenors` | Number[] | Up to 2 `TeamMember.id` values |
| `departmentHeads` | Map\<String, Number\> | Department name → `TeamMember.id`, up to 20 entries |

This is the stored shape, returned as-is by the admin leadership endpoints. The public roster endpoint (`GET /api/team/public`) reshapes it — resolving ids into member objects and turning `departmentHeads` into a `departmentLeads` array — see [API.md](API.md#team).

---

## Album & Photo

An album is a titled collection of photos. Photos are embedded documents, not a separate collection.

**Album**

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | Number | Yes | Unique |
| `title` | String | Yes | |
| `date` | String | No | Free text |
| `cover` | String | No | Must match the `src` of a photo in this album |
| `images` | [Photo] | No | Embedded photos, default `[]` |
| `imageCount` | Number | — | Virtual field, computed as `images.length` |
| `archived` | Boolean | No | Default `false` |

**Photo** (embedded, no separate `_id`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | Number | Yes | Unique across all albums |
| `src` | String | Yes | Image URL |
| `caption` | String | No | |
| `featured` | Boolean | No | Default `false`; max 10 featured photos per album |

**Unique index:** `(title, date)` when `date` is set.

---

## Update

A short announcement, shown on the site's updates feed.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | Number | Yes | Unique |
| `message` | String | Yes | Max 1000 chars |

---

## Event

A club event or workshop, with public view/click analytics.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | Number | Yes | Unique |
| `title` | String | Yes | |
| `type` | String | Yes | `Workshop`, `Hackathon`, `Competition`, `Seminar` |
| `status` | String | Yes | `upcoming`, `completed` |
| `featured` | Boolean | No | Default `false` |
| `archived` | Boolean | No | Default `false`; hides the event from public listings |
| `date` | Date | No | |
| `time` | String | No | Free text |
| `reportingTime` | String | No | Free text |
| `venue` | String | No | |
| `description` | String | No | |
| `logoUrl` / `bannerUrl` | String | No | |
| `registrationLink` | String | No | |
| `tags` | String[] | No | Up to 20 |
| `viewCount` | Number | No | Auto-incremented on page views (deduplicated — see note) |
| `registerClickCount` | Number | No | Auto-incremented on registration clicks (deduplicated — see note) |

**Hit deduplication:** repeat views/clicks from the same IP address for the same event within a 12-hour window do not increment the counter again.

**Unique index:** `(title, date)` when `date` is set.

---

## Project

A showcased student project.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | Number | Yes | Unique |
| `title` | String | Yes | |
| `team` | String | Yes | |
| `members` | Number | Yes | Team size |
| `tech` | String[] | No | Up to 20 |
| `description` | String | Yes | |
| `stars` | Number | No | Synced from GitHub, default `0` |
| `forks` | Number | No | Synced from GitHub, default `0`; both re-synced automatically every 6 hours by a background job, in addition to on create/update |
| `github` | String | Yes | Repository URL |
| `demo` | String | No | |
| `category` | String | Yes | |
| `archived` | Boolean | No | Default `false`; see note below |

**Unique index:** `(title, team)`.

**Note:** unlike the other archivable models, `archived` is not exposed by the create/update API for projects — it can't currently be set to `true` through the API, and `GET /api/projects` doesn't filter on it (all projects are always returned).

---

## Relationships

```
Batch (1) ──< TeamMember (many)      via TeamMember.batch = Batch.batch
TeamMember (1) ──< Leadership          via convenors / coConvenors / departmentHeads (member ids)
Album (1) ──< Photo (many)             embedded array, not a separate collection
```

Admin, ContactInfo, Contact, Update, Event, and Project are standalone with no relations to other models.