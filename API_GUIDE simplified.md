# API Guide — Backend Endpoints Needed by the Frontend

These endpoints support the rest of the site (events, gallery, team roster,
projects, contact inbox) so the React frontend in `/src` has a full backend
to talk to. They follow the same conventions as `/api/members` in
`API_DOCS`.

**Frontend data split:** the React app uses two separate data providers —
`src/public/store.js` for the public site (events, gallery, current-year
team, projects — **never** contacts, full team history, or learning) and
`src/admin/store.js` for the protected `/admin` panel (full team history +
contacts inbox).

---

## ⚠️ Action Required — Read This First

Two backend changes are blocking real security/functionality gaps. Everything
else below is either already working or a "nice to have."

### 1. `GET /api/events` is leaking archived events (REQUIRED)

The frontend used to filter out archived events client-side. That fallback
has been **removed** — whatever this endpoint returns is now shown as-is on
the public site. Until this ships, **archived events are publicly visible.**
Same class of issue as the contacts leak below, just for events.

**Fix:**
| Requirement | Detail |
|---|---|
| Add query param | `GET /api/events?includeArchived=true` |
| Default behavior | No param, or `includeArchived=false` → only return events where `archived` is not `true`. Must be enforced **in the DB query**, not filtered after fetching everything. |
| Auth on the param | `includeArchived=true` requires a valid admin bearer token (`Authorization: Bearer <token>`, same as `/api/contacts`). No/invalid token → **silently ignore the param** and return non-archived only. Don't 401 — `GET /api/events` is otherwise public. |
| Frontend status | Already wired: `eventsApi.getAll({ includeArchived: true })` (admin) / `{ includeArchived: false }` (public) in `src/services/api/events.js`. Just waiting on backend support. |
| Not affected | Archive/unarchive itself already works via `PUT /api/events/$id { archived: true|false }`, admin-only, no change needed. |

### 2. `GET /api/admin/stats` doesn't exist yet (REQUIRED)

The admin dashboard used to compute its stat cards by fetching entire
events/team/projects collections and counting in the browser. That's been
removed from `admin/store.js` — it now expects the backend to do the
counting, the same way `GET /api/stats` already does for the public Home
page.

**New endpoint:**
```
GET /api/admin/stats                         admin only
Success (200): {
  totalEvents:        Number   # all events, incl. archived
  eventsConducted:    Number   # status === 'completed'
  workshops:          Number   # type === 'Workshop'
  studentProjects:    Number   # total project count
  achievedProjects:   Number   # achieved === true
  activeMembers:      Number   # total across all years
  currentYearMembers: Number   # current batch year only
  currentYearKey:     String   # e.g. "2025-26", or null
}
Failed: 401 Unauthorized | 500 Internal server error
```
Same auth rule as `/api/contacts` and `/api/team`: valid admin bearer token
required, **401 without one** (no public fallback here — unlike the
`includeArchived` param above, this route is admin-only, full stop).

Frontend status: already wired via `statsApi.getAdmin()` in
`src/services/api/stats.js`, called on every admin panel load and after any
create/update/delete/toggle. **No fallback exists** — the dashboard will
just show whatever the failed request produces until this ships.

---

## 🔒 Security Note — Contact Inbox

`GET /api/contacts`, `PUT /api/contacts/$id`, and `DELETE /api/contacts/$id`
**must** require a valid admin bearer token (same token issued by
`POST /api/auth/login`). This inbox holds personal names/emails/messages
from the public contact form — the **backend**, not just the frontend, must
enforce that only authenticated admins can read or modify it. Only
`POST /api/contacts` (public submission) is open.

---

## Endpoint Reference

### Events

Events is a standard CRUD resource — one flat collection, no nesting. Each
event carries a `type` (Workshop, Hackathon, Competition, Seminar) and a
`status` (upcoming or completed), which are independent of each other: a
Workshop can be upcoming or completed, same for any type. `archived` is a
separate soft-delete-style flag used to hide old events from the public
site without deleting them — that's the flag `includeArchived` filters on
(see the Action Required section above). `featured` is unrelated and just
controls homepage placement. `viewCount` and `registerClickCount` are
analytics counters the frontend increments but doesn't otherwise read.

