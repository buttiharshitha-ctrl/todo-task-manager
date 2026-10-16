"""Flask REST API for the To-Do Task Manager."""
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_connection, init_db, row_to_dict

app = Flask(__name__)
CORS(app)
init_db()

def error(message, status=400):
    return jsonify({"error": message}), status

def get_task(task_id):
    with get_connection() as connection:
        row = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return row_to_dict(row)

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "To-Do Task Manager API is running",
        "tasks_endpoint": "/api/tasks"
    })

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "database": "SQLite"})

@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    with get_connection() as connection:
        rows = connection.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
    return jsonify([row_to_dict(row) for row in rows])

@app.route("/api/tasks", methods=["POST"])
def create_task():
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return error("Task title cannot be empty.")
    description = str(data.get("description", "")).strip()
    priority = data.get("priority", "Medium")
    deadline = data.get("deadline") or None
    if priority not in ("Low", "Medium", "High"):
        return error("Priority must be Low, Medium, or High.")
    with get_connection() as connection:
        cursor = connection.execute(
            """INSERT INTO tasks (title, description, priority, deadline)
               VALUES (?, ?, ?, ?)""",
            (title, description, priority, deadline)
        )
        task_id = cursor.lastrowid
        connection.commit()
    return jsonify({"message": "Task created", "task": get_task(task_id)}), 201

@app.route("/api/tasks/<int:task_id>", methods=["GET"])
def task_detail(task_id):
    task = get_task(task_id)
    if not task:
        return error("Task not found.", 404)
    return jsonify(task)

@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    if not get_task(task_id):
        return error("Task not found.", 404)
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    if not title:
        return error("Task title cannot be empty.")
    description = str(data.get("description", "")).strip()
    priority = data.get("priority", "Medium")
    deadline = data.get("deadline") or None
    if priority not in ("Low", "Medium", "High"):
        return error("Priority must be Low, Medium, or High.")
    with get_connection() as connection:
        connection.execute(
            """UPDATE tasks SET title=?, description=?, priority=?, deadline=?
               WHERE id=?""",
            (title, description, priority, deadline, task_id)
        )
        connection.commit()
    return jsonify({"message": "Task updated", "task": get_task(task_id)})

@app.route("/api/tasks/<int:task_id>/status", methods=["PATCH"])
def update_status(task_id):
    if not get_task(task_id):
        return error("Task not found.", 404)
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ("Pending", "Completed"):
        return error("Status must be Pending or Completed.")
    with get_connection() as connection:
        connection.execute("UPDATE tasks SET status=? WHERE id=?", (status, task_id))
        connection.commit()
    return jsonify({"message": "Status updated", "task": get_task(task_id)})

@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    if not get_task(task_id):
        return error("Task not found.", 404)
    with get_connection() as connection:
        connection.execute("DELETE FROM tasks WHERE id=?", (task_id,))
        connection.commit()
    return jsonify({"message": "Task deleted", "id": task_id})

@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "API route not found."}), 404

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
