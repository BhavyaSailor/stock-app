# Trade Ingestion and Real-Time Dashboard

A full-stack trade ingestion and monitoring system that simulates
pulling trade data from a Mock BSE API, stores the data in PostgreSQL,
and displays it through a React dashboard with real-time pull status and
trade updates.

The main goal of the project is to demonstrate an ingestion flow where:

-   Existing trades remain visible while a new pull is running.
-   The backend fetches only trades that are newer than the latest
    stored trade.
-   Pulled trades are persisted in PostgreSQL.
-   The dashboard receives a Socket.IO event when the pull completes and
    updates automatically.
-   No page refresh, polling loop, or cron/scheduler is required for
    dashboard updates.

## Architecture

The project contains three application components:

``` text
                         HTTP
┌─────────────────┐  ───────────────►  ┌──────────────────────┐
│   React/Vite    │                    │   Node/Express       │
│    Dashboard    │  ◄──── Socket.IO ──│      Backend         │
└─────────────────┘                    └──────────┬───────────┘
                                                  │
                                  HTTP            │ SQL
                                                  │
                            ┌─────────────────────│
                            │                     │
                            ▼                     ▼
                     ┌────────────────┐   ┌────────────────┐
                     │   Mock BSE API │   │   PostgreSQL   │
                     │     :4000      │   │     Database   │
                     └────────────────┘   └────────────────┘
```

See [`architecture.md`](docs/architecture.md) for the detailed flow
and design decisions.

## Tech Stack

### Frontend

-   React
-   Vite
-   Tailwind CSS
-   shadcn/ui
-   Axios
-   Socket.IO Client
-   Lucide React

### Backend

-   Node.js
-   Express.js
-   Axios
-   Socket.IO
-   PostgreSQL (`pg`)

### Mock BSE

-   Node.js
-   Express.js
-   Configurable response delay
-   Seeded/generated trade data

### Database

-   PostgreSQL

## Project Structure

``` text
stocks/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── pullController.js
│   │   └── tradeController.js
│   ├── routes/
│   │   ├── pullRoutes.js
│   │   └── tradeRoutes.js
│   ├── services/
│   │   └── tradePullService.js
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── bse/
│   ├── ...
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docs/
│   └── architecture.md
│
├── README.md
└── .gitignore
```

## Prerequisites

Install the following before running the project:

-   Node.js
-   npm
-   PostgreSQL
-   Git

## Database Setup

Create a PostgreSQL database named:

``` text
trade_ingestion
```

Then create the required tables:

``` sql
CREATE TABLE trades (
    id BIGSERIAL PRIMARY KEY,
    trade_id VARCHAR(50) NOT NULL UNIQUE,
    client VARCHAR(100) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    trade_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pull_jobs (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    trades_received INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_timestamp ON trades(trade_timestamp);
```

### Resetting the database

For development/testing, the tables can be cleared with:

``` sql
TRUNCATE TABLE trades RESTART IDENTITY CASCADE;
TRUNCATE TABLE pull_jobs RESTART IDENTITY CASCADE;
```
To restart the trades in Mock-BSE you need to refresh trades.json ("bse\data\trades.json") with [] (Empty array)


## Environment Variables

For running the project locally, use .env.example

### Backend

Create `backend/.env`:

``` env
PORT=5000
DATABASE_URL=postgresql://<username>:<password>@localhost:5432/trade_ingestion
BSE_API_URL=http://localhost:4000
```

Use the database connection format expected by your local PostgreSQL
setup.

### Mock BSE

Create the environment file used by your BSE service if required by the
current implementation.

The Mock BSE runs on:

``` text
http://localhost:4000
```

### Frontend

The frontend currently connects to the backend at:

``` text
http://localhost:5000/api
```

and Socket.IO at:

``` text
http://localhost:5000
```

If you change the backend host or port, update the frontend API/socket
configuration accordingly.

## Installation

Clone the repository:

``` bash
git clone <this-repository-url>
cd stocks
```

