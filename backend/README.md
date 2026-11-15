# Backend

This is the Spring Boot 4.1.2 / Java 21 REST API for Orchiva. It is a modular monolith with identity, request, workflow, document, notification, audit, and administration packages under `com.orchiva.workflow`. PostgreSQL holds relational state; Flyway V1–V7 owns schema evolution; Hibernate uses `ddl-auto: validate`. Document bytes are stored in a configurable local directory.

From `backend/`, with a running PostgreSQL instance and `ORCHIVA_DB_PASSWORD` set in the current PowerShell session:

```powershell
mvn spring-boot:run
```

Local endpoints: `http://localhost:8080/api/health`, `/actuator/health`, and `/swagger-ui.html`. Database and storage defaults are in `src/main/resources/application.yml`; see the [root setup guide](../README.md#run-locally-on-windows) and [database prerequisites](../database/README.md).

```powershell
mvn test
mvn package
```

The native PostgreSQL integration test requires a separate `orchiva_test` database and the password environment variable. Without the variable it is reported as skipped. The project-local `.mvn/settings.xml` directs dependency resolution exclusively to Maven Central.

