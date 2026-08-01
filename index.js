// index.js
// A small in-memory CRUD "Task API" built with Express.
// Stages 0-6 of the W2 · A1 assignment, plus a few optional extras
// (filtering, search, /stats, /reset).

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./openapi.json");

// W3 · A1 — Connecting to the database.
// Requiring db.js opens (and if needed creates) tasks.db, creates the
// tasks table if it's missing, and seeds 3 example tasks only the
// first time the table is empty.
const db = require("./db");

const app = express();
const PORT = 3000;

// Express needs this middleware to parse JSON request bodies
// (req.body would otherwise be undefined).
app.use(express.json());

// ---------------------------------------------------------------------------
// "Database" — just an array living in memory. It resets every time the
// server restarts. That's on purpose: Week 3 is where a real database shows
// up to fix this.
// ---------------------------------------------------------------------------
const SEED_TASKS = [
  { id: 1, title: "Buy milk", done: false },
  { id: 2, title: "Read chapter 3", done: false },
  { id: 3, title: "Walk the dog", done: true },
];

let tasks = SEED_TASKS.map((t) => ({ ...t }));
let nextId = tasks.length + 1;

// ---------------------------------------------------------------------------
// Stage 1 — root and health endpoints
// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: [
      "/tasks",
      "/tasks/:id",
      "/stats",
      "/reset",
      "/health",
      "/docs",
    ],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// Stage 2 — Read: list and single task
// (+ optional extras: ?done=, ?search=, ?limit=&offset= query params)
// ---------------------------------------------------------------------------
app.get("/tasks", (req, res) => {
  let result = tasks;

  // Filtering: GET /tasks?done=true or ?done=false
  if (req.query.done !== undefined) {
    const wantDone = req.query.done === "true";
    result = result.filter((t) => t.done === wantDone);
  }

  // Search: GET /tasks?search=milk (case-insensitive, matches the title)
  if (req.query.search) {
    const term = req.query.search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(term));
  }

  // Pagination: GET /tasks?limit=2&offset=2
  if (req.query.limit !== undefined || req.query.offset !== undefined) {
    const offset = parseInt(req.query.offset, 10) || 0;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : result.length;
    result = result.slice(offset, offset + limit);
  }

  res.json(result);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

// ---------------------------------------------------------------------------
// Stage 3 — Create: POST a new task
// ---------------------------------------------------------------------------
app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and cannot be empty" });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    done: false,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// ---------------------------------------------------------------------------
// Stage 4 — Update & Delete
// ---------------------------------------------------------------------------
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  const { title, done } = req.body || {};

  // At least one valid field must be present, and if provided, title
  // cannot be blank and done must be a real boolean.
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

// ---------------------------------------------------------------------------
// Optional extras
// ---------------------------------------------------------------------------
app.get("/stats", (req, res) => {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  res.json({ total, done, open: total - done });
});

app.post("/reset", (req, res) => {
  tasks = SEED_TASKS.map((t) => ({ ...t }));
  nextId = tasks.length + 1;
  res.json({ message: "Tasks reset to the 3 seed examples", tasks });
});

// ---------------------------------------------------------------------------
// Stage 5 — Swagger UI, served from the hand-written openapi.json
// ---------------------------------------------------------------------------
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Task API listening on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
});
