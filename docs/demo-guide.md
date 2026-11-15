# Multirole demonstration guide

This walkthrough uses only seeded relational data and persisted application events.

1. Start PostgreSQL, the backend, and Angular using the README commands.
2. Sign in as `manager`. The dashboard and approval inbox are department-scoped. Open `REQ-2026-000902`, inspect its workflow and documents, approve the manager step, then sign out.
3. Sign in as `finance`. Open the new Finance task, inspect the same context and prior decision, and approve it.
4. Sign in as `employee`. Open the request from notifications or search. Confirm the approved state, actors and timestamps in approval history, and matching activity events.
5. Sign in as `admin`. Search audit history by request reference, expand technical metadata, inspect immutable workflow versions, and review organization assignments.
6. Repeat with a new draft and choose Request changes. Confirm an explanation is required, edit and resubmit, and verify the attempt advances without changing prior history.

Suggested captures are documented in [screenshots.md](screenshots.md). Do not use staged or fabricated events in portfolio media.
