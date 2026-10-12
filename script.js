
const taskForm = document.getElementById("taskForm");
const titleInput = document.getElementById("title");
const descriptionInput = document.getElementById("description");
const dueDateInput = document.getElementById("dueDate");
const priorityInput = document.getElementById("priority");

const taskList = document.getElementById("taskList");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");
const sortFilter = document.getElementById("sortFilter");
const searchInput = document.getElementById("searchInput");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formHeading = document.getElementById("formHeading");

let tasks = [];

try {
    const savedTasks = JSON.parse(
        localStorage.getItem("studentTasks")
    );

    if (Array.isArray(savedTasks)) {
        tasks = savedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string" &&
            typeof task.description === "string" &&
            ["High", "Medium", "Low"].includes(task.priority) &&
            /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) &&
            typeof task.completed === "boolean"
        );
    }
} catch {
    tasks = [];
}

let editingId = null;
let toastTimer;

const today = getLocalDate();

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });

dueDateInput.min = today;

function getLocalDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function saveTasks() {
    try {
        localStorage.setItem("studentTasks", JSON.stringify(tasks));
        return true;
    } catch {
        showToast("Unable to save tasks in this browser.");
        return false;
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function updateStats() {
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;

    const overdue = tasks.filter(task =>
        !task.completed && task.dueDate < getLocalDate()
    ).length;

    const percentage = tasks.length === 0
        ? 0
        : Math.round((completed / tasks.length) * 100);

    document.getElementById("totalTasks").textContent = tasks.length;
    document.getElementById("pendingTasks").textContent = pending;
    document.getElementById("completedTasks").textContent = completed;
    document.getElementById("overdueTasks").textContent = overdue;

    document.getElementById("progressPercent").textContent =
        percentage + "%";

    document.getElementById("progressBar").style.width =
        percentage + "%";

    const progressText = document.getElementById("progressText");

    if (tasks.length === 0) {
        progressText.textContent =
            "Add a task to start your progress!";
    } else if (percentage === 100) {
        progressText.textContent =
            "Amazing! All tasks completed! 🎉";
    } else {
        progressText.textContent =
            `${completed} of ${tasks.length} tasks completed. Keep going!`;
    }

    document.getElementById("footerCount").textContent =
        `${pending} task${pending !== 1 ? "s" : ""} remaining`;
}

taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const dueDate = dueDateInput.value;
    const priority = priorityInput.value;

    if (!title || !dueDate) {
        showToast("Please fill all required fields.");
        return;
    }

    if (!["High", "Medium", "Low"].includes(priority)) {
        showToast("Please select a valid priority.");
        return;
    }

    if (editingId === null && dueDate < getLocalDate()) {
        showToast("Please select today or a future date.");
        return;
    }

    const previousTasks = JSON.stringify(tasks);

    if (editingId !== null) {
        const task = tasks.find(item => item.id === editingId);

        if (!task) {
            resetForm();
            showToast("Task not found.");
            return;
        }

        task.title = title;
        task.description = description;
        task.dueDate = dueDate;
        task.priority = priority;
    } else {
        tasks.push({
            id: crypto.randomUUID(),
            title,
            description,
            dueDate,
            priority,
            completed: false
        });
    }

    if (!saveTasks()) {
        tasks = JSON.parse(previousTasks);
        renderTasks();
        return;
    }

    const wasEditing = editingId !== null;

    resetForm();
    renderTasks();

    showToast(
        wasEditing
            ? "Task updated successfully! ✨"
            : "Task added successfully! 🎯"
    );
});

function resetForm() {
    taskForm.reset();

    priorityInput.value = "Medium";
    dueDateInput.min = getLocalDate();
    editingId = null;

    formHeading.textContent = "➕ Add New Task";
    submitBtn.textContent = "➕ Add Task";
    cancelBtn.classList.add("hidden");

    document.getElementById("charCount").textContent = "0";
}

cancelBtn.addEventListener("click", function () {
    resetForm();
    showToast("Editing cancelled.");
});

descriptionInput.addEventListener("input", function () {
    document.getElementById("charCount").textContent =
        descriptionInput.value.length;
});

function createElement(tag, className, text = "") {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    element.textContent = text;
    return element;
}

