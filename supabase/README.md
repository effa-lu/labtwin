# Supabase — not started

`migrations/` — plain SQL, timestamp-named, append-only once applied.
`functions/`  — Edge Functions: LLM proxy, CSV validation, weekly email digest.
Schema target: workspaces, orgs, members, plans, spaces, entities, items, events, notes, notification_prefs.
Every table (except orgs) carries workspace_id and has RLS enabled.
