const axios = require("axios");

async function getTrades(afterTradeId = null) {
  let url = `${process.env.BSE_API_URL}/getTrades`;

  if (afterTradeId) {
    url += `?after=${encodeURIComponent(afterTradeId)}`;
  }

  console.log("Requesting BSE Url: ", url);
  const response = await axios.get(url);
  return response.data.trades;
}

module.exports = { getTrades };
