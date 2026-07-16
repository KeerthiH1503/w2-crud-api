// index.js — Stage 0: Hello, server
const express = require("express");
const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Hello from Task API!");
});

app.listen(PORT, () => {
  console.log(`Task API listening on http://localhost:${PORT}`);
});
