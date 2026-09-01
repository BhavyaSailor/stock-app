const pool = require("../config/db");

async function getTrades(req, res) {
  try {
    const result = await pool.query(`
            SELECT
                id,
                trade_id,
                client,
                symbol,
                quantity,
                price,
                trade_timestamp,
                created_at
            FROM trades
            ORDER BY trade_timestamp DESC
        `);
    res.json({
      count: result.rows.length,
      trades: result.rows,
    });
  } catch (error) {
    console.error("Error Fetching Trades", error);
    res.status(500).json({
      message: "Failed fetching trades",
    });
  }
}

module.exports = {
    getTrades
}