const axios = require("axios");
const pool = require("../config/db");

async function pullTrades(jobId, io) {
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
    io.emit("PULL_RUNNING", {
      jobId,
      status: "RUNNING",
    });

    const response = await axios.get(
      `${process.env.BSE_API_URL}/getTrades?newTrades=1000`,
    );

    const trades = response.data.trades;

    console.log(`${trades.length} trades received`);

    let newTrades = 0;
    let duplicates = 0;
    for (const trade of trades) {
     const result =  await pool.query(

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

    console.log(`New trades inerted, ${newTrades}`);
    console.log(`Duplicate trades, ${duplicates}`);

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

    io.emit("PULL_COMPLETED", {
      jobId,
      status: "COMPLETED",
      tradesReceived: trades.length,
      newTrades,
      duplicates,
    });

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

    io.emit("PULL_FAILED", {
      jobId,
      status: "FAILED",
      error: error.message,
    });
  }
}

module.exports = {
  pullTrades,
};
