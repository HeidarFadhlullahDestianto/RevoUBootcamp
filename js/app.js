/* ============================================================
   To-Do Life Dashboard — app.js
   Vanilla JS, Local Storage only, no frameworks.
   ============================================================ */

/* ============================================================
   1. THEME (Challenge: Light / Dark Mode)
   ============================================================ */
const ThemeManager = (() => {
  const KEY = 'dashboard-theme';
  const btn = document.getElementById('themeToggleBtn');

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem(KEY, theme);
  }

  function init() {
    const saved = localStorage.getItem(KEY) || 'light';
    apply(saved);
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      apply(current === 'dark' ? 'light' : 'dark');
    });
  }

  return { init };
})();


/* ============================================================
   2. CLOCK & GREETING (with Challenge: Custom Name)
   ============================================================ */
const GreetingWidget = (() => {
  const NAME_KEY = 'dashboard-username';

  const clockEl    = document.getElementById('clockTime');
  const dateEl     = document.getElementById('greetingDate');
  const greetEl    = document.getElementById('greetingText');
  const nameDisp   = document.getElementById('nameDisplay');
  const editNameBtn    = document.getElementById('editNameBtn');
  const nameInputRow   = document.getElementById('nameInputRow');
  const nameInput      = document.getElementById('nameInput');
  const saveNameBtn    = document.getElementById('saveNameBtn');
  const cancelNameBtn  = document.getElementById('cancelNameBtn');

  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

  function getGreeting(hour) {
    if (hour >= 5  && hour < 12) return '🌅 Good Morning';
    if (hour >= 12 && hour < 17) return '☀️ Good Afternoon';
    if (hour >= 17 && hour < 21) return '🌆 Good Evening';
    return '🌙 Good Night';
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = new Date();
    const h    = now.getHours();
    const m    = now.getMinutes();
    const s    = now.getSeconds();
    const name = localStorage.getItem(NAME_KEY) || '';

    // Clock
    clockEl.innerHTML =
      `${pad(h)}:${pad(m)}<tspan class="seconds">:${pad(s)}</tspan>`;
    // Use a plain span instead (HTML not SVG here)
    clockEl.textContent = `${pad(h)}:${pad(m)}`;

    // Date
    const day  = DAYS[now.getDay()];
    const date = now.getDate();
    const mon  = MONTHS[now.getMonth()];
    const yr   = now.getFullYear();
    dateEl.textContent = `${day}, ${date} ${mon} ${yr}`;

    // Greeting
    greetEl.textContent = `${getGreeting(h)}${name ? ', ' + name : ''}!`;

    // Name label
    nameDisp.textContent = name ? `👤 ${name}` : '👤 Guest';
  }

  function saveName() {
    const val = nameInput.value.trim();
    if (val) localStorage.setItem(NAME_KEY, val);
    else localStorage.removeItem(NAME_KEY);
    nameInputRow.classList.remove('visible');
    tick();
  }

  function init() {
    tick();
    setInterval(tick, 1000);

    editNameBtn.addEventListener('click', () => {
      nameInput.value = localStorage.getItem(NAME_KEY) || '';
      nameInputRow.classList.add('visible');
      nameInput.focus();
    });

    saveNameBtn.addEventListener('click', saveName);
    cancelNameBtn.addEventListener('click', () => {
      nameInputRow.classList.remove('visible');
    });
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveName();
      if (e.key === 'Escape') nameInputRow.classList.remove('visible');
    });
  }

  return { init };
})();


/* ============================================================
   3. FOCUS TIMER (Challenge: Change Pomodoro time)
   ============================================================ */
