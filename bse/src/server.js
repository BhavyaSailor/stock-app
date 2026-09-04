require("dotenv").config();

const express = require("express");
const {
  generateNewTrades,
  addNewTrades,
} = require("../src/data/generateTrades");
const app = express();

const PORT = process.env.PORT || 4000;
const BSE_DELAY_SECONDS = Number(process.env.BSE_DELAY_SECONDS) || 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.get("/", (req, res) => {
  res.json({ message: "server started" });
});

app.get("/getTrades", async (req, res) => {
  try {
    const count = Number(req.query.newTrades) || 1000;

    console.log(`BSE pull requested. Generating ${count} new trades.`);

    const newTrades = generateNewTrades(count);

    console.log(`Generated ${newTrades.length} new trades.`);

    console.log(`First trade: ${newTrades[0].tradeId}`);

    console.log(`Last trade: ${newTrades[newTrades.length - 1].tradeId}`);

    console.log(`Waiting ${BSE_DELAY_SECONDS} seconds before responding...`);

    await delay(BSE_DELAY_SECONDS * 1000);

    res.json({
      count: newTrades.length,

      trades: newTrades,
    });
  } catch (error) {
    console.error("BSE error:", error);

    res.status(500).json({
      message: "Failed to generate trades",
    });
  }
});
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`Mock BSE running on port ${PORT}`);
  console.log("====================================");
});
