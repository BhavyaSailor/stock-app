# Trade Ingestion System - Architecture Note

## 1. Overview

This project is a full-stack trade ingestion system that simulates
receiving trade data from an external BSE-like API.

The system consists of:

1.  A **Mock BSE API** that provides trade data and simulates
    network/API delay.
2.  A **Node.js/Express backend** that manages pull jobs, retrieves new
    trades, persists them in PostgreSQL, and emits real-time events.
3.  A **PostgreSQL database** that stores trades and pull-job
    information.
4.  A **React dashboard** that displays stored trades and receives
    real-time pull status updates through Socket.IO.

The primary design requirement is that the dashboard remains usable
while a pull is running and automatically displays newly ingested trades
after the pull completes without a browser refresh or frontend polling.

------------------------------------------------------------------------

## 2. High-Level Architecture

``` text
                           ┌──────────────────────────┐
                           │       React / Vite       │
                           │      Trade Dashboard     │
                           └────────────┬─────────────┘
                                        │
                         REST           │          Socket.IO
                   GET /api/trades      │      PULL_* events
                                        │
                                        ▼
                           ┌──────────────────────────┐
                           │      Node / Express      │
                           │         Backend          │
                           │                          │
                           │  Controllers             │
                           │  Routes                  │
                           │  Trade Pull Service      │
                           └──────────┬───────┬───────┘
                                      │       │
                         HTTP / Axios │       │ PostgreSQL
                                      │       │
                                      ▼       ▼
                           ┌──────────────┐  ┌────────────────┐
                           │  Mock BSE    │  │   PostgreSQL   │
                           │     API      │  │                │
                           │   :4000      │  │ trades         │
                           └──────────────┘  │ pull_jobs      │
                                             └────────────────┘
```

------------------------------------------------------------------------

## 3. Main Data Flow

### Initial Dashboard Load

When the React dashboard opens:

``` text
React Dashboard
      │
      │ GET /api/trades
      ▼
Node/Express Backend
      │
      │ SQL SELECT
      ▼
PostgreSQL
      │
      │ Stored trades
      ▼
Node/Express Backend
      │
      │ JSON response
      ▼
React Dashboard
```

This allows the dashboard to immediately show trades that were already
pulled previously.

The frontend does not need to wait for a new ingestion job before
displaying existing data.

------------------------------------------------------------------------

## 4. Trade Pull Flow

When the user clicks **Pull Trades**:

``` text
                    User
                     │
                     ▼
              Pull Trades button
                     │
                     ▼
              POST /api/pulls
                     │
                     ▼
          Create PENDING pull job
                     │
                     ▼
             Start pull service
                     │
                     ▼
             Mark job RUNNING
                     │
                     ▼
          Find latest trade_id
                     │
                     ▼
     GET /getTrades?after=<trade_id>
                     │
                     ▼
               Mock BSE API
                     │
               configured delay
                     │
                     ▼
             Return new trades
                     │
                     ▼
           Insert into PostgreSQL
                     │
                     ▼
             Mark job COMPLETED
                     │
                     ▼
          Emit PULL_COMPLETED
                     │
                     ▼
             React receives event
                     │
                     ▼
             GET /api/trades
                     │
                     ▼
             Update dashboard
```

------------------------------------------------------------------------

## 5. Why the Pull Is Asynchronous

The pull endpoint returns `202 Accepted` after creating the pull job:

``` text
POST /api/pulls
        │
        ├── Create job
        │
        ├── Start pull
        │
        └── Return 202
```

The actual BSE request and database ingestion continue after the HTTP
response.

This is important because the Mock BSE intentionally introduces a
configurable delay. Blocking the HTTP request until the BSE response
arrives would make the API less responsive and would not provide the
desired dashboard behavior.

The pull service therefore handles the longer-running ingestion
operation separately.

------------------------------------------------------------------------

## 6. Incremental Trade Fetching

The backend first finds the latest stored trade:

``` sql
SELECT trade_id
FROM trades
ORDER BY id DESC
LIMIT 1;
```

If a previous trade exists, the backend requests:

``` text
/getTrades?after=<lastTradeId>
```

For example:

``` text
Database:
TRD02015
   │
   ▼
Mock BSE:
GET /getTrades?after=TRD02015
   │
   ▼
Only newer trades are returned
```

For the first pull, when there is no stored trade, the backend requests
an initial batch of new trades.

This prevents repeatedly ingesting the entire Mock BSE dataset.

------------------------------------------------------------------------

## 7. Database Design

### `trades`

Stores the actual trade records.

``` text
trades
├── id
├── trade_id
├── client
├── symbol
├── quantity
├── price
├── trade_timestamp
└── created_at
```

`trade_id` is unique because it identifies a specific trade.

Indexes are created for:

``` text
symbol
trade_timestamp
```

These support common filtering and time-based queries.

### `pull_jobs`

Stores ingestion job information.

``` text
pull_jobs
├── id
├── status
├── started_at
├── completed_at
├── error_message
├── trades_received
└── created_at
```

The job status follows:

``` text
PENDING → RUNNING → COMPLETED
```

or:

``` text
PENDING → RUNNING → FAILED
```

This separates operational ingestion state from the actual trade
records.

------------------------------------------------------------------------

## 8. Duplicate Handling

The database defines:

