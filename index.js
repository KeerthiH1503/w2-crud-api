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
// Helper: SQLite stores done as 0/1 — turn a row back into the same
// { id, title, done: boolean } shape the API has always returned.
// ---------------------------------------------------------------------------
function toApiTask(row) {
  return { id: row.id, title: row.title, done: !!row.done };
}

// ---------------------------------------------------------------------------
// Stage 1 (W3) — Read: list and single task, now backed by SQL queries
// (+ optional extras: ?done=, ?search=, ?limit=&offset= — also done in SQL)
// ---------------------------------------------------------------------------
app.get("/tasks", (req, res) => {
  let sql = "SELECT * FROM tasks WHERE 1 = 1";
  const params = [];

  // Filtering: GET /tasks?done=true or ?done=false — SQL WHERE clause
  if (req.query.done !== undefined) {
    sql += " AND done = ?";
    params.push(req.query.done === "true" ? 1 : 0);
  }

  // Search: GET /tasks?search=milk — SQL LIKE, parameterized (never
  // glue user input directly into the query string)
  if (req.query.search) {
    sql += " AND title LIKE ?";
    params.push(`%${req.query.search}%`);
  }

  sql += " ORDER BY id";

  // Pagination: GET /tasks?limit=2&offset=2
  if (req.query.limit !== undefined || req.query.offset !== undefined) {
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : -1;
    const offset = parseInt(req.query.offset, 10) || 0;
    sql += " LIMIT ? OFFSET ?";
    params.push(limit, offset);
  }

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(toApiTask));
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!row) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(toApiTask(row));
});

// ---------------------------------------------------------------------------
// Stage 2 (W3) — Create: POST a new task, inserted into SQLite.
// Same validation as A1: missing/empty title -> 400.
// ---------------------------------------------------------------------------
app.post("/tasks", (req, res) => {
  const { title } = req.body || {};

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required and cannot be empty" });
  }

  const result = db
    .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
    .run(title.trim(), 0);

  // better-sqlite3 hands back the id SQLite just assigned.
  const newTask = { id: result.lastInsertRowid, title: title.trim(), done: false };
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