const TimerWidget = (() => {
  const DURATION_KEY = 'timer-duration-minutes';
  const DEFAULT_MIN  = 25;

  const timerDisplay   = document.getElementById('timerDisplay');
  const timerLabel     = document.getElementById('timerLabel');
  const timerProgress  = document.getElementById('timerProgress');
  const startBtn       = document.getElementById('timerStart');
  const stopBtn        = document.getElementById('timerStop');
  const resetBtn       = document.getElementById('timerReset');
  const durationInput  = document.getElementById('timerDurationInput');
  const setDurBtn      = document.getElementById('setDurationBtn');

  const RADIUS       = 70;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  let totalSeconds = 0;
  let remaining    = 0;
  let intervalId   = null;
  let running      = false;

  function getSavedMinutes() {
    const v = parseInt(localStorage.getItem(DURATION_KEY));
    return (v && v > 0 && v <= 180) ? v : DEFAULT_MIN;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateDisplay() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    timerDisplay.textContent = `${pad(m)}:${pad(s)}`;

    // Ring progress
    const frac   = totalSeconds > 0 ? remaining / totalSeconds : 1;
    const offset = CIRCUMFERENCE * (1 - frac);
    timerProgress.style.strokeDasharray  = CIRCUMFERENCE;
    timerProgress.style.strokeDashoffset = offset;
  }

  function setDuration(minutes) {
    stop();
    totalSeconds = minutes * 60;
    remaining    = totalSeconds;
    updateDisplay();
    timerLabel.textContent = `${minutes} min focus`;
    durationInput.value    = minutes;
  }

  function start() {
    if (running) return;
    if (remaining === 0) setDuration(getSavedMinutes());
    running    = true;
    startBtn.disabled = true;
    stopBtn.disabled  = false;
    intervalId = setInterval(() => {
      remaining--;
      updateDisplay();
      if (remaining <= 0) {
        clearInterval(intervalId);
        running           = false;
        startBtn.disabled = false;
        timerLabel.textContent = '✅ Time is up!';
        // Simple browser notification fallback
        if (Notification && Notification.permission === 'granted') {
          new Notification('Focus Timer', { body: 'Your focus session is done!' });
        }
      }
    }, 1000);
  }

  function stop() {
    clearInterval(intervalId);
    running           = false;
    startBtn.disabled = false;
    stopBtn.disabled  = true;
  }

  function reset() {
    stop();
    const mins = getSavedMinutes();
    setDuration(mins);
    timerLabel.textContent = `${mins} min focus`;
  }

  function init() {
    // Setup ring
    timerProgress.setAttribute('stroke-dasharray', CIRCUMFERENCE);
    timerProgress.setAttribute('stroke-dashoffset', 0);

    const savedMins = getSavedMinutes();
    durationInput.value = savedMins;
    setDuration(savedMins);

    stopBtn.disabled = true;

    startBtn.addEventListener('click', start);
    stopBtn.addEventListener('click',  stop);
    resetBtn.addEventListener('click', reset);

    setDurBtn.addEventListener('click', () => {
      const val = parseInt(durationInput.value);
      if (!val || val < 1 || val > 180) {
        durationInput.style.borderColor = '#e74c3c';
        setTimeout(() => durationInput.style.borderColor = '', 800);
        return;
      }
      localStorage.setItem(DURATION_KEY, val);
      setDuration(val);
    });

    durationInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') setDurBtn.click();
    });

    // Request notification permission once
    if (Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  return { init };
})();


/* ============================================================
   4. TO-DO LIST (Challenges: Prevent Duplicates, Sort tasks)
   ============================================================ */
