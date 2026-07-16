// index.js — Stage 2: Read endpoints (list + single task, with 404)
const express = require("express");
const app = express();
const PORT = 3000;

let tasks = [
  { id: 1, title: "Buy milk", done: false },
  { id: 2, title: "Read chapter 3", done: false },
  { id: 3, title: "Walk the dog", done: true },
];

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks", "/tasks/:id"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

app.listen(PORT, () => {
  console.log(`Task API listening on http://localhost:${PORT}`);
});
