require("dotenv").config();

const express = require("express");
const {
  getTradesAfter,
  generateNewTrades,
} = require("../src/data/generateTrades");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 4000;
const BSE_DELAY_SECONDS = Number(process.env.BSE_DELAY_SECONDS) || 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.get("/", (req, res) => {
  res.json({ message: "server started" });
});

app.post("/generateTrades", async (req, res) => {
  try {
    const count = Number(req.body?.count) || Number(req.query.count) || 1000;

    console.log(`Generating ${count} new trades...`);

    const newTrades = generateNewTrades(count);

    console.log(`Generated ${newTrades.length} new trades.`);

    console.log(`First trade: ${newTrades[0].tradeId}`);

    console.log(`Last trade: ${newTrades[newTrades.length - 1].tradeId}`);

    res.json({
      count: newTrades.length,
      trades: newTrades,
    });
  } catch (error) {
    console.error("Error generating trades:", error);

    res.status(500).json({
      message: "Failed to generate trades",
    });
  }
});

app.get("/getTrades", async (req, res) => {
  try {
    const after = req.query.after;

    console.log(`BSE pull requested. After: ${after || "START / 0"}`);

    const trades = getTradesAfter(after);

    console.log(`Waiting ${BSE_DELAY_SECONDS} seconds before responding...`);
    console.log(`Found ${trades.length} trades to return.`);
console.log("...............")

    await delay(BSE_DELAY_SECONDS * 1000);

    res.json({
      count: trades.length,
      trades: trades,
    });
  } catch (error) {
    console.error("Error fetching trades:", error);

    res.status(500).json({
      message: "Failed to fetch trades",
    });
  }
});
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`Mock BSE running on port ${PORT}`);
  console.log("====================================");
});
