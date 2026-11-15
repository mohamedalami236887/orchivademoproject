# Technical tradeoffs and limitations

## Deliberate choices

- A modular monolith keeps approval, request, notification, audit, and document metadata changes in one transaction while preserving package boundaries.
- PostgreSQL and Flyway are the schema authority. Hibernate validates mappings and never creates missing tables. Forward migrations preserve data and history.
- Server sessions avoid browser-held bearer tokens. Horizontal scaling would require shared session storage.
- Document bytes stay behind a local storage abstraction while PostgreSQL stores authorization, versions, size, MIME type, and SHA-256 metadata.
- Published workflow versions are immutable. Editing means publishing a new version; running instances remain reproducible.
- Code-native SVG icons and system fonts prevent external asset requests and keep the interface available offline.

## Known limits

- Dashboard visualizations use lightweight CSS and HTML so no chart dependency is required.
- Preview is limited to PDF, PNG, JPEG, and plain text and is served with `nosniff`; all other types download as attachments.
- Email, push, retention automation, malware scanning, backups, TLS termination, and external identity are deployment concerns outside this local portfolio scope.
- Native PostgreSQL tests require the password environment variable in the invoking process. They apply pending forward migrations but never drop, truncate, or reset a database.
