let tasks = [];
let filteredTasks = [];
let currentDate = new Date();
let timerIntervals = {}; // Object to track timer intervals for tasks

// Add a task
function addTask() {
    const description = document.getElementById("newTaskInput").value;
    const priority = document.getElementById("newTaskPriority").value;

    if (description && priority) {
        const task = {
            id: Date.now(),
            description: description,
            priority: priority,
            date: getCurrentDateString(),
            estimatedTime: 0,
            actualTime: 0,
            timer: "00:00:00",
            running: false,
            listId: "pending",
        };

        tasks.push(task);
        saveTasksToLocalStorage();
        document.getElementById("newTaskInput").value = ""; // Clear input after adding
        filteredTasks = [...tasks]; // Sync filtered tasks
        updateTaskList("pending");
        generateCalendar(); // Update calendar to reflect new task
    }
}

// Start a task timer
function startTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    task.running = true;
    task.listId = "in-progress";

    // Start timer
    timerIntervals[taskId] = setInterval(() => {
        task.actualTime++;
        task.timer = formatTime(task.actualTime);
        saveTasksToLocalStorage();
        updateTaskList("in-progress");
    }, 1000);

    filteredTasks = [...tasks];
    updateTaskList("pending");
    updateTaskList("in-progress");
}

// Pause a task timer
function pauseTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    task.running = false;
    clearInterval(timerIntervals[taskId]);
    saveTasksToLocalStorage();
    updateTaskList("in-progress");
}

// Resume a task timer
function resumeTask(taskId) {
    startTask(taskId);
}

// Complete a task
function completeTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    task.listId = "done";
    task.running = false;
    clearInterval(timerIntervals[taskId]);
    saveTasksToLocalStorage();
    filteredTasks = [...tasks];
    updateTaskList("in-progress");
    updateTaskList("done");
    generateCalendar(); // Update calendar to reflect task status
}

// Delete a task
function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    clearInterval(timerIntervals[taskId]); // Clear the timer if it exists
    delete timerIntervals[taskId]; // Remove the timer reference
    saveTasksToLocalStorage();
    filteredTasks = [...tasks];
    updateTaskList("pending");
    updateTaskList("in-progress");
    updateTaskList("done");
    generateCalendar(); // Update calendar to reflect deletion
}

// Update task list based on their status
function updateTaskList(listId) {
    const taskList = document.getElementById(`${listId}-tasks`);
    taskList.innerHTML = '';

    const tasksToDisplay = filteredTasks.filter(task => task.listId === listId);

    tasksToDisplay.forEach(task => {
        const taskElement = document.createElement("li");
        taskElement.classList.add("task", `priority-${task.priority}`);
        taskElement.innerHTML = `
            <div class="task-info">
                <span>${task.description}</span> <br>
                Priority: ${task.priority} <br>
                Timer: ${task.timer}
            </div>
            <div class="task-actions">
                ${task.listId === "pending" ? `<button onclick="startTask(${task.id})">Start</button>` : ""}
                ${task.listId === "in-progress" ? 
                    `<button onclick="${task.running ? `pauseTask(${task.id})">Pause` : `resumeTask(${task.id})">Resume`}</button>` : ""}
                ${task.listId === "in-progress" ? `<button onclick="completeTask(${task.id})">Complete</button>` : ""}
                <button onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        taskList.appendChild(taskElement);
    });
}

// Format time (HH:MM:SS)
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
}

// Save tasks to local storage
function saveTasksToLocalStorage() {
    localStorage.setItem("taskBoardState", JSON.stringify(tasks));
}

// Load tasks from local storage
function loadTasksFromLocalStorage() {
    const savedState = localStorage.getItem("taskBoardState");
    if (savedState) {
        tasks = JSON.parse(savedState);
        tasks.forEach(task => {
            if (task.running) {
                startTask(task.id);
            }
        });
        filteredTasks = [...tasks];
        updateTaskList("pending");
        updateTaskList("in-progress");
        updateTaskList("done");
        generateCalendar(); // Load calendar with tasks
    }
}

// Generate the calendar
function generateCalendar() {
    const calendarElement = document.getElementById("calendar");
    const monthYearElement = document.getElementById("calendarMonthYear");

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const firstDayWeekday = firstDayOfMonth.getDay();

    calendarElement.innerHTML = "";
    monthYearElement.innerText = `${firstDayOfMonth.toLocaleString('default', { month: 'long' })} ${year}`;

    // Create empty slots for previous month's trailing days
    for (let i = 0; i < firstDayWeekday; i++) {
        const emptyDay = document.createElement("div");
        emptyDay.classList.add("calendar-day");
        calendarElement.appendChild(emptyDay);
    }

    // Create days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayElement = document.createElement("div");
        dayElement.classList.add("calendar-day");
        dayElement.innerText = day;
        dayElement.dataset.date = dateString;

        // Highlight current date
        if (dateString === getCurrentDateString()) {
            dayElement.classList.add("current-day");
        }

        // Check for tasks on this date
        const taskForDay = tasks.filter(task => task.date === dateString);
        if (taskForDay.length > 0) {
            dayElement.classList.add("has-tasks");
            dayElement.title = `${taskForDay.length} task(s)`;
        }

        dayElement.addEventListener("click", function() {
            filterTasksByDate(dateString);
        });

        calendarElement.appendChild(dayElement);
    }
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    generateCalendar();
}

function filterTasksByDate(date) {
    filteredTasks = tasks.filter(task => task.date === date);
    updateTaskList("pending");
    updateTaskList("in-progress");
    updateTaskList("done");
}

function getCurrentDateString() {
    const date = new Date();
    return date.toISOString().split('T')[0];
}

// Search for tasks
function searchTasks() {
    const searchQuery = document.getElementById("taskSearchInput").value.toLowerCase();
    if (!searchQuery) {
        filteredTasks = [...tasks];  // Show all tasks if no search query
        generateCalendar(); // Reset calendar view
        updateTaskList("pending");
        updateTaskList("in-progress");
        updateTaskList("done");
        return;
    }

    // Filter tasks based on description
    const matchedTasks = tasks.filter(task => task.description.toLowerCase().includes(searchQuery));
    filteredTasks = matchedTasks;
    updateTaskList("pending");
    updateTaskList("in-progress");
    updateTaskList("done");

    // Highlight matching dates on the calendar
    const calendarDays = document.querySelectorAll(".calendar-day");
    calendarDays.forEach(day => {
        day.classList.remove("search-highlight");
    });

    matchedTasks.forEach(task => {
        const matchDay = document.querySelector(`.calendar-day[data-date='${task.date}']`);
        if (matchDay) {
            matchDay.classList.add("search-highlight");
        }
    });
}

window.onload = function() {
    loadTasksFromLocalStorage();
    generateCalendar();
};
