"""SQLite database helpers for the To-Do Task Manager."""
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "tasks.db"

def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection

def init_db():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL CHECK(length(trim(title)) > 0),
                description TEXT NOT NULL DEFAULT '',
                priority TEXT NOT NULL DEFAULT 'Medium'
                    CHECK(priority IN ('Low', 'Medium', 'High')),
                status TEXT NOT NULL DEFAULT 'Pending'
                    CHECK(status IN ('Pending', 'Completed')),
                deadline TEXT,
                created_by TEXT NOT NULL DEFAULT 'You',
                created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
            )
        """)
        connection.commit()

def row_to_dict(row):
    return dict(row) if row is not None else None
