const fs = require("fs");
const path = require("path");

const clients = [
  "Client_A",
  "Client_B",
  "Client_C",
  "Client_D",
  "Client_E",
  "Client_F",
  "Client_G",
  "Client_H",
];

const symbols = [
  "RELIANCE",
  "TCS",
  "INFY",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "ITC",
  "WIPRO",
  "AXISBANK",
  "LT",
];

const dataDirectory = path.join(__dirname, "../../data");

const dataFile = path.join(dataDirectory, "trades.json");

// Make sure data directory exists
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, {
    recursive: true,
  });
}

// Create file if it doesn't exist
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
}

function loadTrades() {
  const data = fs.readFileSync(dataFile, "utf-8");

  return JSON.parse(data);
}

function saveTrades(trades) {
  fs.writeFileSync(dataFile, JSON.stringify(trades, null, 2));
}

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function generatePrice() {
  return Number((100 + Math.random() * 4900).toFixed(2));
}
function generateQuantity() {
  return (Math.floor(Math.random() * 100) + 1) * 10;
}
function generateTimestamp() {
  const start = new Date();
  start.setHours(9, 15, 0, 0);

  const end = new Date();
  end.setHours(15, 30, 0, 0);

  const time =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());

  return new Date(time).toISOString();
}
function createTrade(index) {
  return {
    tradeId: `TRD${String(index).padStart(5, "0")}`,
    client: randomItem(clients),
    symbol: randomItem(symbols),
    quantity: generateQuantity(),
    price: generatePrice(),
    timestamp: generateTimestamp(),
  };
}

function generateNewTrades(count = 1000) {
  const existingTrades = loadTrades();

  const startingId = existingTrades.length + 1;

  const newTrades = [];

  for (let i = 0; i < count; i++) {
    const trade = createTrade(startingId + i);

    newTrades.push(trade);
  }

  // Save complete history
  const updatedTrades = [...existingTrades, ...newTrades];

  saveTrades(updatedTrades);

  return newTrades;
}

function getTradesAfter(tradeId) {
  const trades = loadTrades();

  if (!tradeId) {
    return trades;
  }

  const index = trades.findIndex((trade) => trade.tradeId === tradeId);

  if (index === -1) {
    return [];
  }

  return trades.slice(index + 1);
}

module.exports = {
  generateNewTrades,
  getTradesAfter,
};
