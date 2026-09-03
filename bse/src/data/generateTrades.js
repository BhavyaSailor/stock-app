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
const tradeStore = [];

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
function addNewTrades(count = 1000) {
  const startingId = tradeStore.length + 1;

  for (let i = 0; i < count; i++) {
    const trade = createTrade(startingId + i);

    tradeStore.push(trade);
  }

  return tradeStore;
}

function getTrades() {
  return tradeStore;
}

module.exports = {
  addNewTrades,
  getTrades
};
