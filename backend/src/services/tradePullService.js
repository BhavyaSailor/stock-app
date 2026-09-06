const tradeService = require("./tradeService");
const bseService = require("./bseService");
const websocketService = require("./websocketService");

async function pullTrades(jobId, io) {
  try {
    console.log(`Starting Trade pull. Job Id: ${jobId}`);

    await tradeService.markJobRunning(jobId);
    websocketService.emitPullRunning(io, jobId);

    const lastTradeId = await tradeService.getLastTradeId();
    console.log(`Last trade ID: ${lastTradeId || "None"}`);

    const trades = await bseService.getTrades(lastTradeId);
    console.log(`${trades.length} trades received`);

    const { newTrades, duplicates } = await tradeService.insertTrades(trades);

    console.log(`New trades inserted: ${newTrades}`);
    console.log(`Duplicate trades: ${duplicates}`);

    await tradeService.markJobCompleted(jobId, trades.length);

    console.log(`Trade pull completed, Job Id: ${jobId}`);

    console.log("...........................");

    websocketService.emitPullCompleted(
      io,
      jobId,
      trades.length,
      newTrades,
      duplicates,
    );
  } catch (error) {
    console.error(`Trade pull failed for job ID: ${jobId}`, error.message);

    await tradeService.markJobFailed(jobId, error.message);

    websocketService.emitPullFailed(io, jobId, error.message);
  }
}

module.exports = {
  pullTrades,
};
