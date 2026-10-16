// If you run the frontend on the same computer as Flask, keep this URL.
const API_URL = "http://127.0.0.1:5000/api/tasks";

const taskForm = document.getElementById("task-form");
const taskPanel = document.getElementById("task-panel");
const taskList = document.getElementById("task-list");
const message = document.getElementById("message");

let tasks = [];
let currentPage = 1;
let rowsPerPage = 10;
let activeFilter = "all";

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);
}
function formatDate(date) {
  if (!date) return "—";
  const parts = String(date).slice(0,10).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : escapeHTML(date);
}
function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
async function loadTasks() {
  taskList.innerHTML = '<tr><td colspan="7" class="empty">Loading tasks...</td></tr>';
  try {
    const data = await apiRequest(API_URL);
    tasks = Array.isArray(data) ? data : data.tasks;
    if (!Array.isArray(tasks)) throw new Error("API response is not a task list. Check /api/tasks.");
    renderTasks();
    showMessage(`Loaded ${tasks.length} task(s).`);
  } catch (error) {
    taskList.innerHTML = `<tr><td colspan="7" class="empty">Could not load tasks. ${escapeHTML(error.message)}</td></tr>`;
    showMessage(`Backend connection failed: ${error.message}. Check that Flask is running on port 5000.`, true);
  }
}
function renderTasks() {
  const searchText = document.getElementById("search").value.trim().toLowerCase();
  const selectedStatus = document.getElementById("status-filter").value;
  const selectedDate = document.getElementById("date-filter").value;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = `${task.title || ""} ${task.description || ""}`.toLowerCase().includes(searchText);
    const matchesStatus = selectedStatus === "all" || task.status === selectedStatus;
    const matchesDate = !selectedDate || task.deadline === selectedDate;
    const matchesTab = activeFilter === "all" || task.status === activeFilter;
    return matchesSearch && matchesStatus && matchesDate && matchesTab;
  });

  const total = filteredTasks.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * rowsPerPage;
  const pageTasks = filteredTasks.slice(start, start + rowsPerPage);

  if (!pageTasks.length) {
    taskList.innerHTML = `<tr><td colspan="7" class="empty">${total ? "No tasks on this page." : "No tasks found. Create a new task!"}</td></tr>`;
  } else {
    taskList.innerHTML = pageTasks.map(task => {
      const overdue = task.deadline && task.deadline < localToday() && task.status !== "Completed";
      const statusClass = ["Pending","Completed"].includes(task.status) ? task.status : "Pending";
      const priorityClass = ["Low","Medium","High"].includes(task.priority) ? task.priority : "Medium";
      return `<tr>
        <td><strong>${escapeHTML(task.title)}</strong>${task.description ? `<br><small>${escapeHTML(task.description)}</small>` : ""}${overdue ? '<span class="overdue">Overdue</span>' : ""}</td>
        <td><span class="priority ${priorityClass}">${escapeHTML(priorityClass)}</span></td>
        <td><span class="status ${statusClass}">${escapeHTML(task.status || "Pending")}</span></td>
        <td>${escapeHTML(task.created_by || "You")}</td>
        <td>${formatDate(task.created_at)}</td><td>${formatDate(task.deadline)}</td>
        <td>
          <button class="action-btn complete-btn" data-action="toggle" data-id="${Number(task.id)}" title="Toggle status" aria-label="Toggle status">✓</button>
          <button class="action-btn" data-action="edit" data-id="${Number(task.id)}" title="Edit" aria-label="Edit">✎</button>
          <button class="action-btn delete-btn" data-action="delete" data-id="${Number(task.id)}" title="Delete" aria-label="Delete">🗑</button>
        </td>
      </tr>`;
    }).join("");
  }
  document.getElementById("page-info").textContent = total === 0 ? "0 tasks" : `${start+1}-${Math.min(start+rowsPerPage,total)} of ${total}`;
  document.getElementById("prev-page").disabled = currentPage <= 1;
  document.getElementById("next-page").disabled = currentPage >= totalPages;
}
function openForm(task = null) {
  taskForm.reset();
  document.getElementById("task-id").value = task ? task.id : "";
  document.getElementById("task-title").value = task ? task.title : "";
  document.getElementById("task-description").value = task ? (task.description || "") : "";
  document.getElementById("task-priority").value = task ? (task.priority || "Medium") : "Medium";
  document.getElementById("task-deadline").value = task ? (task.deadline || "") : "";
  document.getElementById("form-heading").textContent = task ? "Edit Task" : "Create New Task";
  taskPanel.hidden = false;
  document.getElementById("task-title").focus();
}
document.getElementById("create-btn").addEventListener("click", () => openForm());
document.getElementById("cancel-btn").addEventListener("click", () => { taskPanel.hidden = true; taskForm.reset(); });

