const $ = (id) => document.getElementById(id);

const taskForm = $('taskForm');
const titleInput = $('title');
const descriptionInput = $('description');
const dueDateInput = $('dueDate');
const priorityInput = $('priority');
const taskList = $('taskList');
const statusFilter = $('statusFilter');
const priorityFilter = $('priorityFilter');
const sortFilter = $('sortFilter');
const searchInput = $('searchInput');
const submitBtn = $('submitBtn');
const cancelBtn = $('cancelBtn');
const formHeading = $('formHeading');

let tasks = [];
let editingId = null;
let toastTimer;

function getLocalDate() {
  const date = new Date();

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function safeReadTasks() {
  try {
    const saved = JSON.parse(
      localStorage.getItem('studentTasks') || '[]'
    );

    if (Array.isArray(saved)) {
      tasks = saved.filter(task =>
        task &&
        typeof task.id === 'string' &&
        typeof task.title === 'string' &&
        typeof task.description === 'string' &&
        ['High', 'Medium', 'Low'].includes(task.priority) &&
        /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) &&
        typeof task.completed === 'boolean'
      );
    }
  } catch {
    tasks = [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem('studentTasks', JSON.stringify(tasks));
    return true;
  } catch {
    showToast('Unable to save tasks in this browser.');
    return false;
  }
}

function showToast(message) {
  const toast = $('toast');

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function createElement(tag, className, text = '') {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  element.textContent = text;

  return element;
}

/* Task Statistics and Progress */

function updateStats() {
  const completed = tasks.filter(task => task.completed).length;
  const pending = tasks.length - completed;

  const overdue = tasks.filter(
    task => !task.completed && task.dueDate < getLocalDate()
  ).length;

  const percentage = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  $('totalTasks').textContent = tasks.length;
  $('pendingTasks').textContent = pending;
  $('completedTasks').textContent = completed;
  $('overdueTasks').textContent = overdue;

  $('progressPercent').textContent = `${percentage}%`;
  $('progressBar').style.width = `${percentage}%`;

  $('progressText').textContent = !tasks.length
    ? 'Add a task to start your progress!'
    : percentage === 100
      ? 'Amazing! All tasks completed! 🎉'
      : `${completed} of ${tasks.length} tasks completed. Keep going!`;

  $('footerCount').textContent =
    `${pending} task${pending !== 1 ? 's' : ''} remaining`;
}

/* Display Tasks */

function renderTasks() {
  taskList.replaceChildren();

  const status = statusFilter.value;
  const priority = priorityFilter.value;
  const search = searchInput.value.trim().toLowerCase();

  const filtered = tasks
    .filter(task => {
      if (status === 'Pending' && task.completed) {
        return false;
      }

      if (status === 'Completed' && !task.completed) {
        return false;
      }

      if (priority !== 'All' && task.priority !== priority) {
        return false;
      }

      return `${task.title} ${task.description}`
        .toLowerCase()
        .includes(search);
    })
    .sort((a, b) => {
      if (sortFilter.value === 'priority') {
        const order = {
          High: 0,
          Medium: 1,
          Low: 2
        };

        return order[a.priority] - order[b.priority];
      }

      if (sortFilter.value === 'title') {
        return a.title.localeCompare(b.title);
      }

      return a.dueDate.localeCompare(b.dueDate);
    });

  $('visibleCount').textContent =
    `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    taskList.appendChild(
      createElement(
        'div',
        'empty-state',
        tasks.length
          ? '🔎 No tasks match your search or filters.'
          : '📚 No tasks yet. Add your first task!'
      )
    );
  }

  filtered.forEach(task => {
    const card = createElement(
      'article',
      `task-card priority-${task.priority}${task.completed ? ' completed' : ''}`
    );

    const top = createElement('div', 'task-top');

    const checkbox = createElement('input', 'task-checkbox');

    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;

    checkbox.setAttribute(
      'aria-label',
      `Mark ${task.title} as ${task.completed ? 'pending' : 'completed'}`
    );

    checkbox.addEventListener('change', () => {
      toggleComplete(task.id);
    });

    const content = createElement('div', 'task-content');

    content.appendChild(
      createElement('h3', 'task-title', task.title)
    );

    if (task.description) {
      content.appendChild(
        createElement('p', 'task-description', task.description)
      );
    }

    const meta = createElement('div', 'task-meta');

    meta.appendChild(
      createElement(
        'span',
        `badge priority-badge ${task.priority}`,
        `${task.priority} Priority`
      )
    );

    meta.appendChild(
      createElement(
        'span',
        `badge status-badge${task.completed ? ' done' : ''}`,
        task.completed ? 'Completed ✓' : 'Pending'
      )
    );

    const due = createElement(
      'span',
      'due-date',
      `📅 Due: ${task.dueDate}`
    );

    if (!task.completed && task.dueDate < getLocalDate()) {
      due.classList.add('overdue');
      due.textContent += ' — Overdue!';
    } else if (
      !task.completed &&
      task.dueDate === getLocalDate()
    ) {
      due.classList.add('overdue');
      due.textContent += ' — Due today!';
    }

    meta.appendChild(due);
    content.appendChild(meta);

    top.append(checkbox, content);
    card.appendChild(top);

    const actions = createElement('div', 'task-actions');

    const editButton = createElement(
      'button',
      'edit-btn',
      '✏️ Edit'
    );

    editButton.type = 'button';

    editButton.addEventListener('click', () => {
      editTask(task.id);
    });

    const deleteButton = createElement(
      'button',
      'delete-btn',
      '🗑️ Delete'
    );

    deleteButton.type = 'button';

    deleteButton.addEventListener('click', () => {
      deleteTask(task.id);
    });

    actions.append(editButton, deleteButton);
    card.appendChild(actions);

    taskList.appendChild(card);
  });

  updateStats();
}

/* Add and Edit Tasks */

function resetForm() {
  taskForm.reset();

  priorityInput.value = 'Medium';
  dueDateInput.min = getLocalDate();

  editingId = null;

  formHeading.textContent = '➕ Add New Task';
  submitBtn.textContent = '➕ Add Task';

  cancelBtn.classList.add('hidden');
  $('charCount').textContent = '0';
}

taskForm.addEventListener('submit', event => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = priorityInput.value;

  if (!title || !dueDate) {
    showToast('Please fill all required fields.');
    return;
  }

  if (!['High', 'Medium', 'Low'].includes(priority)) {
    showToast('Please select a valid priority.');
    return;
  }

  if (editingId === null && dueDate < getLocalDate()) {
    showToast('Please select today or a future date.');
    return;
  }

  const previous = JSON.stringify(tasks);

  if (editingId !== null) {
    const task = tasks.find(item => item.id === editingId);

    if (!task) {
      resetForm();
      return;
    }

    Object.assign(task, {
      title,
      description,
      dueDate,
      priority
    });
  } else {
    tasks.push({
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      title,
      description,
      dueDate,
      priority,
      completed: false
    });
  }

  if (!saveTasks()) {
    tasks = JSON.parse(previous);
    renderTasks();
    return;
  }

  const wasEditing = editingId !== null;

  resetForm();
  renderTasks();

  showToast(
    wasEditing
      ? 'Task updated successfully! ✨'
      : 'Task added successfully! 🎯'
  );
});

cancelBtn.addEventListener('click', () => {
  resetForm();
  showToast('Editing cancelled.');
});

descriptionInput.addEventListener('input', () => {
  $('charCount').textContent = descriptionInput.value.length;
});

/* Complete Task */

function toggleComplete(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  const previousStatus = task.completed;

  task.completed = !task.completed;

  if (!saveTasks()) {
    task.completed = previousStatus;
    renderTasks();
    return;
  }

  renderTasks();

  showToast(
    task.completed
      ? 'Task completed! 🎉'
      : 'Task marked as pending.'
  );
}

/* Edit Task */

function editTask(id) {
  const task = tasks.find(item => item.id === id);

  if (!task) return;

  editingId = id;

  titleInput.value = task.title;
  descriptionInput.value = task.description;
  dueDateInput.value = task.dueDate;
  priorityInput.value = task.priority;

  $('charCount').textContent = descriptionInput.value.length;

  dueDateInput.min = '';

  formHeading.textContent = '✏️ Edit Task';
  submitBtn.textContent = '💾 Update Task';

  cancelBtn.classList.remove('hidden');

  document.querySelector('.form-section').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  titleInput.focus();
}

/* Delete Task */

function deleteTask(id) {
  if (!confirm('Are you sure you want to delete this task?')) {
    return;
  }

  const previousTasks = tasks;

  tasks = tasks.filter(item => item.id !== id);

  if (!saveTasks()) {
    tasks = previousTasks;
    renderTasks();
    return;
  }

  if (editingId === id) {
    resetForm();
  }

  renderTasks();
  showToast('Task deleted successfully.');
}

/* Search, Filter and Sort */

statusFilter.addEventListener('change', renderTasks);
priorityFilter.addEventListener('change', renderTasks);
sortFilter.addEventListener('change', renderTasks);
searchInput.addEventListener('input', renderTasks);

document.querySelectorAll('.quick-btn').forEach(button => {
  button.addEventListener('click', function () {
    statusFilter.value = this.dataset.filter;

    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.classList.toggle('active', btn === this);
    });

    renderTasks();
  });
});

/* Clear Completed Tasks */

$('clearCompleted').addEventListener('click', () => {
  const completed = tasks.filter(task => task.completed);

  if (completed.length === 0) {
    showToast('There are no completed tasks to clear.');
    return;
  }

  if (!confirm(`Delete all ${completed.length} completed tasks?`)) {
    return;
  }

  const previousTasks = tasks;

  tasks = tasks.filter(task => !task.completed);

  if (!saveTasks()) {
    tasks = previousTasks;
    renderTasks();
    return;
  }

  if (editingId && !tasks.some(task => task.id === editingId)) {
    resetForm();
  }

  renderTasks();
  showToast('Completed tasks cleared.');
});

/* Dark Mode */

function applyTheme(dark) {
  document.body.classList.toggle('dark-mode', dark);

  $('themeToggle').textContent = dark
    ? '☀️ Light Mode'
    : '🌙 Dark Mode';
}

try {
  applyTheme(localStorage.getItem('studentTaskTheme') === 'dark');
} catch {
  applyTheme(false);
}

$('themeToggle').addEventListener('click', () => {
  const dark = !document.body.classList.contains('dark-mode');

  applyTheme(dark);

  try {
    localStorage.setItem(
      'studentTaskTheme',
      dark ? 'dark' : 'light'
    );
  } catch {
    // Theme still changes for this session.
  }
});

/* Login and Navigation */

const loginScreen = $('loginScreen');
const app = $('app');

function openDashboard(name) {
  $('loggedInStudent').textContent = name;

  loginScreen.classList.add('hidden');
  app.classList.remove('hidden');

  showPage('dashboard');
}

function showPage(pageName) {
  document.querySelectorAll('.page-section').forEach(section => {
    section.classList.add('hidden');
  });

  const selected = pageName === 'dashboard'
    ? $('dashboardPage')
    : $(`${pageName}Page`);

  if (selected) {
    selected.classList.remove('hidden');
  }

  document.querySelectorAll('.nav-btn').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.page === pageName
    );
  });
}

/* Normal Login */

$('loginForm').addEventListener('submit', event => {
  event.preventDefault();

  const name = $('studentName').value.trim();
  const email = $('studentEmail').value.trim();

  if (!name || !email) {
    showToast('Please enter your name and email.');
    return;
  }

  try {
    localStorage.setItem('studentPortalName', name);
    localStorage.setItem('studentPortalEmail', email);
  } catch {
    // Login continues for this session.
  }

  openDashboard(name);
});

/* Demo Login Button */

$('demoLoginBtn').addEventListener('click', () => {
  const name = 'Demo Student';
  const email = 'demo@student.com';

  $('studentName').value = name;
  $('studentEmail').value = email;

  try {
    localStorage.setItem('studentPortalName', name);
    localStorage.setItem('studentPortalEmail', email);
  } catch {
    // Demo login can still work for this session.
  }

  openDashboard(name);
  showToast('Welcome to the demo dashboard! 🎉');
});

/* Navigation Buttons */

document.querySelectorAll('.nav-btn').forEach(button => {
  button.addEventListener('click', () => {
    showPage(button.dataset.page);
  });
});

/* Logout */

$('logoutBtn').addEventListener('click', () => {
  try {
    localStorage.removeItem('studentPortalName');
    localStorage.removeItem('studentPortalEmail');
  } catch {
    // Ignore storage errors.
  }

  app.classList.add('hidden');
  loginScreen.classList.remove('hidden');

  $('loginForm').reset();
});

/* Restore Previous Login */

try {
  const savedName = localStorage.getItem('studentPortalName');
  const savedEmail = localStorage.getItem('studentPortalEmail');

  if (savedName && savedEmail) {
    openDashboard(savedName);
  }
} catch {
  // Show login screen if storage is unavailable.
}

/* Current Date */

$('todayDate').textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric'
});

dueDateInput.min = getLocalDate();

/* Initialize Application */

safeReadTasks();
renderTasks();