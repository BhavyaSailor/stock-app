const pool = require("../config/db");
const { pullTrades } = require("../services/tradePullService");

async function startPull(req, res) {
  try {
    const result = await pool.query(
      `
            INSERT INTO pull_jobs (status)
            VALUES ($1)
            RETURNING id, status, created_at
            `,
      ["PENDING"],
    );

    const job = result.rows[0];

    const io = req.app.get("io");
    io.emit("PULL_STARTED", {
      jobId: job.id,
      status: "PENDING",
    });

    pullTrades(job.id, io);
    res.status(202).json({
      message: " Trade pull started",
      job,
    });
  } catch (error) {
    console.error("Error in Starting trade pull", error);
    res.status(500).json({
      message: "error in starting trade pull",
    });
  }
}
module.exports = {
  startPull,
};
