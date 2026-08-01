# Stage 4 — exploring SQLite by hand

These are the queries from the assignment, run directly against `tasks.db`
(via DB Browser for SQLite's "Execute SQL" tab), with the actual results.

```sql
SELECT * FROM tasks;
```
Returned all 3 seed rows:
```
1 | Buy milk        | 0
2 | Read chapter 3  | 0
3 | Walk the dog    | 1
```

```sql
SELECT * FROM tasks WHERE done = 1;
```
Returned only the one completed task: `3 | Walk the dog | 1`.

```sql
SELECT COUNT(*) FROM tasks;
```
Returned `3`.

```sql
UPDATE tasks SET done = 1;
```
Marked all 3 rows as done (`changes: 3`) — confirmed by immediately calling
`GET /tasks` from the API with no restart: every task came back with
`"done": true`.

```sql
DELETE FROM tasks WHERE done = 1;
```
Since every task was now `done = 1`, this deleted all 3 rows — `GET /tasks`
right after returned `[]`. This is exactly the point of Stage 4: the API and
DB Browser are reading and writing the same file, so a change made by hand
shows up through the API instantly, with no server restart and no "syncing"
step.
