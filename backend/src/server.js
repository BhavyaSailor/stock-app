
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./config/db");

const tradeRoutes = require("./routes/tradeRoutes");
const pullRoutes = require("./routes/pullRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.get("/", (req, res) => {
  res.json({
    message: "Trade ingestion backend is running",
  });
});

app.get("/health/db-info", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT current_database(), current_schema()
    `);

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Database check failed",
    });
  }
});

app.get("/health/db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "ok",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("DB connection error", error);

    res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

app.use("/api/trades", tradeRoutes);
app.use("/api/pulls", pullRoutes);

io.on("connection", (socket) => {
  console.log(`Websocket client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Websocket client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
