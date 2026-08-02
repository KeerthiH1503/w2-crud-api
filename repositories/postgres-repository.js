// repositories/postgres-repository.js
// Implements the same interface as sqlite-repository.js:
// init, list, getById, create, update, remove, stats, reset.
// Talks to Postgres (running in Docker, see docker-compose.yml) via
// the `pg` driver, using the connection string from DATABASE_URL.

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const SEED_TASKS = [
  { title: "Buy milk", done: false },
  { title: "Read chapter 3", done: false },
  { title: "Walk the dog", done: true },
];

async function init() {
  // Create the table if it doesn't exist yet. (The same schema also
  // lives in db/init.sql, which Postgres runs automatically the very
  // first time the container's data volume is created — this CREATE
  // TABLE IF NOT EXISTS here is a safety net for any environment that
  // didn't run that init script, e.g. an existing external database.)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id    SERIAL PRIMARY KEY,
      title TEXT    NOT NULL,
      done  BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM tasks");
  if (rows[0].count === 0) {
    // Wrapped in a transaction so the 3 seed rows are all-or-nothing.
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const t of SEED_TASKS) {
        await client.query("INSERT INTO tasks (title, done) VALUES ($1, $2)", [t.title, t.done]);
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}

function toApiTask(row) {
  return { id: row.id, title: row.title, done: row.done };
}

async function list({ done, search, limit, offset } = {}) {
  let sql = "SELECT * FROM tasks WHERE 1 = 1";
  const params = [];

  if (done !== undefined) {
    params.push(done);
    sql += ` AND done = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    sql += ` AND title ILIKE $${params.length}`;
  }
  sql += " ORDER BY id";
  if (limit !== undefined) {
    params.push(limit);
    sql += ` LIMIT $${params.length}`;
  }
  if (offset !== undefined) {
    params.push(offset);
    sql += ` OFFSET $${params.length}`;
  }

  const { rows } = await pool.query(sql, params);
  return rows.map(toApiTask);
}

async function getById(id) {
  const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  return rows[0] ? toApiTask(rows[0]) : null;
}

async function create({ title }) {
  const { rows } = await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, false) RETURNING *",
    [title]
  );
  return toApiTask(rows[0]);
}

async function update(id, { title, done } = {}) {
  const existing = await getById(id);
  if (!existing) return null;

  const newTitle = title !== undefined ? title : existing.title;
  const newDone = done !== undefined ? done : existing.done;

  const { rows } = await pool.query(
    "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
    [newTitle, newDone, id]
  );
  return toApiTask(rows[0]);
}

async function remove(id) {
  const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  return rowCount > 0;
}

async function stats() {
  const { rows } = await pool.query(
    "SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE done)::int AS done FROM tasks"
  );
  const { total, done } = rows[0];
  return { total, done, open: total - done };
}

async function reset() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM tasks");
    for (const t of SEED_TASKS) {
      await client.query("INSERT INTO tasks (title, done) VALUES ($1, $2)", [t.title, t.done]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id");
  return rows.map(toApiTask);
}

module.exports = { init, list, getById, create, update, remove, stats, reset };