const TodoWidget = (() => {
  const STORAGE_KEY = 'dashboard-todos';

  const input      = document.getElementById('todoInput');
  const addBtn     = document.getElementById('todoAddBtn');
  const listEl     = document.getElementById('todoList');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const clearBtn   = document.getElementById('clearDoneBtn');
  const footerText = document.getElementById('todoFooter');
  const dupMsg     = document.getElementById('dupMessage');
  const sortBtn    = document.getElementById('sortBtn');

  let todos     = [];
  let filter    = 'all';
  let editingId = null;
  let sortMode  = 'none'; // none | az | za

  /* ---- Storage ---- */
  function load() {
    try { todos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { todos = []; }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  /* ---- Filtering & Sorting ---- */
  function getFiltered() {
    let list = [...todos];
    if (filter === 'active') list = list.filter(t => !t.done);
    if (filter === 'done')   list = list.filter(t => t.done);
    if (sortMode === 'az')   list.sort((a, b) => a.text.localeCompare(b.text));
    if (sortMode === 'za')   list.sort((a, b) => b.text.localeCompare(a.text));
    return list;
  }

  /* ---- Render ---- */
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function render() {
    const filtered = getFiltered();
    const total  = todos.length;
    const done   = todos.filter(t => t.done).length;
    const active = total - done;

    document.getElementById('statTotal').textContent  = total;
    document.getElementById('statActive').textContent = active;
    document.getElementById('statDone').textContent   = done;

    footerText.textContent = total === 0 ? 'No tasks yet' : `${active} task${active !== 1 ? 's' : ''} remaining`;

    if (filtered.length === 0) {
      const msgs = {
        all:    ['📭', 'No tasks yet. Add one above!'],
        active: ['🎉', 'All tasks completed!'],
        done:   ['📝', 'No completed tasks.'],
      };
      const [emoji, text] = msgs[filter];
      listEl.innerHTML = `
        <div class="empty-state">
          <span class="emoji">${emoji}</span>
          <p>${text}</p>
        </div>`;
    } else {
      listEl.innerHTML = filtered.map(todo => `
        <div class="todo-item" data-id="${todo.id}">
          <div class="todo-checkbox ${todo.done ? 'checked' : ''}" data-action="toggle"
               role="checkbox" aria-checked="${todo.done}" tabindex="0"
               title="${todo.done ? 'Mark active' : 'Mark done'}">
            ${todo.done ? '✓' : ''}
          </div>
          <span class="todo-text ${todo.done ? 'done' : ''}">${escapeHtml(todo.text)}</span>
          <div class="todo-actions" aria-label="Task actions">
            ${!todo.done
              ? `<button class="btn-todo-action btn-todo-edit" data-action="edit" title="Edit task">✏️</button>`
              : ''}
            <button class="btn-todo-action btn-todo-delete" data-action="delete" title="Delete task">🗑️</button>
          </div>
        </div>
      `).join('');
    }
  }

  /* ---- Actions ---- */
  function isDuplicate(text, excludeId = null) {
    return todos.some(t =>
      t.text.trim().toLowerCase() === text.trim().toLowerCase() && t.id !== excludeId
    );
  }

  function addOrUpdate() {
    const text = input.value.trim();
    dupMsg.textContent = '';

    if (!text) {
      input.style.borderColor = 'var(--danger)';
      setTimeout(() => input.style.borderColor = '', 800);
      return;
    }

    if (editingId) {
      // Challenge: Prevent duplicates on edit too
      if (isDuplicate(text, editingId)) {
        dupMsg.textContent = '⚠️ A task with that name already exists.';
        return;
      }
      const todo = todos.find(t => t.id === editingId);
      if (todo) todo.text = text;
      editingId = null;
      addBtn.textContent = '+';
      addBtn.title = 'Add task';
    } else {
      // Challenge: Prevent duplicates on add
      if (isDuplicate(text)) {
        dupMsg.textContent = '⚠️ That task already exists.';
        input.style.borderColor = 'var(--danger)';
        setTimeout(() => {
          input.style.borderColor = '';
          dupMsg.textContent = '';
        }, 2500);
        return;
      }
      todos.unshift({ id: genId(), text, done: false });
    }

    input.value = '';
    save();
    render();
    input.focus();
  }

  function toggleTodo(id) {
    const t = todos.find(t => t.id === id);
    if (t) t.done = !t.done;
    save();
    render();
  }

  function editTodo(id) {
    const t = todos.find(t => t.id === id);
    if (!t) return;
    editingId = id;
    input.value = t.text;
    addBtn.textContent = '💾';
    addBtn.title = 'Save edit';
    input.focus();
    dupMsg.textContent = '';
  }

  function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    if (editingId === id) {
      editingId = null;
      input.value = '';
      addBtn.textContent = '+';
    }
    save();
    render();
  }

  function clearDone() {
    todos = todos.filter(t => !t.done);
    save();
    render();
  }

  /* ---- Sort toggle ---- */
  function cycleSort() {
    if (sortMode === 'none')       sortMode = 'az';
    else if (sortMode === 'az')    sortMode = 'za';
    else                           sortMode = 'none';

    const labels = { none: '⇅ Sort', az: '↑ A–Z', za: '↓ Z–A' };
    sortBtn.textContent = labels[sortMode];
    sortBtn.classList.toggle('active', sortMode !== 'none');
    render();
  }

  /* ---- Events ---- */
  function init() {
    load();
    render();

    addBtn.addEventListener('click', addOrUpdate);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') addOrUpdate();
      if (e.key === 'Escape' && editingId) {
        editingId = null;
        input.value = '';
        addBtn.textContent = '+';
        dupMsg.textContent = '';
      }
    });

    listEl.addEventListener('click', e => {
      const item = e.target.closest('.todo-item');
      if (!item) return;
      const id     = item.dataset.id;
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'toggle') toggleTodo(id);
      if (action === 'edit')   editTodo(id);
      if (action === 'delete') deleteTodo(id);
    });

    // Keyboard accessibility for checkboxes
    listEl.addEventListener('keydown', e => {
      if (e.key === ' ' || e.key === 'Enter') {
        const cb = e.target.closest('[data-action="toggle"]');
        if (cb) {
          e.preventDefault();
          toggleTodo(cb.closest('.todo-item').dataset.id);
        }
      }
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
      });
    });

    clearBtn.addEventListener('click', clearDone);
    sortBtn.addEventListener('click', cycleSort);
  }

  return { init };
})();