taskForm.addEventListener("submit", async event => {
  event.preventDefault();
  const id = document.getElementById("task-id").value;
  const title = document.getElementById("task-title").value.trim();
  if (!title) { showMessage("Task title cannot be empty.", true); document.getElementById("task-title").focus(); return; }
  const taskData = {
    title,
    description: document.getElementById("task-description").value.trim(),
    priority: document.getElementById("task-priority").value,
    deadline: document.getElementById("task-deadline").value || null
  };
  try {
    await apiRequest(id ? `${API_URL}/${id}` : API_URL, {
      method: id ? "PUT" : "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(taskData)
    });
    showMessage(id ? "Task updated successfully!" : "Task created successfully!");
    taskPanel.hidden = true;
    taskForm.reset();
    currentPage = 1;
    await loadTasks();
  } catch (error) { showMessage(error.message, true); }
});

taskList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const task = tasks.find(item => Number(item.id) === id);
  if (!task) return;
  const action = button.dataset.action;
  if (action === "edit") { openForm(task); return; }
  if (action === "delete" && !confirm(`Delete "${task.title}"?`)) return;
  try {
    if (action === "delete") {
      await apiRequest(`${API_URL}/${id}`, {method:"DELETE"});
      showMessage("Task deleted successfully!");
    } else if (action === "toggle") {
      const newStatus = task.status === "Completed" ? "Pending" : "Completed";
      await apiRequest(`${API_URL}/${id}/status`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status:newStatus})
      });
      showMessage(`Task marked ${newStatus}.`);
    }
    await loadTasks();
  } catch (error) { showMessage(error.message, true); }
});

document.getElementById("search").addEventListener("input", () => { currentPage = 1; renderTasks(); });
document.getElementById("filter-btn").addEventListener("click", () => { currentPage = 1; renderTasks(); showMessage("Filters applied."); });
document.getElementById("reset-filter").addEventListener("click", () => {
  document.getElementById("date-filter").value = "";
  document.getElementById("status-filter").value = "all";
  document.getElementById("search").value = "";
  activeFilter = "all";
  document.querySelectorAll(".tab").forEach(tab => { tab.classList.toggle("active", tab.dataset.tab === "all"); tab.setAttribute("aria-selected", String(tab.dataset.tab === "all")); });
  currentPage = 1; renderTasks(); showMessage("Filters reset.");
});
document.getElementById("status-filter").addEventListener("change", () => { currentPage = 1; renderTasks(); });
document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
  activeFilter = tab.dataset.tab;
  document.getElementById("status-filter").value = "all";
  document.querySelectorAll(".tab").forEach(item => { item.classList.toggle("active", item === tab); item.setAttribute("aria-selected", String(item === tab)); });
  currentPage = 1; renderTasks();
}));
document.getElementById("rows-per-page").addEventListener("change", event => { rowsPerPage = Number(event.target.value); currentPage = 1; renderTasks(); });
document.getElementById("prev-page").addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderTasks(); } });
document.getElementById("next-page").addEventListener("click", () => { currentPage++; renderTasks(); });
document.getElementById("focus-search").addEventListener("click", () => document.getElementById("search").focus());
document.getElementById("theme-btn").addEventListener("click", () => document.body.classList.toggle("dark"));

loadTasks();