| Method & Path | Auth | Purpose |
|---|---|---|
| `GET /api/events` | Public | List all events — see ⚠️ #1 above for the `includeArchived` fix needed |
| `POST /api/events` | — | Create event |
| `PUT /api/events/$id` | — | Patch event (partial or full body) |
| `DELETE /api/events/$id` | — | Delete event |

**`eventObject`**
```
id, title, type (Workshop|Hackathon|Competition|Seminar), status (upcoming|completed),
featured, archived, date, time, reportingTime, venue, description, image,
tags[], registrationLink, viewCount, registerClickCount
```

---

### Gallery

Gallery is a two-level resource: albums, each containing a nested array of
photos. Most endpoints operate at the album level (`/api/gallery/$albumId`),
but photos have their own sub-paths for bulk-adding
(`POST .../photos`), removing (`DELETE .../photos/$photoId`), and toggling
the `featured` flag (`PUT .../photos/$photoId`) independently of the parent
album. `featured` is capped at 10 photos per album — the backend must
enforce that cap and return 409 rather than silently accepting the 11th.
`imageCount` on the album object is a denormalized count the frontend
reads instead of computing `images.length` itself, so keep it in sync
whenever photos are added or removed.

| Method & Path | Purpose |
|---|---|
| `GET /api/gallery` | List all albums with nested photos |
| `POST /api/gallery` | Create album — `{ title, date }` |
| `PUT /api/gallery/$albumId` | Edit album metadata — `{ title, date, cover }` |
| `DELETE /api/gallery/$albumId` | Delete album |
| `POST /api/gallery/$albumId/photos` | Bulk add photos — `{ photos: [...] }` |
| `DELETE /api/gallery/$albumId/photos/$photoId` | Remove one photo |
| `PUT /api/gallery/$albumId/photos/$photoId` | Toggle `featured` (max 10/album, 409 if cap reached) |

**`albumObject`**
```
id, title, date, cover, imageCount, images: [{ id, src, caption, featured }]
```

> **Optional, not urgent — `GET /api/gallery/highlights`:** the public
> Gallery page currently fetches full albums + every nested photo just to
> show 3 photos per album on the homepage. Fine at current scale, but the
> payload grows with total photo count, not what's displayed. If the
> gallery gets large, consider adding an endpoint that returns only the
> first N photos per album, computed server-side:
> `[{ albumId, albumTitle, id, src, caption }, ...]`. Not required now —
> just flagging for later.

---

### Team Roster

Team roster is organized by batch year, and within each year, by group
(`coreTeam`, `mentors`, `developers`). Think of it as a three-level
structure: year → group → member list. Because of this shape, there are
two read endpoints instead of one: `GET /api/team` returns the entire
nested history across all years (admin-only, since it's a heavier payload
meant for internal use), while `GET /api/team/current` returns just the
active year's three groups (public, lightweight — this is what the
website actually renders). Write operations (`POST`/`PUT`/`DELETE`) always
target a specific `$year/$group`, so the backend needs to validate both
exist before touching a member record.

| Method & Path | Auth | Purpose |
|---|---|---|
| `GET /api/team` | **Admin only** | Full multi-year history |
| `GET /api/team/current` | Public | Lightweight — active batch year only |
| `POST /api/team` | — | Register new batch year — `{ year }` |
| `POST /api/team/$year/$group` | — | Add member (`group` = coreTeam \| mentors \| developers) |
| `PUT /api/team/$year/$group/$id` | — | Patch member |
| `DELETE /api/team/$year/$group/$id` | — | Remove member |

**`teamMember`**
```
id, name, role, designation, shortDescription, skills[],
github, linkedin, instagram, twitter, image
```

