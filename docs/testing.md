# Testing and reliability

## Automated checks

From `backend/`:

```powershell
mvn test
mvn package
```

Domain and service tests cover request transitions, approval decisions, password hashing, authorization, notifications, and document storage. `FlywayMigrationIntegrationTest` starts Spring against native PostgreSQL `orchiva_test`, checks Flyway V1–V7 and required tables, and verifies seeded workflow steps. It runs only when `ORCHIVA_DB_PASSWORD` is present in the Maven process; otherwise Maven reports it as skipped. The test applies pending forward migrations but does not drop, truncate, or reset the database.

To run that test explicitly, first follow [database setup](../database/README.md), then from `backend/`:

```powershell
$env:ORCHIVA_DB_PASSWORD = Read-Host 'Orchiva database password' -MaskInput
mvn test -Dtest=FlywayMigrationIntegrationTest
```

From `frontend/`:

```powershell
npm.cmd test -- --watch=false
npm.cmd run build
npm.cmd run check:approval-contrast
```

Angular tests cover routes, forms, theme bindings, draft submission, approval actions, administration, and request views. Production compilation validates lazy routes and strict templates. The contrast script calculates CSS token ratios; browser-computed colors, layout, autofill, and responsive behavior still require visual inspection.

## Manual end-to-end scenario

1. Sign in as the local employee and create a purchase draft with supporting evidence.
2. Choose **Submit for approval** and confirm the persisted request enters the published workflow.
3. Sign in as the department manager and approve the pending task.
4. Sign in as finance and approve the generated second task.
5. Sign in as the employee to inspect status, notification, and approval history.
6. Sign in as admin to inspect audit events and the workflow version.
7. Repeat locally with rejection and changes-requested outcomes, including a required comment.

Do not treat unit-test counts or the environment-gated integration test as evidence that this browser scenario has been completed.

