import { useEffect, useState } from "react";

import { getTrades, startPull } from "../services/api";
import { socket } from "../services/socket";

import TradeTable from "../components/TradeTable";

import StatCard from "../components/StatCard";
import ConnectionStatus from "../components/ConnectionStatus";
import PullButton from "../components/PullButton";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Activity,
  Database,
  Download,
  BriefcaseBusiness,
} from "lucide-react";

function Dashboard() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pulling, setPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState("IDLE");
  const [lastPull, setLastPull] = useState(null);
  const [connected, setConnected] = useState(socket.connected);
  const [error, setError] = useState(null);
<div className="flex min-h-screen items-center justify-center bg-slate-950">
  <h1 className="text-5xl font-bold text-white">
    Tailwind Works!
  </h1>
</div>
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
      setConnected(true);
    }

    function handleDisconnect() {
      console.log("Dashboard socket disconnected");
      setConnected(false);
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
    socket.on("disconnect", handleDisconnect);
    socket.on("PULL_STARTED", handlePullStarted);
    socket.on("PULL_RUNNING", handlePullRunning);
    socket.on("PULL_COMPLETED", handlePullCompleted);
    socket.on("PULL_FAILED", handlePullFailed);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
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
  <div className="min-h-screen bg-muted/40">
    <div className="container mx-auto max-w-7xl px-6 py-8">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Trade Dashboard
          </h1>

          <p className="text-muted-foreground mt-1">
            BSE trade ingestion and monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ConnectionStatus connected={connected} />

          <PullButton
            pulling={pulling}
            onClick={handlePull}
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 mt-8 md:grid-cols-2 lg:grid-cols-4">

        <StatCard
          title="Total Trades"
          value={trades.length}
          description="Trades stored in database"
          icon={Database}
        />

        <StatCard
          title="New Trades"
          value={lastPull?.newTrades ?? 0}
          description="Added during last pull"
          icon={Download}
        />

        <StatCard
          title="Pull Status"
          value={pullStatus}
          description="Current ingestion status"
          icon={Activity}
        />

        <StatCard
          title="Last Job"
          value={lastPull?.jobId ? `#${lastPull.jobId}` : "—"}
          description="Most recent pull job"
          icon={BriefcaseBusiness}
        />

      </div>

      {/* Last Pull */}
      {lastPull && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Last Pull Details</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">

              <div>
                <p className="text-sm text-muted-foreground">
                  Trades Received
                </p>

                <p className="text-2xl font-bold mt-1">
                  {lastPull.tradesReceived ?? 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  New Trades
                </p>

                <p className="text-2xl font-bold mt-1">
                  {lastPull.newTrades ?? 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Duplicates
                </p>

                <p className="text-2xl font-bold mt-1">
                  {lastPull.duplicates ?? 0}
                </p>
              </div>

            </div>
          </CardContent>
        </Card>
      )}

      {/* Trades */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>

        <CardContent>
          <TradeTable trades={trades} />
        </CardContent>
      </Card>

    </div>
  </div>
);
}

export default Dashboard;
