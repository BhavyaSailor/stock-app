const pool = require("../config/db");

async function getLastTradeId() {
  const result = await pool.query(`
    SELECT trade_id
    FROM trades
    ORDER BY id DESC
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].trade_id;
}

async function insertTrades(trades) {
  let newTrades = 0;
  let duplicates = 0;

  for (const trade of trades) {
    const result = await pool.query(
      `
        INSERT INTO trades (
          trade_id,
          client,
          symbol,
          quantity,
          price,
          trade_timestamp
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (trade_id)
        DO NOTHING
      `,
      [
        trade.tradeId,
        trade.client,
        trade.symbol,
        trade.quantity,
        trade.price,
        trade.timestamp,
      ],
    );

    if (result.rowCount === 1) {
      newTrades++;
    } else {
      duplicates++;
    }
  }

  return {
    newTrades,
    duplicates,
  };
}

async function markJobRunning(jobId) {
  await pool.query(
    `
      UPDATE pull_jobs
      SET
        status = $1,
        started_at = NOW()
      WHERE id = $2
    `,
    ["RUNNING", jobId],
  );
}

async function markJobCompleted(jobId, tradesReceived) {
  await pool.query(
    `
      UPDATE pull_jobs
      SET
        status = $1,
        completed_at = NOW(),
        trades_received = $2
      WHERE id = $3
    `,
    ["COMPLETED", tradesReceived, jobId],
  );
}

async function markJobFailed(jobId, errorMessage) {
  await pool.query(
    `
      UPDATE pull_jobs
      SET
        status = $1,
        error_message = $2
      WHERE id = $3
    `,
    ["FAILED", errorMessage, jobId],
  );
}

module.exports = {
  getLastTradeId,
  insertTrades,
  markJobRunning,
  markJobCompleted,
  markJobFailed,
};