function renderTasks() {
    taskList.replaceChildren();

    const status = statusFilter.value;
    const priority = priorityFilter.value;
    const search = searchInput.value.trim().toLowerCase();

    const filteredTasks = tasks
        .filter(task => {
            if (status === "Pending" && task.completed) return false;
            if (status === "Completed" && !task.completed) return false;

            if (priority !== "All" && task.priority !== priority) {
                return false;
            }

            const searchableText =
                `${task.title} ${task.description}`.toLowerCase();

            return searchableText.includes(search);
        })
        .sort((a, b) => {
            if (sortFilter.value === "priority") {
                const order = { High: 0, Medium: 1, Low: 2 };
                return order[a.priority] - order[b.priority];
            }

            if (sortFilter.value === "title") {
                return a.title.localeCompare(b.title);
            }

            return a.dueDate.localeCompare(b.dueDate);
        });

    document.getElementById("visibleCount").textContent =
        `${filteredTasks.length} task${filteredTasks.length !== 1 ? "s" : ""}`;

    if (filteredTasks.length === 0) {
        taskList.appendChild(
            createElement(
                "div",
                "empty-state",
                tasks.length === 0
                    ? "📚 No tasks yet. Add your first task!"
                    : "🔎 No tasks match your search or filters."
            )
        );

        updateStats();
        return;
    }

    filteredTasks.forEach(task => {
        const card = createElement(
            "article",
            `task-card priority-${task.priority}${task.completed ? " completed" : ""}`
        );

        const top = createElement("div", "task-top");

        const checkbox = createElement("input", "task-checkbox");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute(
            "aria-label",
            `Mark ${task.title} as ${task.completed ? "pending" : "completed"}`
        );

        checkbox.addEventListener("change", () => {
            toggleComplete(task.id);
        });

        const content = createElement("div", "task-content");

        content.appendChild(
            createElement("h3", "task-title", task.title)
        );

        if (task.description) {
            content.appendChild(
                createElement("p", "task-description", task.description)
            );
        }

        const meta = createElement("div", "task-meta");

        meta.appendChild(
            createElement(
                "span",
                `badge priority-badge ${task.priority}`,
                `${task.priority} Priority`
            )
        );

        meta.appendChild(
            createElement(
                "span",
                `badge status-badge${task.completed ? " done" : ""}`,
                task.completed ? "Completed ✓" : "Pending"
            )
        );

        const dueDate = createElement(
            "span",
            "due-date",
            `📅 Due: ${task.dueDate}`
        );

        if (!task.completed && task.dueDate < getLocalDate()) {
            dueDate.classList.add("overdue");
            dueDate.textContent += " — Overdue!";
        } else if (!task.completed && task.dueDate === getLocalDate()) {
            dueDate.classList.add("overdue");
            dueDate.textContent += " — Due today!";
        }

        meta.appendChild(dueDate);
        content.appendChild(meta);
        top.append(checkbox, content);
        card.appendChild(top);

        const actions = createElement("div", "task-actions");

        const editBtn = createElement("button", "edit-btn", "✏️ Edit");
        editBtn.type = "button";
        editBtn.addEventListener("click", () => editTask(task.id));

        const deleteBtn = createElement("button", "delete-btn", "🗑️ Delete");
        deleteBtn.type = "button";
        deleteBtn.addEventListener("click", () => deleteTask(task.id));

        actions.append(editBtn, deleteBtn);
        card.appendChild(actions);

        taskList.appendChild(card);
    });

    updateStats();
}

function toggleComplete(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    const oldValue = task.completed;
    task.completed = !task.completed;

    if (!saveTasks()) {
        task.completed = oldValue;
        renderTasks();
        return;
    }

    renderTasks();

    showToast(
        task.completed
            ? "Task completed! Great job! 🎉"
            : "Task marked as pending."
    );
}

function editTask(id) {
    const task = tasks.find(item => item.id === id);

    if (!task) return;

    editingId = id;

    titleInput.value = task.title;
    descriptionInput.value = task.description;
    dueDateInput.value = task.dueDate;
    priorityInput.value = task.priority;

    document.getElementById("charCount").textContent =
        descriptionInput.value.length;

    // Allow editing a task whose due date has passed.
    dueDateInput.min = "";

    formHeading.textContent = "✏️ Edit Task";
    submitBtn.textContent = "💾 Update Task";
    cancelBtn.classList.remove("hidden");

    document.querySelector(".form-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    titleInput.focus();
}

function deleteTask(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    const oldTasks = tasks;
    tasks = tasks.filter(task => task.id !== id);

    if (!saveTasks()) {
        tasks = oldTasks;
        renderTasks();
        return;
    }

    if (editingId === id) {
        resetForm();
    }

    renderTasks();
    showToast("Task deleted successfully.");
}

statusFilter.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);
sortFilter.addEventListener("change", renderTasks);
searchInput.addEventListener("input", renderTasks);

document.querySelectorAll(".quick-btn").forEach(button => {
    button.addEventListener("click", function () {
        statusFilter.value = this.dataset.filter;

        document.querySelectorAll(".quick-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        this.classList.add("active");
        renderTasks();
    });
});

document.getElementById("clearCompleted").addEventListener("click", function () {
    const completedTasks = tasks.filter(task => task.completed);

    if (completedTasks.length === 0) {
        showToast("There are no completed tasks to clear.");
        return;
    }

    const confirmed = confirm(
        `Delete all ${completedTasks.length} completed tasks?`
    );

    if (!confirmed) return;

    const oldTasks = tasks;
    tasks = tasks.filter(task => !task.completed);

    if (!saveTasks()) {
        tasks = oldTasks;
        renderTasks();
        return;
    }

    if (editingId !== null && !tasks.some(task => task.id === editingId)) {
        resetForm();
    }

    renderTasks();
    showToast("Completed tasks cleared.");
});

/* Dark mode */
const themeToggle = document.getElementById("themeToggle");

function applyTheme(isDark) {
    document.body.classList.toggle("dark-mode", isDark);

    themeToggle.textContent = isDark
        ? "☀️ Light Mode"
        : "🌙 Dark Mode";
}

try {
    applyTheme(localStorage.getItem("studentTaskTheme") === "dark");
} catch {
    applyTheme(false);
}

themeToggle.addEventListener("click", function () {
    const isDark = !document.body.classList.contains("dark-mode");

    applyTheme(isDark);

    try {
        localStorage.setItem(
            "studentTaskTheme",
            isDark ? "dark" : "light"
        );
    } catch {
        showToast("Theme preference could not be saved.");
        return;
    }

    showToast(isDark ? "Dark mode enabled." : "Light mode enabled.");
});

/* Initial display */
renderTasks();
