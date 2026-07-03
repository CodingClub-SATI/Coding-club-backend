---

# The endpoints below are additions to support the rest of the site
# (events, gallery, team roster, projects, learning resources, contact
# inbox) so the React frontend in /src has a full backend to talk to.
# They follow the same conventions as /api/members in API_DOCS.
#
# FRONTEND NOTE: the React app now uses two separate data providers —
# src/public/store.js for the public site (events, gallery, current-year
# team, projects; never contacts, never the full team history, never
# learning) and src/admin/store.js for the protected /admin panel (full
# team history + the contacts inbox). See those files for details.

## Events

GET /api/events:
	Input:
	Output:
		Success: [ eventObject, ... ] + http code 200
			eventObject: {
			id:{ type:Number, required:true },
			title:{ type:String, required:true },
			type:{ type:String, required:true },		#Workshop | Hackathon | Competition | Seminar
			status:{ type:String, required:true },		#upcoming | completed
			featured:{ type:Boolean },
			archived:{ type:Boolean },
			date:{ type:String, required:true },
			time:{ type:String },
			reportingTime:{ type:String },
			venue:{ type:String },
			description:{ type:String },
			image:{ type:String },
			tags:[ String ],
			registrationLink:{ type:String },
			viewCount:{ type:Number },
			registerClickCount:{ type:Number }
		}
		Failed [Internal server error]: http code 500

	>>> TODO (backend, REQUIRED — no frontend fallback exists for this):
	>>> Events, includeArchived.
	>>> Right now this route returns every event regardless of `archived`.
	>>> The frontend used to hide archived ones client-side as a backstop;
	>>> that backstop has been REMOVED — the public site now renders
	>>> exactly what this endpoint returns, no filtering of its own. Until
	>>> this backend change ships, archived events WILL be visible on the
	>>> public site. This is the same class of leak as the /api/contacts
	>>> issue below, just for events instead of the inbox — treat it with
	>>> the same priority.
	>>>
	>>> Required change:
	>>>   - Support `GET /api/events?includeArchived=true`.
	>>>   - Default (no param, or includeArchived=false): only return
	>>>     events where archived is not true. This must be enforced by
	>>>     the query itself (e.g. filter in the DB query), not by
	>>>     trimming the response after fetching everything.
	>>>   - `includeArchived=true` must require a valid admin bearer token
	>>>     (same Authorization: Bearer <token> as the /api/contacts admin
	>>>     routes). If the request has no valid token, ignore the param
	>>>     and fall back to the non-archived-only behavior — don't 401,
	>>>     just don't honor it, since GET /api/events is otherwise public.
	>>>   - The React frontend (src/services/api/events.js) already calls
	>>>     this with `eventsApi.getAll({ includeArchived: true })` from
	>>>     the admin panel and `{ includeArchived: false }` from the
	>>>     public site — it's just waiting on this backend support.
	>>>   - Archive/unarchive itself is unaffected by this TODO — that
	>>>     already works via `PUT /api/events/$id { archived: true|false }`
	>>>     and is only ever triggered from the admin panel
	>>>     (admin/store.js → toggleEventArchived), which is correct as-is.

POST /api/events:
	Input: eventObject (see above, minus id)
	Output:
		Success: input payload + generated id + http code 201
		Failed [Validation error]: http code 400
		Failed [Internal server error]: http code 500

PUT /api/events/$id:
	Input: partial or full eventObject (patch semantics — only send fields that changed)
	Output:
		Success: updated eventObject + http code 200
		Failed [Event not found]: http code 404
		Failed [Internal server error]: http code 500

DELETE /api/events/$id:
	Input:
	Output:
		Success: http code 200
		Failed [Event not found]: http code 404
		Failed [Internal server error]: http code 500

## Gallery

GET /api/gallery:
	Input:
	Output:
		Success: [ albumObject, ... ] + http code 200
			albumObject: {
			id:{ type:Number, required:true },
			title:{ type:String, required:true },
			date:{ type:String },
			cover:{ type:String },
			imageCount:{ type:Number },
			images: [ { id:Number, src:String, caption:String, featured:Boolean } ]
		}
		Failed [Internal server error]: http code 500

POST /api/gallery:					#create a new album
	Input: { title:{ type:String, required:true }, date:{ type:String } }
	Output:
		Success: albumObject + http code 201
		Failed [Internal server error]: http code 500

PUT /api/gallery/$albumId:				#rename / edit album metadata
	Input: { title:String, date:String, cover:String }
	Output:
		Success: updated albumObject + http code 200
		Failed [Album not found]: http code 404
		Failed [Internal server error]: http code 500

DELETE /api/gallery/$albumId:
	Output:
		Success: http code 200
		Failed [Album not found]: http code 404
		Failed [Internal server error]: http code 500

