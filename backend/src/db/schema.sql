CREATE TABLE IF NOT EXISTS trades (
    id BIGSERIAL PRIMARY KEY,

    trade_id VARCHAR(50) NOT NULL UNIQUE,

    client VARCHAR(100) NOT NULL,

    symbol VARCHAR(50) NOT NULL,

    quantity INTEGER NOT NULL,

    price NUMERIC(12, 2) NOT NULL,

    trade_timestamp TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS pull_jobs (
    id BIGSERIAL PRIMARY KEY,

    status VARCHAR(20) NOT NULL,

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    error_message TEXT,

    trades_received INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS idx_trades_symbol
ON trades(symbol);


CREATE INDEX IF NOT EXISTS idx_trades_timestamp
ON trades(trade_timestamp);