``` sql
trade_id VARCHAR(50) NOT NULL UNIQUE
```

The ingestion query uses:

``` sql
ON CONFLICT (trade_id)
DO NOTHING
```

Therefore, if the Mock BSE returns a trade that is already present, the
duplicate is ignored instead of causing the complete pull to fail.

The backend tracks:

``` text
trades received
new trades inserted
duplicates ignored
```

These values can be reported to the dashboard after a pull completes.

------------------------------------------------------------------------

## 9. Real-Time Communication

The project uses REST APIs and Socket.IO for different purposes.

### REST

REST is used when actual data needs to be retrieved:

``` text
GET /api/trades
POST /api/pulls
```

### Socket.IO

Socket.IO is used to notify the dashboard about changes in pull state.

The backend emits:

``` text
PULL_STARTED
PULL_RUNNING
PULL_COMPLETED
PULL_FAILED
```

For example:

``` text
Backend
   │
   │ PULL_COMPLETED
   ▼
Socket.IO
   │
   ▼
React Dashboard
   │
   │ GET /api/trades
   ▼
Backend
   │
   ▼
Latest PostgreSQL data
```

The frontend therefore does not need:

``` text
setInterval(...)
```

or another polling loop.

------------------------------------------------------------------------

## 10. Key Assessment Requirement

The most important behavior is:

``` text
Existing trades
      │
      │ Pull starts
      ▼
Existing trades remain visible
      │
      │ Mock BSE delay
      ▼
Pull completes
      │
      │ Socket.IO notification
      ▼
New trades appear automatically
```

There is no:

-   browser refresh
-   frontend polling loop
-   cron job
-   scheduler required for dashboard updates

The backend pushes the completion notification to the connected
frontend, and the frontend retrieves the latest stored data.

------------------------------------------------------------------------

## 11. Why This Design

### Separate Mock BSE

The Mock BSE represents an external provider. Keeping it separate allows
the project to simulate:

-   external API calls
-   response latency
-   new trade generation
-   incremental data retrieval

without depending on a real exchange API.

### Node/Express backend

The backend provides a clear boundary between the frontend, external
API, and database.

It is responsible for:

-   starting pull jobs
-   communicating with the Mock BSE
-   validating/storing trades
-   handling duplicates
-   tracking pull status
-   notifying connected clients

### PostgreSQL

PostgreSQL is used because trade records are persistent structured data
that benefit from:

-   relational storage
-   unique constraints
-   indexes
-   SQL queries
-   reliable persistence

### Socket.IO

Socket.IO provides an efficient way to notify the dashboard when an
asynchronous ingestion operation changes state.

It is more suitable for the real-time requirement than repeatedly asking
the server whether the pull has finished.

### Pull-job table

Keeping `pull_jobs` separate from `trades` makes ingestion activity
independently trackable.

This allows the UI and future monitoring functionality to know:

-   whether a pull is running
-   which job ran last
-   when it started
-   when it completed
-   how many trades were received
-   whether an error occurred

------------------------------------------------------------------------

## 12. Component Responsibilities

  Component            Responsibility
  -------------------- -----------------------------------------------
  Mock BSE             Generate/serve trade data and simulate delay
  Express routes       Expose backend HTTP endpoints
  Controllers          Handle API requests and create pull jobs
  Trade pull service   Perform asynchronous ingestion
  PostgreSQL           Persist trades and pull-job state
  Socket.IO            Notify connected dashboards about pull events
  React dashboard      Display trades and pull status
  Axios                Perform REST API requests
  Socket.IO Client     Receive real-time backend events

------------------------------------------------------------------------

## 13. Example End-to-End Scenario

Assume PostgreSQL currently contains:

``` text
2,180 trades
Latest trade: TRD02015
```

The Mock BSE generates:

``` text
150 new trades
```

The user clicks **Pull Trades**.

The backend:

1.  Creates a new pull job.
2.  Changes its status to `RUNNING`.
3.  Finds `TRD02015` as the latest stored trade.
4.  Requests `/getTrades?after=TRD02015`.
5.  Waits for the configured Mock BSE delay.
6.  Receives 150 trades.
7.  Inserts the new records into PostgreSQL.
8.  Marks the job as `COMPLETED`.
9.  Emits `PULL_COMPLETED`.

The React dashboard receives the event and loads the latest trade list.

Result:

``` text
Previous total: 2180
New trades:      150
Current total:  2330
```

The user does not refresh the browser.

------------------------------------------------------------------------

## 14. Trade-Offs

This implementation intentionally focuses on clarity and the assessment
requirements.

For a production-scale ingestion system, additional improvements could
include:

-   batched database inserts instead of one insert query per trade
-   transaction handling for larger ingestion batches
-   retry/backoff for external API failures
-   authentication and authorization
-   pagination for large dashboard datasets
-   structured logging
-   monitoring and metrics
-   queue-based background processing
-   deployment configuration

These are outside the core scope of the current assessment.

------------------------------------------------------------------------

## 15. Summary

The architecture separates external data simulation, ingestion logic,
persistence, and presentation.

The key flow is:

``` text
Mock BSE
   ↓
Node/Express
   ↓
PostgreSQL
   ↓
Socket.IO notification
   ↓
React Dashboard
```

This design satisfies the main real-time requirement while keeping the
components independently understandable and easy to test.
