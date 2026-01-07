document.addEventListener('DOMContentLoaded', () => {
  const todoInput = document.getElementById('todoInput');
  const dateInput = document.getElementById('dateInput');
  const addBtn = document.getElementById('addBtn');
  const todoTbody = document.getElementById('todoTbody');
  const filterBtn = document.getElementById('filterBtn');
  const filterMenu = document.getElementById('filterMenu');
  let currentFilter = 'all';
  const deleteAllBtn = document.getElementById('deleteAllBtn');

  let todos = JSON.parse(localStorage.getItem('todos') || '[]');
  let editId = null;

  // If no todos in localStorage, try loading initial data from data/todos.json
  (async function init() {
    if (!todos || todos.length === 0) {
      try {
        const res = await fetch('./data/todos.json');
        if (res && res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) {
            todos = data;
            save();
          }
        }
      } catch (err) {
        console.warn('Could not load ./data/todos.json', err);
      }
    }
    render();
  })();

  function save() { localStorage.setItem('todos', JSON.stringify(todos)); }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  function render() {
    const filter = currentFilter || 'all';
    todoTbody.innerHTML = '';
    const list = todos.filter(t => filter === 'all' ? true : t.status === filter);
    if (list.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4" style="opacity:0.6;">No todos</td>`;
      todoTbody.appendChild(tr);
      return;
    }

    list.forEach(t => {
      const tr = document.createElement('tr');

      const tdTask = document.createElement('td');
      tdTask.textContent = t.text;

      const tdDate = document.createElement('td');
      tdDate.textContent = formatDate(t.date);

      const tdStatus = document.createElement('td');
      const span = document.createElement('span');
      span.className = `status-badge ${t.status === 'done' ? 'status-done' : 'status-pending'}`;
      span.textContent = t.status === 'done' ? 'Done' : 'Pending';
      if (t.status === 'done') {
        span.title = 'Completed';
        span.style.cursor = 'default';
      } else {
        span.title = 'Click to mark done';
        span.style.cursor = 'pointer';
        span.addEventListener('click', () => {
          if (t.status !== 'done') {
            t.status = 'done';
            save(); render();
          }
        });
      }
      tdStatus.appendChild(span);

      const tdActions = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'action-btn edit-btn';
      editBtn.addEventListener('click', () => startEdit(t.id));

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'action-btn del-btn';
      delBtn.addEventListener('click', () => {
        todos = todos.filter(x => x.id !== t.id);
        save(); render();
      });

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);

      tr.appendChild(tdTask);
      tr.appendChild(tdDate);
      tr.appendChild(tdStatus);
      tr.appendChild(tdActions);

      todoTbody.appendChild(tr);
    });
  }

  function startEdit(id) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    todoInput.value = t.text;
    dateInput.value = t.date ? new Date(t.date).toISOString().slice(0,10) : '';
    addBtn.textContent = 'Save';
    editId = id;
  }

  addBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    const date = dateInput.value;
    if (!text) return alert('Please enter a todo');

    if (editId) {
      const t = todos.find(x => x.id === editId);
      if (t) { t.text = text; t.date = date || null; }
      editId = null; addBtn.textContent = '+';
    } else {
      const newTodo = { id: Date.now(), text, date: date || null, status: 'pending' };
      todos.push(newTodo);
    }

    todoInput.value = '';
    dateInput.value = '';
    save(); render();
  });

  // filter menu behaviour
  filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    filterMenu.classList.toggle('show');
    filterMenu.setAttribute('aria-hidden', filterMenu.classList.contains('show') ? 'false' : 'true');
  });

  filterMenu.querySelectorAll('button[data-filter]').forEach(btn => {
    btn.addEventListener('click', (ev) => {
      currentFilter = btn.getAttribute('data-filter');
      filterMenu.classList.remove('show');
      filterMenu.setAttribute('aria-hidden', 'true');
      render();
    });
  });

  // close menu when clicking outside
  document.addEventListener('click', () => {
    if (filterMenu.classList.contains('show')) {
      filterMenu.classList.remove('show');
      filterMenu.setAttribute('aria-hidden', 'true');
    }
  });

  deleteAllBtn.addEventListener('click', () => {
    if (!confirm('Delete all todos?')) return;
    todos = [];
    save(); render();
  });

  // initial render is invoked in init() above (after possible fetch)
});
