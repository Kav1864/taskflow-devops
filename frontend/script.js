
const API_URL = "/api/tasks";

async function loadTasks() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch tasks");
        }

        const tasks = await response.json();

        renderTasks(tasks);
    } catch (error) {
        console.error(error);
        document.getElementById("taskList").innerText =
            "Unable to load tasks. Please try again.";
    }
}

function openTaskForm() {
    document.getElementById("taskForm").classList.toggle("hidden");
}

async function addTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const priority = document.getElementById("taskPriority").value;

    if (!title) {
        alert("Please enter a task title");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, priority })
        });

        if (!response.ok) {
            throw new Error("Unable to add task");
        }

        document.getElementById("taskTitle").value = "";
        document.getElementById("taskForm").classList.add("hidden");

        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
}

async function updateStatus(id, currentStatus) {
    const nextStatus = {
        "Pending": "In Progress",
        "In Progress": "Completed",
        "Completed": "Pending"
    };

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: nextStatus[currentStatus]
            })
        });

        if (!response.ok) {
            throw new Error("Unable to update task");
        }

        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
}

async function deleteTask(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Unable to delete task");
        }

        await loadTasks();

    } catch (error) {
        alert(error.message);
    }
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function renderTasks(tasks) {
    const taskList = document.getElementById("taskList");

    taskList.innerHTML = "";

    tasks.forEach(task => {
        taskList.innerHTML += `
            <div class="task-item">
                <div>
                    <strong>${escapeHTML(task.title)}</strong>
                    <small>
                        Priority: ${escapeHTML(task.priority)} |
                        Status: ${escapeHTML(task.status)}
                    </small>
                </div>

                <div class="task-actions">
                    <button onclick="updateStatus(${task.id}, '${task.status}')">
                        Update
                    </button>

                    <button class="delete"
                        onclick="deleteTask(${task.id})">
                        Delete
                    </button>
                </div>
            </div>
        `;
    });

    document.getElementById("totalTasks").innerText = tasks.length;

    document.getElementById("pendingTasks").innerText =
        tasks.filter(t => t.status === "Pending").length;

    document.getElementById("progressTasks").innerText =
        tasks.filter(t => t.status === "In Progress").length;

    document.getElementById("completedTasks").innerText =
        tasks.filter(t => t.status === "Completed").length;
}

loadTasks();

