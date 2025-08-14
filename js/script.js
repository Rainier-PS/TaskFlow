document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const dateInput = document.getElementById('date-input');
    const taskList = document.getElementById('task-list');
    const filterInput = document.getElementById('filter-input');
    const sortSelect = document.getElementById('sort-select');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const darkToggle = document.getElementById('dark-toggle');
    const html = document.documentElement;
    const statusFilter = document.getElementById('status-filter');

    let tasks = [];

    function setDarkMode(on, updateStorage = true) {
        if (on) {
            html.classList.add('dark');
            if (updateStorage) localStorage.setItem('theme', 'dark');
            darkToggle.textContent = '☀️';
        } else {
            html.classList.remove('dark');
            if (updateStorage) localStorage.setItem('theme', 'light');
            darkToggle.textContent = '🌙';
        }
    }
    function detectDark() {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark') setDarkMode(true, false);
        else if (stored === 'light') setDarkMode(false, false);
        else setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches, false);
    }
    darkToggle.addEventListener('click', () => {
        setDarkMode(!html.classList.contains('dark'));
    });
    detectDark();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) setDarkMode(e.matches, false);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask();
    });

    filterInput.addEventListener('input', renderTasks);
    sortSelect.addEventListener('change', renderTasks);
    statusFilter.addEventListener('change', renderTasks);
    deleteAllBtn.addEventListener('click', () => {
        if (tasks.length && confirm('Delete all tasks?')) {
            tasks = [];
            renderTasks();
        }
    });

    function addTask() {
        const taskValue = taskInput.value.trim();
        const dateValue = dateInput.value;

        if (!taskValue) {
            taskInput.classList.add('ring-2', 'ring-red-400');
            setTimeout(() => taskInput.classList.remove('ring-2', 'ring-red-400'), 1000);
            return;
        }
        if (!dateValue) {
            dateInput.classList.add('ring-2', 'ring-red-400');
            setTimeout(() => dateInput.classList.remove('ring-2', 'ring-red-400'), 1000);
            return;
        }

        tasks.push({ text: taskValue, date: dateValue, status: "Not Started" });
        taskInput.value = '';
        dateInput.value = '';
        renderTasks();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        renderTasks();
    }

    function renderTasks() {
        const filterValue = filterInput.value.toLowerCase();
        const statusValue = statusFilter.value;

        let filtered = tasks
            .map((t, i) => ({ ...t, idx: i }))
            .filter(
                t =>
                    (t.text.toLowerCase().includes(filterValue) || t.date.includes(filterValue)) &&
                    (statusValue === "" || t.status === statusValue)
            );

        const sort = sortSelect.value;
        filtered.sort((a, b) => {
            if (sort === 'date-asc') return a.date.localeCompare(b.date);
            if (sort === 'date-desc') return b.date.localeCompare(a.date);
            if (sort === 'alpha-asc') return a.text.localeCompare(b.text);
            if (sort === 'alpha-desc') return b.text.localeCompare(a.text);
            return 0;
        });

        taskList.innerHTML = '';
        if (!filtered.length) {
            taskList.innerHTML = `<tr><td colspan="4" class="text-center text-gray-400 dark:text-gray-500 py-4">No tasks found.</td></tr>`;
            return;
        }
        filtered.forEach(task => {
            const statusOptions = ["Not Started", "In Progress", "Done"].map(
                s => `<option value="${s}"${task.status === s ? " selected" : ""}>${s}</option>`
            ).join('');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-4 py-2 align-middle text-gray-900 dark:text-gray-100 text-sm sm:text-base break-words max-w-[120px] sm:max-w-none">${task.text}</td>
                <td class="px-4 py-2 align-middle text-gray-700 dark:text-gray-300 text-sm sm:text-base">${task.date}</td>
                <td class="px-4 py-2 align-middle">
                    <select class="status-dropdown bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-gray-900 dark:text-gray-100 transition text-sm sm:text-base" data-idx="${task.idx}">
                        ${statusOptions}
                    </select>
                </td>
                <td class="px-2 py-2 align-middle">
                    <button class="delete-btn bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 sm:px-3 rounded shadow transition text-xs sm:text-base whitespace-nowrap flex items-center justify-center" aria-label="Delete task" data-idx="${task.idx}">
                        <span class="hidden sm:inline">Delete</span>
                        <svg class="inline sm:hidden w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </td>
            `;
            taskList.appendChild(tr);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.onclick = () => deleteTask(Number(btn.getAttribute('data-idx')));
        });

        document.querySelectorAll('.status-dropdown').forEach(sel => {
            sel.onchange = (e) => {
                const idx = Number(sel.getAttribute('data-idx'));
                tasks[idx].status = sel.value;
            };
        });
    }

    renderTasks();
});
