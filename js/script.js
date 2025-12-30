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
    const backToTopBtn = document.getElementById('back-to-top-btn');

    let tasks = [];

    function refreshIcons() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function setTheme(mode) {
        html.classList.toggle("dark", mode === "dark");

        darkToggle.textContent = "";

        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", mode === "dark" ? "sun" : "moon");
        icon.className =
            "w-5 h-5 text-gray-800 dark:text-white " +
            "dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]";
        icon.setAttribute("aria-hidden", "true");

        darkToggle.appendChild(icon);

        darkToggle.setAttribute(
            "aria-pressed",
            mode === "dark" ? "true" : "false"
        );

        localStorage.setItem("theme", mode);
        refreshIcons();
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
    } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
    }

    darkToggle.addEventListener("click", () => {
        const isDark = html.classList.contains("dark");
        setTheme(isDark ? "light" : "dark");
    });

    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", e => {
        if (!localStorage.getItem("theme")) {
            setTheme(e.matches ? "dark" : "light");
        }
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        addTask();
    });

    filterInput.addEventListener('input', renderTasks);
    sortSelect.addEventListener('change', renderTasks);
    statusFilter.addEventListener('change', renderTasks);

    deleteAllBtn.addEventListener('click', () => {
        if (tasks.length && confirm('Delete all tasks?')) {
            tasks = [];
            saveTasks();
            renderTasks();
        }
    });

    function sanitize(str) {
        return str.replace(/[<>&"'`]/g, c => ({
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#39;',
            '`': '&#96;'
        })[c]);
    }

    function addTask() {
        const taskValue = sanitize(taskInput.value.trim());
        const dateValue = dateInput.value;

        if (!taskValue) {
            taskInput.classList.add('ring-2', 'ring-red-400');
            setTimeout(() => taskInput.classList.remove('ring-2', 'ring-red-400'), 1000);
            return;
        }
        if (taskValue.length > 100) {
            alert("Task name must be under 100 characters.");
            return;
        }
        if (!dateValue) {
            dateInput.classList.add('ring-2', 'ring-red-400');
            setTimeout(() => dateInput.classList.remove('ring-2', 'ring-red-400'), 1000);
            return;
        }
        const today = new Date();
        today.setHours(0,0,0,0);

        if (new Date(dateValue) < today) {
            alert("Deadline cannot be in the past.");
            return;
        }

        const now = new Date();
        const dateAdded = now.toISOString().split('T')[0]; // YYYY-MM-DD

        tasks.push(Object.freeze({
            text: taskValue,
            date: dateValue,
            dateAdded,
            status: "Not Started"
        }));

        saveTasks();
        taskInput.value = '';
        dateInput.value = '';
        renderTasks();
    }

    function deleteTask(index) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        const validTasks = tasks.filter(t =>
            typeof t.text === 'string' &&
            typeof t.date === 'string' &&
            typeof t.status === 'string'
        );

        tasks = [...validTasks];

        const filterValue = filterInput.value.toLowerCase();
        const statusValue = statusFilter.value;

        let filtered = tasks
            .map((t, i) => Object.freeze({ ...t, idx: i }))
            .filter(
                t =>
                    (t.text.toLowerCase().includes(filterValue) || t.date.includes(filterValue)) &&
                    (statusValue === "" || t.status === statusValue)
            );

        const sort = sortSelect.value;
        filtered.sort((a, b) => {
            if (sort === 'date-asc') return a.date.localeCompare(b.date);
            if (sort === 'date-desc') return b.date.localeCompare(a.date);
            if (sort === 'added-asc') return a.dateAdded.localeCompare(b.dateAdded);
            if (sort === 'added-desc') return b.dateAdded.localeCompare(a.dateAdded);
            if (sort === 'alpha-asc') return a.text.localeCompare(b.text);
            if (sort === 'alpha-desc') return b.text.localeCompare(a.text);
            return 0;
        });

        taskList.innerHTML = '';
        if (!filtered.length) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 5;
            td.className = "text-center text-gray-400 dark:text-gray-500 py-4";
            td.textContent = "No tasks found.";
            tr.appendChild(td);
            taskList.appendChild(tr);
            return;
        }

        filtered.forEach(task => {
            const tr = document.createElement('tr');

            const tdText = document.createElement('td');
            tdText.className = "px-4 py-2 align-middle text-gray-900 dark:text-gray-100 text-sm sm:text-base break-words max-w-[120px] sm:max-w-none";
            tdText.textContent = task.text;

            const tdDate = document.createElement('td');
            tdDate.className = "px-4 py-2 align-middle text-gray-700 dark:text-gray-300 text-sm sm:text-base";
            tdDate.textContent = task.date;

            const tdAdded = document.createElement('td');
            tdAdded.className = "px-4 py-2 align-middle text-gray-700 dark:text-gray-300 text-sm sm:text-base";
            tdAdded.textContent = task.dateAdded || '-';

            const tdStatus = document.createElement('td');
            const select = document.createElement('select');
            select.className = "status-dropdown bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1";
            select.dataset.idx = task.idx;

            ["Not Started", "In Progress", "Done"].forEach(s => {
            const option = document.createElement('option');
            option.value = s;
            option.textContent = s;
            if (task.status === s) option.selected = true;
            select.appendChild(option);
            });

            tdStatus.appendChild(select);

            const tdAction = document.createElement('td');
            const btn = document.createElement('button');
            btn.className = "delete-btn bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded shadow transition";
            btn.textContent = "Delete";
            btn.dataset.idx = task.idx;

            tdAction.appendChild(btn);

            tr.append(tdText, tdDate, tdAdded, tdStatus, tdAction);
            taskList.appendChild(tr);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteTask(Number(btn.dataset.idx));
            });
        });


        document.querySelectorAll('.status-dropdown').forEach(sel => {
            sel.onchange = () => {
                const idx = Number(sel.dataset.idx);
                const allowed = ["Not Started", "In Progress", "Done"];

                if (allowed.includes(sel.value)) {
                    tasks[idx] = Object.freeze({
                        ...tasks[idx],
                        status: sel.value
                    });
                    saveTasks();
                    renderTasks();
                }
            };
        });
        
        refreshIcons();
    }

    const infoBtn = document.getElementById('info-btn');
    const infoOverlay = document.getElementById('info-overlay');
    const closeInfo = document.getElementById('close-info');
    const infoBox = document.getElementById('info-box');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !infoOverlay.hidden) {
            closeInfo.click();
        }
    });

    infoBtn.addEventListener('click', () => {
        infoOverlay.classList.remove('hidden');
    });

    closeInfo.addEventListener('click', () => {
        infoOverlay.classList.add('hidden');
    });

    infoOverlay.addEventListener('click', e => {
        if (e.target === infoOverlay) {
            infoOverlay.classList.add('hidden');
        }
    });

    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        try {
            const parsed = JSON.parse(storedTasks);
            if (Array.isArray(parsed)) {
                tasks = parsed.filter(t =>
                    typeof t.text === 'string' &&
                    typeof t.date === 'string' &&
                    typeof t.status === 'string'
                );
            }
        } catch {
            localStorage.removeItem('tasks');
            tasks = [];
        }
    }

    renderTasks();
    refreshIcons();

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            backToTopBtn.classList.remove('hidden');
        } else {
            backToTopBtn.classList.add('hidden');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