Note: the public site uses `GET /api/team/current` only. Finished batch
years are archived as static JSON in the frontend (`src/data/team-archive`)
rather than re-fetched here on every page load.

---

### Projects

Projects is the simplest resource in this guide — a flat, ungrouped
collection with standard CRUD, no nesting and no auth split. `stars` and
`forks` are presumably pulled from GitHub at some point (manually or via
sync) rather than user-editable in the admin UI, and `achieved` is a
manually-set flag (e.g. "won a hackathon") independent of `category`,
which is a freeform grouping tag like "Web" or "ML" used for filtering on
the public projects page.

| Method & Path | Purpose |
|---|---|
| `GET /api/projects` | List all projects |
| `POST /api/projects` | Create project |
| `PUT /api/projects/$id` | Patch project |
| `DELETE /api/projects/$id` | Delete project |

**`projectObject`**
```
id, title, team, members, tech[], description, stars, forks,
github, demo, category, achieved
```

---

### Learning Resources — REMOVED

No longer backed by any endpoint. These change a couple times a year at
most, so they now live as a static file in the frontend repo
(`src/config/learning.js`), same as `clubInfo`. If a `learning` collection
still exists in the DB, it can be dropped once the static file is checked
in.

---

### Contact Inbox

See the 🔒 security note above — `GET`/`PUT`/`DELETE` are admin-only.
Structurally this is a flat collection like Projects, but with a much
stricter auth boundary: the write path (`POST`) is wide open to the
public because it's how the contact form submits, while every read/update/
delete path is locked to admins because the data is personally
identifiable. `status` is the only field an admin ever updates directly
(`New` → `Responded`); everything else is set once at submission time and
treated as immutable.

| Method & Path | Auth | Purpose |
|---|---|---|
| `POST /api/contacts` | Public | Submit contact form — `{ name, email, message, requestType }` |
| `GET /api/contacts` | **Admin only** | List all submissions |
| `PUT /api/contacts/$id` | **Admin only** | Update status — `{ status }` |
| `DELETE /api/contacts/$id` | **Admin only** | Delete submission |

**`contactObject`**
```
id, name, email, message,
requestType (Collaboration|Join Club|Sponsorship|General Inquiry|Other),
date, status (New|Responded)
```

---

### Stats

Stats isn't a real resource — it has no fields to create or update, only
two read-only aggregation endpoints. The public one (`GET /api/stats`)
powers the homepage counters and only needs a handful of numbers computed
from the *current* batch year and non-archived events. The admin one
(`GET /api/admin/stats`, not yet built) is a superset covering the full
history, incl. archived events and all-time member counts, for the
dashboard. Both exist purely so the frontend never has to download whole
collections just to display a count — the aggregation happens in the DB.

| Method & Path | Auth | Purpose |
|---|---|---|
| `GET /api/stats` | Public | Lightweight, DB-side aggregation for public counters (Home page "50+ Events / 200+ Members") |
| `GET /api/admin/stats` | **Admin only — NOT YET BUILT** | See ⚠️ #2 above |

**`GET /api/stats` response**
```
totalEvents, activeMembers (current batch year only), studentProjects, workshops
```

The point of `/api/stats` is that the DB does the counting (aggregate
query) instead of the frontend downloading every event/project/team-member
record just to read `.length`.

---

### Auth (Admin Panel)

| Method & Path | Purpose |
|---|---|
| `POST /api/auth/login` | `{ username, password }` → `{ token }` on success (200), 401 on invalid credentials |

---

## Quick Summary for Backend Team

| Priority | Item |
|---|---|
| 🔴 Required | Fix `GET /api/events` to filter `archived` server-side + support admin-gated `includeArchived=true` |
| 🔴 Required | Build `GET /api/admin/stats` |
| 🔴 Required | Enforce admin auth on `GET/PUT/DELETE /api/contacts` (security) |
| 🟡 Optional | `GET /api/gallery/highlights` for homepage preview (only if gallery grows large) |
| ✅ Done / no action | Learning resources endpoints — safe to remove, now static in frontend |