POST /api/gallery/$albumId/photos:			#bulk add photos to an album
	Input: { photos: [ { id:Number, src:String, caption:String, featured:Boolean } ] }
	Output:
		Success: updated albumObject + http code 201
		Failed [Album not found]: http code 404
		Failed [Internal server error]: http code 500

DELETE /api/gallery/$albumId/photos/$photoId:
	Output:
		Success: http code 200
		Failed [Album or photo not found]: http code 404
		Failed [Internal server error]: http code 500

PUT /api/gallery/$albumId/photos/$photoId:		#toggle/set featured flag (max 10 featured per album)
	Input: { featured:{ type:Boolean, required:true } }
	Output:
		Success: updated photo object + http code 200
		Failed [Featured cap reached (10)]: http code 409
		Failed [Album or photo not found]: http code 404
		Failed [Internal server error]: http code 500

	>>> TODO (backend, optional / not urgent) — Gallery highlights:
	>>> The public Gallery page currently calls GET /api/gallery (full
	>>> albums + every nested photo) just to pick the first 3 photos per
	>>> album for a homepage slideshow preview. Fine at today's gallery
	>>> size, but it means the payload grows with total photo count, not
	>>> with what's actually displayed. If the gallery grows large,
	>>> consider adding:
	>>>
	>>> GET /api/gallery/highlights:
	>>>   Output: [ { albumId, albumTitle, id, src, caption }, ... ] + 200
	>>>   Returns only the first N (e.g. 3) photos per album, computed
	>>>   server-side, instead of the full nested photo arrays.
	>>>
	>>> Not required now — just flagging so it doesn't get missed when
	>>> the gallery grows.

## Team roster

GET /api/team:
	Input:
	Output:
		Success: {
			"$batchYear": { coreTeam:[ teamMember ], mentors:[ teamMember ], developers:[ teamMember ] }, ...
		} + http code 200
			teamMember: {
			id:{ type:Number, required:true },
			name:{ type:String, required:true },
			role:{ type:String, required:true },
			designation:{ type:String },
			shortDescription:{ type:String },
			skills:[ String ],
			github:{ type:String }, linkedin:{ type:String }, instagram:{ type:String }, twitter:{ type:String },
			image:{ type:String }
		}
		Failed [Internal server error]: http code 500
	Note: returns the FULL multi-year history. Meant for the admin panel
	only (protected route, requires the admin bearer token). The public
	site uses GET /api/team/current instead; finished batch years are
	archived as static JSON on the frontend (src/data/team-archive) rather
	than re-fetched from here on every page load.

GET /api/team/current:				#lightweight — only the active/current batch year
	Input:
	Output:
		Success: { year:String, coreTeam:[ teamMember ], mentors:[ teamMember ], developers:[ teamMember ] } + http code 200
		Failed [No current year set]: http code 404
		Failed [Internal server error]: http code 500

POST /api/team:					#register a new batch year, e.g. { year: "2025-26" }
	Input: { year:{ type:String, required:true } }
	Output:
		Success: http code 201
		Failed [Year already exists]: http code 400
		Failed [Internal server error]: http code 500

POST /api/team/$year/$group:				#group is coreTeam | mentors | developers
	Input: teamMember (minus id)
	Output:
		Success: teamMember + generated id + http code 201
		Failed [Year or group not found]: http code 404
		Failed [Internal server error]: http code 500

PUT /api/team/$year/$group/$id:
	Input: partial teamMember
	Output:
		Success: updated teamMember + http code 200
		Failed [Member not found]: http code 404
		Failed [Internal server error]: http code 500

DELETE /api/team/$year/$group/$id:
	Output:
		Success: http code 200
		Failed [Member not found]: http code 404
		Failed [Internal server error]: http code 500

## Projects

GET /api/projects:
	Output:
		Success: [ projectObject, ... ] + http code 200
			projectObject: {
			id:{ type:Number, required:true },
			title:{ type:String, required:true },
			team:{ type:String },
			members:{ type:Number },
			tech:[ String ],
			description:{ type:String },
			stars:{ type:Number }, forks:{ type:Number },
			github:{ type:String }, demo:{ type:String },
			category:{ type:String },
			achieved:{ type:Boolean }
		}
		Failed [Internal server error]: http code 500

POST /api/projects:
	Input: projectObject (minus id)
	Output:
		Success: projectObject + generated id + http code 201
		Failed [Internal server error]: http code 500

PUT /api/projects/$id:
	Input: partial projectObject
	Output:
		Success: updated projectObject + http code 200
		Failed [Project not found]: http code 404
		Failed [Internal server error]: http code 500

DELETE /api/projects/$id:
	Output:
		Success: http code 200
		Failed [Project not found]: http code 404
		Failed [Internal server error]: http code 500

## Learning resources

