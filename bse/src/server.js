require("dotenv").config();

const express = require("express");
const { getTrades, generateTrades } = require("../src/data/generateTrades");
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
  const count = Number(req.query.count) || 5000;

  console.log(`BSE pull started: generating ${count} trades`);

  const trades = generateTrades(count);

  console.log(`Waiting ${BSE_DELAY_SECONDS} seconds before responding...`);

  await delay(BSE_DELAY_SECONDS * 1000);

  console.log("BSE pull completed");
  

  res.json({
    count: trades.length,
    trades: trades,
  });
});
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`Mock BSE running on port ${PORT}`);
  console.log("====================================");
});
