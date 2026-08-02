// index.js
// A CRUD "Task API" built with Express. All storage goes through the
// repository interface in repositories/ — routes never touch SQL or
// a specific database driver directly. That's what makes swapping
// SQLite for Postgres (A3) a one-file change instead of a rewrite.

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./openapi.json");
const repo = require("./repositories");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---------------------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks", "/tasks/:id", "/stats", "/reset", "/health", "/docs"],
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ---------------------------------------------------------------------------
// Read: list and single task
// (+ optional extras: ?done=, ?search=, ?limit=&offset= query params)
// ---------------------------------------------------------------------------
app.get("/tasks", async (req, res, next) => {
  try {
    const options = {};
    if (req.query.done !== undefined) options.done = req.query.done === "true";
    if (req.query.search) options.search = req.query.search;
    if (req.query.limit !== undefined) options.limit = parseInt(req.query.limit, 10);
    if (req.query.offset !== undefined) options.offset = parseInt(req.query.offset, 10) || 0;

    const tasks = await repo.list(options);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

app.get("/tasks/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const task = await repo.getById(id);

    if (!task) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Create: POST a new task
// ---------------------------------------------------------------------------
app.post("/tasks", async (req, res, next) => {
  try {
    const { title } = req.body || {};

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "title is required and cannot be empty" });
    }

    const newTask = await repo.create({ title: title.trim() });
    res.status(201).json(newTask);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Update & Delete
// ---------------------------------------------------------------------------
app.put("/tasks/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const existing = await repo.getById(id);

    if (!existing) {
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

    const updated = await repo.update(id, {
      title: title !== undefined ? title.trim() : undefined,
      done,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

app.delete("/tasks/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const deleted = await repo.remove(id);

    if (!deleted) {
      return res.status(404).json({ error: `Task ${id} not found` });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Optional extras
// ---------------------------------------------------------------------------
app.get("/stats", async (req, res, next) => {
  try {
    res.json(await repo.stats());
  } catch (err) {
    next(err);
  }
});

app.post("/reset", async (req, res, next) => {
  try {
    const tasks = await repo.reset();
    res.json({ message: "Tasks reset to the 3 seed examples", tasks });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Swagger UI
// ---------------------------------------------------------------------------
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// ---------------------------------------------------------------------------
// Basic error handler so a repository failure returns JSON, not an HTML
// stack trace.
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------------------------------------------------------------------------
repo
  .init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Task API listening on http://localhost:${PORT}`);
      console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize the database:", err);
    process.exit(1);
  });
