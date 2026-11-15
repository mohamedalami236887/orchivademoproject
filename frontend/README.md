# Frontend

This Angular 21 client uses standalone components, signals, reactive forms, SCSS, and the local Spring Boot REST API. The development proxy sends `/api`, Actuator, and OpenAPI requests to `http://localhost:8080`; browser requests stay on the frontend's local origin.

From `frontend/`, start the backend first, then run:

```powershell
npm.cmd ci
npm.cmd start
```

Open `http://localhost:4200`. Dependency resolution uses the official npm registry configured in `.npmrc`.

```powershell
npm.cmd test -- --watch=false
npm.cmd run build
npm.cmd run check:approval-contrast
```

See the [root README](../README.md) for PostgreSQL prerequisites, local demo accounts, architecture, and limitations. The contrast script calculates semantic token ratios; it does not replace visual review in a browser.

