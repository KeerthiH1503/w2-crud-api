// db.js
// Sets up the SQLite database. Opening a file that doesn't exist yet
// creates it — that's how tasks.db comes into being the first time
// the app runs.

const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = path.join(__dirname, "tasks.db");
const db = new Database(DB_PATH);

// A small durability/performance tradeoff that's a common default for
// SQLite apps — not required by the assignment, just a nice habit.
db.pragma("journal_mode = WAL");

// Create the table if it doesn't already exist. done is stored as an
// integer (0/1) because SQLite has no native boolean type.
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT    NOT NULL,
    done  INTEGER NOT NULL DEFAULT 0
  )
`);

// Seed 3 example tasks — but only the very first time the table is
// empty. Restarting the server never duplicates them, because we
// check the row count before inserting anything.
const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();

if (count === 0) {
  const insertSeed = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");

  // Wrapped in a transaction so the 3 seed rows are all-or-nothing —
  // if anything failed halfway through, we wouldn't end up with a
  // partially-seeded table.
  const seedAll = db.transaction((seedTasks) => {
    for (const t of seedTasks) insertSeed.run(t.title, t.done ? 1 : 0);
  });

  seedAll([
    { title: "Buy milk", done: false },
    { title: "Read chapter 3", done: false },
    { title: "Walk the dog", done: true },
  ]);
}

module.exports = db;
