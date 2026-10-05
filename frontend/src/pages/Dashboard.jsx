import { useEffect, useState } from "react";
import { getTrades, startPull } from "../services/api";
import { socket } from "../services/socket";
import TradeTable from "../components/TradeTable";

function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState("IDLE");
  const [lastPull, setLastPull] = useState(null);

  const [error, setError] = useState(null);

  // Initial loading of trades
  useEffect(() => {
    async function loadTrades() {
      try {
        const data = await getTrades();
        setTrades(data.trades);
      } catch (error) {
        console.error(error);
        setError("Failed to load trades");
      } finally {
        setLoading(false);
      }
    }

    loadTrades();
  }, []);

  // Socket.IO events
  useEffect(() => {
    function handleConnect() {
      console.log("Dashboard socket connected");
    }
    function handlePullStarted(data) {
      console.log("Pull started:", data);

      setPulling(true);
      setPullStatus("RUNNING");
    }

    function handlePullRunning(data) {
      console.log("Pull running:", data);

      setPulling(true);
      setPullStatus("RUNNING");
    }

    async function handlePullCompleted(data) {
      console.log("Pull completed:", data);

      setPulling(false);
      setPullStatus("COMPLETED");
      setLastPull(data);

      // Get newly inserted trades from PostgreSQL
      try {
        const result = await getTrades();
        setTrades(result.trades);
      } catch (error) {
        console.error("Failed to refresh trades:", error);
      }
    }

    function handlePullFailed(data) {
      console.log("Pull failed:", data);

      setPulling(false);
      setPullStatus("FAILED");
      setLastPull(data);
    }

    socket.on("connect", handleConnect);
    socket.on("PULL_STARTED", handlePullStarted);
    socket.on("PULL_RUNNING", handlePullRunning);
    socket.on("PULL_COMPLETED", handlePullCompleted);
    socket.on("PULL_FAILED", handlePullFailed);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("PULL_STARTED", handlePullStarted);
      socket.off("PULL_RUNNING", handlePullRunning);
      socket.off("PULL_COMPLETED", handlePullCompleted);
      socket.off("PULL_FAILED", handlePullFailed);
    };
  }, []);

  async function handlePull() {
    try {
      setPulling(true);
      setPullStatus("STARTING");

      await startPull();
    } catch (error) {
      console.error("Failed to start pull:", error);

      setPulling(false);
      setPullStatus("FAILED");
    }
  }

  if (loading) {
    return <p>Loading trades...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>Trade Dashboard</h1>

      <div>
        <p>
          Total Trades: <strong>{trades.length}</strong>
        </p>

        <p>
          Pull Status: <strong>{pullStatus}</strong>
        </p>

        <button onClick={handlePull} disabled={pulling}>
          {pulling ? "Pulling Trades..." : "Pull Trades"}
        </button>
      </div>

      {lastPull && (
        <div>
          <h3>Last Pull</h3>

          <p>Job ID: {lastPull.jobId}</p>

          {lastPull.tradesReceived !== undefined && (
            <p>Trades Received: {lastPull.tradesReceived}</p>
          )}

          {lastPull.newTrades !== undefined && (
            <p>New Trades: {lastPull.newTrades}</p>
          )}

          {lastPull.duplicates !== undefined && (
            <p>Duplicates: {lastPull.duplicates}</p>
          )}
        </div>
      )}

      <TradeTable trades={trades} />
    </div>
  );
}

export default Dashboard;
