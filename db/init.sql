-- db/init.sql
-- Postgres runs every .sql file in /docker-entrypoint-initdb.d automatically,
-- but ONLY the very first time the container's data volume is created —
-- exactly the "seed once" behaviour this project has used since A2.

CREATE TABLE IF NOT EXISTS tasks (
    id    SERIAL PRIMARY KEY,
    title TEXT    NOT NULL,
    done  BOOLEAN NOT NULL DEFAULT FALSE
);

INSERT INTO tasks (title, done)
SELECT * FROM (VALUES
    ('Buy milk', FALSE),
    ('Read chapter 3', FALSE),
    ('Walk the dog', TRUE)
) AS seed(title, done)
WHERE NOT EXISTS (SELECT 1 FROM tasks);
