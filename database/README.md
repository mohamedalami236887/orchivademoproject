# Local PostgreSQL setup

Orchiva requires a running PostgreSQL server, a dedicated application role, and the `orchiva` database. The separate `orchiva_test` database is needed only for the native Flyway integration test. This setup was developed with PostgreSQL 18; another compatible installation may have a different `bin` path.

If these resources do **not** already exist, open PowerShell and locate your PostgreSQL `bin` directory. The following commands create new Orchiva-owned resources; they do not reset an existing database. If a role or database already exists, inspect it and skip the corresponding creation command.

```powershell
$pgBin = Read-Host 'Full path to the PostgreSQL bin directory'
& (Join-Path $pgBin 'createuser.exe') --host localhost --username postgres --pwprompt orchiva_app
& (Join-Path $pgBin 'createdb.exe') --host localhost --username postgres --owner orchiva_app orchiva
& (Join-Path $pgBin 'createdb.exe') --host localhost --username postgres --owner orchiva_app orchiva_test
```

PostgreSQL prompts for the administrator password as required, and `createuser` prompts for the new application-role password. The application role must own the databases so Flyway can create its tables. Do not put a real password in a project file.

In the same terminal used to start Maven or run the integration test, enter that application-role password:

```powershell
$env:ORCHIVA_DB_PASSWORD = Read-Host 'Orchiva database password' -MaskInput
```

The backend defaults to `jdbc:postgresql://localhost:5432/orchiva` and `orchiva_app`. The integration profile defaults to `jdbc:postgresql://localhost:5432/orchiva_test`. Override `ORCHIVA_DB_URL`, `ORCHIVA_DB_USERNAME`, `ORCHIVA_TEST_DB_URL`, or `ORCHIVA_TEST_DB_USERNAME` in the local environment only if your setup differs. Flyway applies pending migrations at startup; Hibernate validates the resulting schema. Neither application startup nor the integration test drops or resets the database.