REMOVED — learning resources are no longer backed by these endpoints.
They change a couple of times a year at most, so they now live as a
static file in the frontend repo (src/config/learning.js), the same way
clubInfo does. This eliminates one API call and one entire DB collection.
If your backend still has a `learning` collection, it can be dropped once
the static file has been checked in.

## Contact inbox

SECURITY NOTE: GET /api/contacts, PUT /api/contacts/$id, and
DELETE /api/contacts/$id must require a valid admin bearer token
(the same Authorization: Bearer <token> issued by POST /api/auth/login).
This inbox contains the personal names/emails/messages of anyone who used
the public contact form, so the backend — not just the frontend — needs to
enforce that only authenticated admins can read or modify it. Only
POST /api/contacts (the public submission) should be open.

GET /api/contacts:					#admin only
	Output:
		Success: [ contactObject, ... ] + http code 200
			contactObject: {
			id:{ type:Number, required:true },
			name:{ type:String, required:true },
			email:{ type:String, required:true },
			message:{ type:String, required:true },
			requestType:{ type:String },		#Collaboration | Join Club | Sponsorship | General Inquiry | Other
			date:{ type:String },
			status:{ type:String }			#New | Responded
		}
		Failed [Unauthorized]: http code 401
		Failed [Internal server error]: http code 500

POST /api/contacts:					#public contact form submission
	Input: { name:String, email:String, message:String, requestType:String }
	Output:
		Success: contactObject + http code 201
		Failed [Validation error]: http code 400
		Failed [Internal server error]: http code 500

PUT /api/contacts/$id:					#admin only — update status, e.g. mark as Responded
	Input: { status:{ type:String, required:true } }
	Output:
		Success: updated contactObject + http code 200
		Failed [Unauthorized]: http code 401
		Failed [Contact not found]: http code 404
		Failed [Internal server error]: http code 500

DELETE /api/contacts/$id:				#admin only
	Output:
		Success: http code 200
		Failed [Unauthorized]: http code 401
		Failed [Contact not found]: http code 404
		Failed [Internal server error]: http code 500

## Stats

GET /api/stats:					#lightweight, DB-side aggregation for public counters
	Input:
	Output:
		Success: {
			totalEvents:{ type:Number },
			activeMembers:{ type:Number },		#current batch year only
			studentProjects:{ type:Number },
			workshops:{ type:Number }
		} + http code 200
		Failed [Internal server error]: http code 500
	Note: backs the "50+ Events / 200+ Members" counters on the public Home
	page. The point of this endpoint is that the DB does the counting
	(COUNT / aggregate query) instead of the frontend downloading every
	event/project/team-member record just to read `.length`.

	>>> TODO (backend, REQUIRED) — GET /api/admin/stats:
	>>> The admin dashboard (admin/pages/Dashboard.js) used to compute its
	>>> stat cards client-side, by fetching the FULL events/team/projects
	>>> collections and counting/reducing over them in the browser. That's
	>>> been removed from the frontend (admin/store.js) — it now expects
	>>> the backend to do this counting, the same way GET /api/stats
	>>> already does for the public Home page.
	>>>
	>>> New endpoint needed:
	>>>
	>>> GET /api/admin/stats:				#admin only
	>>> 	Output:
	>>> 		Success: {
	>>> 			totalEvents:{ type:Number },		#all events, incl. archived
	>>> 			eventsConducted:{ type:Number },	#status === 'completed'
	>>> 			workshops:{ type:Number },		#type === 'Workshop'
	>>> 			studentProjects:{ type:Number },	#total project count
	>>> 			achievedProjects:{ type:Number },	#achieved === true
	>>> 			activeMembers:{ type:Number },		#total across all years
	>>> 			currentYearMembers:{ type:Number },	#current batch year only
	>>> 			currentYearKey:{ type:String }		#e.g. "2025-26", or null
	>>> 		} + http code 200
	>>> 		Failed [Unauthorized]: http code 401
	>>> 		Failed [Internal server error]: http code 500
	>>>
	>>> Same auth rule as /api/contacts and /api/team: requires a valid
	>>> admin bearer token, 401 without one (unlike the includeArchived
	>>> param above, this route has no public-facing fallback behavior —
	>>> it's admin-only, full stop).
	>>>
	>>> The frontend (src/services/api/stats.js → statsApi.getAdmin()) is
	>>> already wired to call this on every admin panel load, and again
	>>> after any create/update/delete/toggle of an event, team member, or
	>>> project (admin/store.js → refreshStats()). It currently has no
	>>> fallback if this 404s/500s — the dashboard will just show whatever
	>>> the request() interceptor produces on failure until this ships.

## Auth (admin panel)

POST /api/auth/login:
	Input: { username:{ type:String, required:true }, password:{ type:String, required:true } }
	Output:
		Success: { token:String } + http code 200
		Failed [Invalid credentials]: http code 401
		Failed [Internal server error]: http code 500