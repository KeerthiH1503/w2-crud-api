# Task API

A small CRUD API for managing a to-do list. Built with **Node.js + Express**,
persisted in **SQLite**, documented with **Swagger UI**.

- W2 · A1 — built the CRUD API (in-memory)
- W3 · A1 — swapped the storage layer to SQLite (this update) — same
  endpoints, same request/response shapes, but data now survives a restart

## What this is

A backend that supports the four CRUD operations on a list of tasks:
Create (`POST`), Read (`GET`), Update (`PUT`), and Delete (`DELETE`). Tasks
are stored in a SQLite database file (`tasks.db`), not in memory — so
restarting the server no longer wipes your data.

## Why SQLite

- **Zero setup** — no separate database server to install or run; the whole
  database is one file, `tasks.db`.
- **Automatic creation** — the first time the app runs, it opens (and
  therefore creates) `tasks.db`, creates the `tasks` table if it's missing,
  and seeds 3 example tasks only if the table is empty.
- **Good fit for this stage of the project** — simple, file-based, easy to
  inspect by hand in a viewer like DB Browser for SQLite. Moving to
  Postgres/MySQL later is mostly a matter of swapping the storage layer
  again, since the API itself doesn't change.

## Where the database file lives

`tasks.db` is created at the project root the first time you run the app.
It's **git-ignored** — every fresh clone starts with a clean, auto-created
database rather than shipping a binary data file in the repo.

## How to install & run

```bash
npm install
npm start
```

The server starts on **http://localhost:3000**. Swagger UI is at
**http://localhost:3000/docs**. On first run, `tasks.db` is created
automatically with 3 seeded tasks.

## Endpoints

| Method | Path | Description | Success | Errors |
|---|---|---|---|---|
| GET | `/` | API info | 200 | — |
| GET | `/health` | Health check | 200 | — |
| GET | `/tasks` | List all tasks (supports `?done=`, `?search=`, `?limit=&offset=`) | 200 | — |
| GET | `/tasks/:id` | Get a single task | 200 | 404 unknown id |
| POST | `/tasks` | Create a task (`{ "title": "..." }`) | 201 | 400 missing/empty title |
| PUT | `/tasks/:id` | Update title and/or done | 200 | 400 invalid body, 404 unknown id |
| DELETE | `/tasks/:id` | Delete a task | 204 | 404 unknown id |
| GET | `/stats` | `{ total, done, open }` counts (via SQL `COUNT()`) | 200 | — |
| POST | `/reset` | Restore the 3 seed tasks | 200 | — |

All CRUD operations run parameterized SQL queries (`?` placeholders) —
nothing is glued into a query string, which is what keeps user input from
being able to break or attack the database.

## Example: full CRUD cycle with curl

```bash
curl -X 'POST' 'http://localhost:3000/tasks' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"title": "Buy milk"}'
```

Sample output:

```
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":false}
```

```bash
# Read
curl -i http://localhost:3000/tasks/4

# Update
curl -i -X PUT http://localhost:3000/tasks/4 \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy oat milk","done":true}'

# Delete
curl -i -X DELETE http://localhost:3000/tasks/4

# Confirm it's gone
curl -i http://localhost:3000/tasks
```

## Swagger UI

Open `http://localhost:3000/docs` and use "Try it out" on any endpoint to run
the full create → read → update → delete cycle from the browser, no curl
needed.

![Swagger UI](swagger-screenshot.png)

## Exploring the database by hand (Stage 4)

Opened `tasks.db` in [DB Browser for SQLite](https://sqlitebrowser.org/) and
ran the queries from the assignment directly against it. Full write-up with
actual results: [`sql-notes.md`](sql-notes.md).

One example — this query:

```sql
SELECT * FROM tasks WHERE done = 1;
```

returned only the completed tasks, e.g. `3 | Walk the dog | 1` — and the
same result appeared instantly through `GET /tasks?done=true` with no
server restart, since the API and DB Browser read the exact same file.

![DB Browser](db-browser-screenshot.png)

## Persistence proof (the "un-mortality" experiment)

Create a task, restart the server (`Ctrl+C` then `npm start` again), then
`GET /tasks`. Unlike the W2 in-memory version, the task you added is **still
there** — because it now lives in `tasks.db` on disk, not in a JavaScript
array that disappears when the process exits. Restarting also does **not**
re-seed or duplicate the 3 example tasks, since they're only inserted the
first time the table is empty.

## Optional extras included

- **Filtering** — `GET /tasks?done=true` (SQL `WHERE done = ?`)
- **Search** — `GET /tasks?search=milk` (SQL `LIKE`)
- **Stats** — `GET /stats` (SQL `COUNT(*)`)
- **Seed & reset** — `POST /reset`
- **Pagination** — `GET /tasks?limit=2&offset=2` (SQL `LIMIT`/`OFFSET`)

## Project structure

```
todo-api/
├── index.js            # Express server — all routes and logic
├── db.js               # Opens/creates tasks.db, creates the table, seeds it
├── openapi.json         # Hand-written OpenAPI spec, powers Swagger UI at /docs
├── sql-notes.md         # Stage 4 write-up: manual SQL queries and their results
├── package.json
├── .gitignore            # tasks.db is git-ignored — each clone starts fresh
└── README.md
```

## Git history

This repo has one commit per stage across both assignments — W2 · A1
(Stage 0–6, in-memory CRUD) and W3 · A1 (Stage 0–5, SQLite migration).
Clone it and run `npm install && npm start` — `tasks.db` is created and
seeded automatically, no manual setup required.
