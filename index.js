// index.js — Stage 4: full CRUD (Create, Read, Update, Delete)
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

let tasks = [
  { id: 1, title: "Buy milk", done: false },
  { id: 2, title: "Read chapter 3", done: false },
  { id: 3, title: "Walk the dog", done: true },
];
let nextId = tasks.length + 1;

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

app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and cannot be empty" });
  }

  const newTask = { id: nextId++, title: title.trim(), done: false };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body || {};
  const noFieldsProvided = title === undefined && done === undefined;
  const titleInvalid = title !== undefined && (typeof title !== "string" || title.trim() === "");
  const doneInvalid = done !== undefined && typeof done !== "boolean";

  if (noFieldsProvided || titleInvalid || doneInvalid) {
    return res.status(400).json({
      error: "Provide at least a valid non-empty 'title' (string) and/or 'done' (boolean)",
    });
  }

  if (title !== undefined) task.title = title.trim();
  if (done !== undefined) task.done = done;

  res.json(task);
});

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Task API listening on http://localhost:${PORT}`);
});