/* ============================================================
   5. QUICK LINKS
   ============================================================ */
const LinksWidget = (() => {
  const STORAGE_KEY = 'dashboard-links';

  const gridEl        = document.getElementById('linksGrid');
  const addLinkBtn    = document.getElementById('addLinkBtn');
  const addLinkForm   = document.getElementById('addLinkForm');
  const linkNameInput = document.getElementById('linkNameInput');
  const linkUrlInput  = document.getElementById('linkUrlInput');
  const linkIconInput = document.getElementById('linkIconInput');
  const saveLinkBtn   = document.getElementById('saveLinkBtn');
  const cancelLinkBtn = document.getElementById('cancelLinkBtn');

  let links = [];

  function load() {
    try { links = JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaults(); }
    catch { links = getDefaults(); }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function getDefaults() {
    return [
      { id: genId(), name: 'Google',    url: 'https://google.com',    icon: '🔍' },
      { id: genId(), name: 'YouTube',   url: 'https://youtube.com',   icon: '▶️' },
      { id: genId(), name: 'GitHub',    url: 'https://github.com',    icon: '🐙' },
      { id: genId(), name: 'Wikipedia', url: 'https://wikipedia.org', icon: '📖' },
    ];
  }

  function normalizeUrl(url) {
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) return 'https://' + url;
    return url;
  }

  function render() {
    gridEl.innerHTML = links.map(link => `
      <a class="quick-link-btn" href="${escapeAttr(link.url)}" target="_blank"
         rel="noopener noreferrer" data-id="${link.id}"
         aria-label="Open ${escapeAttr(link.name)}">
        <span class="quick-link-icon" aria-hidden="true">${link.icon || '🔗'}</span>
        <span>${escapeHtml(link.name)}</span>
        <button class="quick-link-del" data-action="delete" title="Remove link"
                aria-label="Remove ${escapeAttr(link.name)}">✕</button>
      </a>
    `).join('');
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function showForm() {
    addLinkForm.classList.add('visible');
    linkNameInput.focus();
  }

  function hideForm() {
    addLinkForm.classList.remove('visible');
    linkNameInput.value = '';
    linkUrlInput.value  = '';
    linkIconInput.value = '';
  }

  function saveLink() {
    const name = linkNameInput.value.trim();
    const url  = normalizeUrl(linkUrlInput.value.trim());
    const icon = linkIconInput.value.trim() || '🔗';

    if (!name || !url) {
      if (!name) linkNameInput.style.borderColor = 'var(--danger)';
      if (!url)  linkUrlInput.style.borderColor  = 'var(--danger)';
      setTimeout(() => {
        linkNameInput.style.borderColor = '';
        linkUrlInput.style.borderColor  = '';
      }, 800);
      return;
    }

    links.push({ id: genId(), name, url, icon });
    save();
    render();
    hideForm();
  }

  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    save();
    render();
  }

  function init() {
    load();
    render();

    addLinkBtn.addEventListener('click', showForm);
    saveLinkBtn.addEventListener('click', saveLink);
    cancelLinkBtn.addEventListener('click', hideForm);

    [linkNameInput, linkUrlInput, linkIconInput].forEach(el => {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveLink();
        if (e.key === 'Escape') hideForm();
      });
    });

    gridEl.addEventListener('click', e => {
      const delBtn = e.target.closest('[data-action="delete"]');
      if (delBtn) {
        e.preventDefault(); // Don't follow the <a> link
        const card = delBtn.closest('[data-id]');
        if (card) deleteLink(card.dataset.id);
      }
    });
  }

  return { init };
})();


/* ============================================================
   6. BOOT — initialise all widgets
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  GreetingWidget.init();
  TimerWidget.init();
  TodoWidget.init();
  LinksWidget.init();
});
