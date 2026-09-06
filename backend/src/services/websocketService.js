function emitPullStarted(io, jobId) {
  io.emit("PULL_STARTED", {
    jobId,
    status: "PENDING",
  });
}

function emitPullRunning(io, jobId) {
  io.emit("PULL_RUNNING", {
    jobId,
    status: "RUNNING",
  });
}

function emitPullCompleted(io, jobId, tradesReceived, newTrades, duplicates) {
  io.emit("PULL_COMPLETED", {
    jobId,
    status: "COMPLETED",
    tradesReceived,
    newTrades,
    duplicates,
  });
}

function emitPullFailed(io, jobId, error) {
  io.emit("PULL_FAILED", {
    jobId,
    status: "FAILED",
    error,
  });
}

module.exports = {
  emitPullStarted,
  emitPullRunning,
  emitPullCompleted,
  emitPullFailed,
};
