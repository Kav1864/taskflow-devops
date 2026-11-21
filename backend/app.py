# testing docker layer catching 
import os
import mysql.connector

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "Backend is running"})


@app.route("/tasks", methods=["GET"])
def get_tasks():

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute("SELECT * FROM tasks ORDER BY id")
    tasks = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify(tasks)


@app.route("/tasks", methods=["POST"])
def add_task():

    data = request.get_json() or {}

    title = data.get("title", "").strip()
    priority = data.get("priority", "Low")

    if not title:
        return jsonify({"error": "Task title required"}), 400

    if priority not in ["Low", "Medium", "High"]:
        return jsonify({"error": "Invalid priority"}), 400

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        "INSERT INTO tasks (title, priority) VALUES (%s, %s)",
        (title, priority)
    )

    db.commit()

    task_id = cursor.lastrowid

    cursor.close()
    db.close()

    return jsonify({
        "id": task_id,
        "title": title,
        "priority": priority,
        "status": "Pending"
    }), 201


@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):

    data = request.get_json() or {}

    status = data.get("status")
    priority = data.get("priority")

    if status is None and priority is None:
        return jsonify({"error": "Nothing to update"}), 400

    if status is not None and status not in [
        "Pending", "In Progress", "Completed"
    ]:
        return jsonify({"error": "Invalid status"}), 400

    if priority is not None and priority not in [
        "Low", "Medium", "High"
    ]:
        return jsonify({"error": "Invalid priority"}), 400

    db = get_db_connection()
    cursor = db.cursor()

    updates = []
    values = []

    if status is not None:
        updates.append("status = %s")
        values.append(status)

    if priority is not None:
        updates.append("priority = %s")
        values.append(priority)

    values.append(task_id)

    cursor.execute(
        f"UPDATE tasks SET {', '.join(updates)} WHERE id = %s",
        tuple(values)
    )

    db.commit()

    updated = cursor.rowcount

    cursor.close()
    db.close()

    if updated == 0:
        return jsonify({"error": "Task not found or unchanged"}), 404

    return jsonify({"message": "Task updated successfully"})


@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        "DELETE FROM tasks WHERE id = %s",
        (task_id,)
    )

    db.commit()

    deleted = cursor.rowcount

    cursor.close()
    db.close()

    if deleted == 0:
        return jsonify({"error": "Task not found"}), 404

    return jsonify({"message": "Task deleted successfully"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

