const axios = require("axios");
const pool = require("../config/db");

async function pullTrades(jobId) {
  try {
    console.log(`Starting Trade pull. Job Id: ${jobId}`);
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

    const response = await axios.get(
      `${process.env.BSE_API_URL}/getTrades?count=5000`,
    );

    const trades = response.data.trades;

    console.log(`${trades.length} trades received`);

    for (const trade of trades) {
      await pool.query(
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
    }

    await pool.query(
      `
            UPDATE pull_jobs
            SET
                status = $1,
                completed_at = NOW(),
                trades_received = $2
            WHERE id = $3
            `,
      ["COMPLETED", trades.length, jobId],
    );

    console.log(`Trade pull completed, Job Id: ${jobId}`);
  } catch (error) {
    console.error(`Trade pull Failed for job ID: ${jobId}`, error.message);
    await pool.query(
      `
            UPDATE pull_jobs
            SET
                status = $1,
                error_message = $2
            WHERE id = $3
            `,
      ["FAILED", error.message, jobId],
    );
  }
}

module.exports = {
  pullTrades,
};
