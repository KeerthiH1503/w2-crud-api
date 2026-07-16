# Task API

A small in-memory CRUD API for managing a to-do list. Built with **Node.js + Express**,
documented with **Swagger UI**, for the W2 · A1 assignment.

## What this is

A backend that supports the four CRUD operations on a list of tasks:
Create (`POST`), Read (`GET`), Update (`PUT`), and Delete (`DELETE`). Data lives only
in memory — it resets every time the server restarts (that's intentional; see
"The mortality experiment" below).

## How to install & run

```bash
npm install
npm start
```

The server starts on **http://localhost:3000**. Swagger UI is at
**http://localhost:3000/docs**.

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
| GET | `/stats` | `{ total, done, open }` counts | 200 | — |
| POST | `/reset` | Restore the 3 seed tasks | 200 | — |

## Example: full CRUD cycle with curl

```bash
# Create
curl -i -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy bread"}'
```

Sample output:

```
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy bread","done":false}
```

```bash
# Read
curl -i http://localhost:3000/tasks/4

# Update
curl -i -X PUT http://localhost:3000/tasks/4 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

# Delete
curl -i -X DELETE http://localhost:3000/tasks/4

# Confirm it's gone
curl -i http://localhost:3000/tasks
```

## Swagger UI

Open `http://localhost:3000/docs` and use "Try it out" on any endpoint to run the
full create → read → update → delete cycle from the browser, no curl needed.

*(Screenshot placeholder — add your own screenshot of `/docs` here before submitting,
e.g. `![Swagger UI](swagger-screenshot.png)`)*

## Optional extras included

- **Filtering** — `GET /tasks?done=true`
- **Search** — `GET /tasks?search=milk`
- **Stats** — `GET /stats`
- **Seed & reset** — `POST /reset`
- **Pagination** — `GET /tasks?limit=2&offset=2`

## The mortality experiment

Create a task, restart the server (`Ctrl+C` then `npm start` again), then
`GET /tasks`. The task you added is gone — only the 3 seed tasks remain, because
everything lives in a plain JavaScript array that exists only while the process
is running. This is exactly why Week 3 introduces a real database: to make data
survive a restart.

## Project structure

```
todo-api/
├── index.js        # Express server — all routes and logic
├── openapi.json     # Hand-written OpenAPI spec, powers Swagger UI at /docs
├── package.json
└── README.md
```

## Git history

This repo should have one commit per stage (Stage 0 through Stage 6). Push it to
a public GitHub repo so it's runnable by anyone with `npm install && npm start`.
