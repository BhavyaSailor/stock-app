require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const tradeRoutes = require("./routes/tradeRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Trade ingestion backend is running",
  });
});

app.get("/health/db-info", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                current_database(),
                current_schema()
        `);

        res.json(result.rows[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database check failed"
        });
    }
});
app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("DB connection error", error);
    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/api/trades", tradeRoutes);

app.listen(PORT, () => {
  console.log(`Trade ingestion running on port ${PORT}`);
});
