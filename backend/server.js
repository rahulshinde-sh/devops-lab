const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "DevOps Lab API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "backend",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/server", (req, res) => {
  res.json({
    environment: "local",
    status: "online",
    cpu: "0%",
    memory: "0 GB",
    containers: 0
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});
