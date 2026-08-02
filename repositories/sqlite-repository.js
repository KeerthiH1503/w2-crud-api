// repositories/sqlite-repository.js
// Implements the same repository interface as postgres-repository.js:
// init, list, getById, create, update, remove, stats, reset.
// This is the A2 storage layer, refactored so index.js talks to it
// through a stable interface instead of calling better-sqlite3 directly.

const path = require("path");
const Database = require("better-sqlite3");

const SEED_TASKS = [
  { title: "Buy milk", done: false },
  { title: "Read chapter 3", done: false },
  { title: "Walk the dog", done: true },
];

let db;

function init() {
  const DB_PATH = path.join(__dirname, "..", "tasks.db");
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT    NOT NULL,
      done  INTEGER NOT NULL DEFAULT 0
    )
  `);

  const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
  if (count === 0) {
    const insertSeed = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
    const seedAll = db.transaction((seedTasks) => {
      for (const t of seedTasks) insertSeed.run(t.title, t.done ? 1 : 0);
    });
    seedAll(SEED_TASKS);
  }

  return Promise.resolve();
}

function toApiTask(row) {
  return { id: row.id, title: row.title, done: !!row.done };
}

function list({ done, search, limit, offset } = {}) {
  let sql = "SELECT * FROM tasks WHERE 1 = 1";
  const params = [];

  if (done !== undefined) {
    sql += " AND done = ?";
    params.push(done ? 1 : 0);
  }
  if (search) {
    sql += " AND title LIKE ?";
    params.push(`%${search}%`);
  }
  sql += " ORDER BY id";
  if (limit !== undefined || offset !== undefined) {
    sql += " LIMIT ? OFFSET ?";
    params.push(limit !== undefined ? limit : -1, offset || 0);
  }

  const rows = db.prepare(sql).all(...params);
  return Promise.resolve(rows.map(toApiTask));
}

function getById(id) {
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  return Promise.resolve(row ? toApiTask(row) : null);
}

function create({ title }) {
  const result = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)").run(title, 0);
  return Promise.resolve({ id: result.lastInsertRowid, title, done: false });
}

function update(id, { title, done } = {}) {
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!existing) return Promise.resolve(null);

  const newTitle = title !== undefined ? title : existing.title;
  const newDone = done !== undefined ? (done ? 1 : 0) : existing.done;

  db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(newTitle, newDone, id);
  return Promise.resolve({ id, title: newTitle, done: !!newDone });
}

function remove(id) {
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return Promise.resolve(result.changes > 0);
}

function stats() {
  const { total } = db.prepare("SELECT COUNT(*) AS total FROM tasks").get();
  const { done } = db.prepare("SELECT COUNT(*) AS done FROM tasks WHERE done = 1").get();
  return Promise.resolve({ total, done, open: total - done });
}

function reset() {
  const reseed = db.transaction(() => {
    db.prepare("DELETE FROM tasks").run();
    const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
    for (const t of SEED_TASKS) insert.run(t.title, t.done ? 1 : 0);
  });
  reseed();
  const rows = db.prepare("SELECT * FROM tasks ORDER BY id").all();
  return Promise.resolve(rows.map(toApiTask));
}

module.exports = { init, list, getById, create, update, remove, stats, reset };