Install dependencies in each application.

### 1. Mock BSE

``` bash
cd bse
npm install
```

### 2. Backend

Open another terminal:

``` bash
cd backend
npm install
```

### 3. Frontend

Open another terminal:

``` bash
cd frontend
npm install
```

## Running the Project

Three services are used during development.

### Terminal 1: Mock BSE

``` bash
cd bse
npm run dev
```

Expected service:

``` text
http://localhost:4000
```

### Terminal 2: Backend

``` bash
cd backend
npm run dev
```

Expected service:

``` text
http://localhost:5000
```

### Terminal 3: Frontend

``` bash
cd frontend
npm run dev
```

Vite will display the local frontend URL, normally:

``` text
http://localhost:5173
```

## API Endpoints

### Mock BSE

#### Get trades

``` http
GET http://localhost:4000/getTrades
```

Returns trade data from the Mock BSE.

The backend can request only trades after the latest stored trade:

``` http
GET http://localhost:4000/getTrades?after=<lastTradeId>
```

For the first pull, the current backend can request a batch of new
trades using:

``` http
GET http://localhost:4000/getTrades?newTrades=1000
```

#### Generate new mock trades

``` http
GET http://localhost:4000/generateTrades?count=150
```

The `count` value can be changed when testing the ingestion flow.

The Mock BSE also supports a configurable response delay so that the
dashboard can be observed while a pull is in progress.

### Backend

#### Get stored trades

``` http
GET http://localhost:5000/api/trades
```

Returns trades currently stored in PostgreSQL.

Example response shape:

``` json
{
  "count": 2180,
  "trades": [
    {
      "id": 1,
      "trade_id": "TRD00001",
      "client": "Client A",
      "symbol": "RELIANCE",
      "quantity": 100,
      "price": 2500.50,
      "trade_timestamp": "2026-10-06T10:00:00.000Z",
      "created_at": "2026-10-06T10:00:01.000Z"
    }
  ]
}
```

#### Start a trade pull

``` http
POST http://localhost:5000/api/pulls
```

The endpoint creates a pull job and starts the ingestion process
asynchronously.

It returns HTTP `202 Accepted` because the pull continues after the
request has been accepted.

## Trade Pull Flow

The main ingestion flow is:

``` text
User clicks "Pull Trades"
        │
        ▼
POST /api/pulls
        │
        ▼
Create PENDING pull_jobs record
        │
        ▼
Start pullTrades() in the backend
        │
        ▼
Set job status to RUNNING
        │
        ▼
Find latest stored trade_id
        │
        ▼
Request Mock BSE:
GET /getTrades?after=<lastTradeId>
        │
        ▼
Mock BSE waits for configured delay
        │
        ▼
Return new trades
        │
        ▼
Insert trades into PostgreSQL
with ON CONFLICT DO NOTHING
        │
        ▼
Mark pull job COMPLETED
        │
        ▼
Emit PULL_COMPLETED through Socket.IO
        │
        ▼
React receives event
        │
        ▼
Fetch latest stored trades
        │
        ▼
Dashboard updates automatically
```

## Incremental Ingestion

The backend checks the latest stored trade before requesting data from
the Mock BSE:

``` sql
SELECT trade_id
FROM trades
ORDER BY id DESC
LIMIT 1;
```

If a trade already exists, the backend requests:

``` text
/getTrades?after=<lastTradeId>
```

This allows the system to pull only newer trades instead of repeatedly
requesting the complete dataset.

For the first pull, when there is no stored trade, the backend requests
a configured batch of new trades.

## Duplicate Protection

`trade_id` is defined as unique in PostgreSQL:

``` sql
trade_id VARCHAR(50) NOT NULL UNIQUE
```

The ingestion service also uses:

``` sql
ON CONFLICT (trade_id)
DO NOTHING
```

This means a duplicate trade does not cause the entire pull to fail.

The service tracks:

-   Number of trades received from the Mock BSE
-   Number of newly inserted trades
-   Number of duplicate trades

## Pull Job Tracking

Each pull is represented by a row in `pull_jobs`.

The main statuses are:

``` text
PENDING
   ↓
RUNNING
   ↓
COMPLETED
```

If an error occurs:

``` text
PENDING
   ↓
RUNNING
   ↓
FAILED
```

The table stores:

-   Job ID
-   Status
-   Start time
-   Completion time
-   Number of trades received
-   Error message when applicable
-   Creation time

This allows the dashboard to display the current pull status and
information about the last pull.

## Real-Time Dashboard Updates

The dashboard uses two different communication mechanisms for different
purposes.

### REST API

The initial dashboard data is loaded through:

``` http
GET /api/trades
```

This means the dashboard can immediately display trades that are already
stored in PostgreSQL.

### Socket.IO

Socket.IO is used for real-time pull status and completion
notifications.

The backend emits events such as:

``` text
PULL_STARTED
PULL_RUNNING
PULL_COMPLETED
PULL_FAILED
```

When `PULL_COMPLETED` is received, the React dashboard requests the
latest stored trades and updates the table.

The dashboard does not use:

-   `setInterval`
-   continuous polling
-   a cron job
-   a page refresh

This design keeps existing data visible during the pull and allows newly
ingested trades to appear automatically when the pull finishes.

## Testing the Main Requirement

A simple way to demonstrate the complete workflow:

### 1. Start all three services

-   Mock BSE
-   Backend
-   Frontend

### 2. Open the dashboard

Confirm that existing trades are displayed.

For example:

``` text
Total Trades: 2180
```

### 3. Generate new trades

Open:

``` text
http://localhost:4000/generateTrades?count=150
```

This creates 150 new trades in the Mock BSE.

### 4. Start the pull

Click:

``` text
Pull Trades
```

The dashboard should show:

``` text
PULL_RUNNING
```

Existing trades should remain visible during the configured Mock BSE
delay.

### 5. Wait for completion

After the Mock BSE responds, the backend stores the new trades and
emits:

``` text
PULL_COMPLETED
```

The dashboard should update automatically.

For example:

``` text
Previous total: 2180
New trades:     150
New total:      2330
```

The browser should not be refreshed.

## Design Decisions

### Separate Mock BSE service

The Mock BSE represents an external trade data provider. Keeping it
separate from the backend makes it possible to simulate external API
behavior, delays, and newly arriving trades.

### PostgreSQL persistence

PostgreSQL provides durable storage, uniqueness constraints, indexing,
and SQL querying for the trade data.

### Background pull

The `POST /api/pulls` endpoint creates the job and returns
`202 Accepted` while the actual ingestion continues asynchronously. This
prevents the HTTP request from being blocked by the simulated BSE delay.

### Socket.IO for notifications

Socket.IO is used to notify the dashboard when pull state changes. This
avoids implementing a polling loop in the frontend.

### `pull_jobs` table

Pull jobs are stored separately from trades so ingestion activity can be
tracked independently from the trade dataset.


## Assessment Requirements Covered

  -----------------------------------------------------------------------
  Requirement                         Implementation
  ----------------------------------- -----------------------------------
  Mock BSE API :                      Separate Node/Express Mock BSE
                                      service

  Thousands of trades :                Seeded/generated trade dataset

  Configurable pull delay :            Mock BSE response delay

  Persistent trade storage :           PostgreSQL

  Existing trades visible during pull : React keeps current trade state
                                      while pull is running

  No page refresh  :                   Dashboard reacts to Socket.IO
                                      events

  No polling loop  :                   Socket.IO is used for pull
                                      notifications

  New trades appear automatically  :   `PULL_COMPLETED` triggers a fresh
                                      trade fetch

  Pull tracking  :                     `pull_jobs` table

  Duplicate handling  :                Unique `trade_id` +
                                      `ON CONFLICT DO NOTHING`
  -----------------------------------------------------------------------