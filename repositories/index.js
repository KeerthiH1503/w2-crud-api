// repositories/index.js
// Picks which storage implementation backs the API. Both implement the
// exact same interface (init, list, getById, create, update, remove,
// stats, reset), so this is the ONLY place that knows which database
// is actually in use.
//
// DB_DRIVER=postgres (default when DATABASE_URL is set) -> Postgres,
// containerized via Docker (A3).
// DB_DRIVER=sqlite -> falls back to the A2 SQLite file, useful for
// running the API with zero setup if Docker isn't available.

const driver = process.env.DB_DRIVER || (process.env.DATABASE_URL ? "postgres" : "sqlite");

const repo = driver === "postgres" ? require("./postgres-repository") : require("./sqlite-repository");

console.log(`Using ${driver} repository`);

module.exports = repo;
