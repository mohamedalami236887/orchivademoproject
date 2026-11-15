# Workflow state machine

Every transition is validated by backend domain logic inside a transaction. The frontend never determines whether a transition is valid.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create request
    DRAFT --> SUBMITTED: Submit
    SUBMITTED --> IN_REVIEW: Start or resume workflow / create first task
    IN_REVIEW --> IN_REVIEW: Approve step / create next task
    IN_REVIEW --> APPROVED: Approve final step
    IN_REVIEW --> REJECTED: Reject
    IN_REVIEW --> CHANGES_REQUESTED: Request changes
    CHANGES_REQUESTED --> SUBMITTED: Edit and resubmit
    DRAFT --> CANCELLED: Cancel
    SUBMITTED --> CANCELLED: Cancel
    CHANGES_REQUESTED --> CANCELLED: Cancel
    APPROVED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]
```

## Decision sequence

```mermaid
sequenceDiagram
    participant E as Employee
    participant API as Request API
    participant W as Workflow service
    participant M as Manager
    participant F as Finance
    E->>API: Submit draft
    API->>W: Start published workflow version
    W-->>M: Create manager task
    M->>W: Approve (task row locked)
    W-->>F: Create finance task
    F->>W: Approve (task row locked)
    W-->>E: Mark approved and persist notification
```

## Concurrency behavior

Decision processing loads the approval task with a PostgreSQL pessimistic write lock. The first transaction changes it from `PENDING`; a competing transaction waits, then observes the terminal state and receives a conflict response. The request and workflow cannot diverge because task, decision, workflow, request, audit, and notification changes share the transaction.
