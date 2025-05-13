// script.j// script.js for index.html

document.addEventListener('DOMContentLoaded', () => {
    // Request permission for notifications
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    function showNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(message);
        }
    }

    const mainContainer = document.getElementById('mainContainer');
    const welcomeDiv = document.getElementById('welcome');
    const logoutBtn = document.getElementById('logoutBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const settingsForm = document.getElementById('settingsForm');
    const studyDurationInput = document.getElementById('studyDuration');
    const breakDurationInput = document.getElementById('breakDuration');
    const timerText = document.getElementById('timerText');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressCircle = document.getElementById('progressCircle');
    const startSound = document.getElementById('startSound');
    const endSound = document.getElementById('endSound');
    // New element to display session type
    const sessionStatus = document.getElementById('sessionStatus');

    let studyTime = localStorage.getItem('studyDuration')
      ? parseInt(localStorage.getItem('studyDuration'))
      : 25;
    let breakTime = localStorage.getItem('breakDuration')
      ? parseInt(localStorage.getItem('breakDuration'))
      : 5;
    let timerInterval;
    let timeLeft;
    let isStudy = true;
    let isPaused = true;
    const fullDashArray = 628; // 2 * Math.PI * radius (2π * 100)

    // Check if the user is logged in and authorized to access the Pomodoro tool
    const loggedInUser = sessionStorage.getItem('pomodoroUser');
    const canAccess = sessionStorage.getItem('canAccessPomodoro');

    if (!loggedInUser || canAccess !== 'yes') {
        window.location.href = 'auth.html';
    } else {
        mainContainer.style.display = '';
        const user = JSON.parse(loggedInUser);
        welcomeDiv.textContent = `Welcome, ${user.username}!`;
        initializeTimer();
    }

    // Update timer and display the current session type
    function initializeTimer() {
        timeLeft = isStudy ? studyTime * 60 : breakTime * 60;
        updateTimerDisplay();
        setCircleProgress(1);
        if (sessionStatus) {
            sessionStatus.textContent = isStudy ? "Study Session" : "Break Session";
        }
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60)
          .toString()
          .padStart(2, '0');
        const seconds = (timeLeft % 60).toString().padStart(2, '0');
        timerText.textContent =`${minutes}:${seconds}`;
    }

    function setCircleProgress(percent) {
        const offset = fullDashArray * (1 - percent);
        progressCircle.style.strokeDashoffset = offset;
    }

    // When starting the timer, if it's a study session,
    // automatically start the break session when it ends,
    // but require user input after the break.
    function startTimer() {
        isPaused = false;
        startBtn.textContent = 'Resume';
        pauseBtn.style.display = 'inline-block';
        startSound.play();

        const startTime = Date.now();
        const endTime = startTime + timeLeft * 1000;

        timerInterval = setInterval(() => {
            timeLeft = Math.round((endTime - Date.now()) / 1000);
            if (timeLeft < 0) {
                clearInterval(timerInterval);
                endSound.play();

                if (isStudy) {
                    showNotification("Study session complete! Time for a break.");
                    // Automatically start break session.
                    isStudy = false;
                    initializeTimer();
                    startTimer();
                } else {
                    showNotification("Break session complete! Ready to start studying?");
                    // After break, stop automatically; user must press start.
                    isStudy = true;
                    initializeTimer();
                    isPaused = true;
                    startBtn.textContent = 'Start';
                    pauseBtn.style.display = 'none';
                }
            } else {
                updateTimerDisplay();
                const totalSeconds = isStudy ? studyTime * 60 : breakTime * 60;
                const remainingTimeRatio = timeLeft / totalSeconds;
                setCircleProgress(remainingTimeRatio);
            }
        }, 1000);
    }

    function pauseTimer() {
        isPaused = true;
        clearInterval(timerInterval);
        startBtn.textContent = 'Resume';
        pauseBtn.style.display = 'none';
    }

    function resetTimer() {
        isPaused = true;
        clearInterval(timerInterval);
        isStudy = true;
        initializeTimer();
        startBtn.textContent = 'Start';
        pauseBtn.style.display = 'inline-block';
    }

    // Button event listeners trigger both the timer action and a notification
    startBtn.addEventListener('click', () => {
        if (isPaused) {
            startTimer();
            showNotification("Timer started");
        } else {
            pauseTimer();
            showNotification("Timer paused");
        }
    });

    pauseBtn.addEventListener('click', () => {
        pauseTimer();
        showNotification("Timer paused");
    });

    resetBtn.addEventListener('click', () => {
        resetTimer();
        showNotification("Timer reset");
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('pomodoroUser');
        sessionStorage.removeItem('canAccessPomodoro');
        window.location.href = 'auth.html';
    });

    settingsBtn.addEventListener('click', () => {
        studyDurationInput.value = studyTime;
        breakDurationInput.value = breakTime;
        settingsModal.style.display = 'flex';
    });

    closeSettings.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newStudyTime = parseInt(studyDurationInput.value);
        const newBreakTime = parseInt(breakDurationInput.value);
        if (!isNaN(newStudyTime) && !isNaN(newBreakTime) && newStudyTime > 0 && newBreakTime > 0) {
            studyTime = newStudyTime;
            breakTime = newBreakTime;
            localStorage.setItem('studyDuration', studyTime);
            localStorage.setItem('breakDuration', breakTime);
            initializeTimer();
            settingsModal.style.display = 'none';
        } else {
            alert('Please enter valid positive numbers for study and break durations.');
        }
    });
});

// script.js for landing.html
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(sessionStorage.getItem('pomodoroUser'));
    if (!user) {
        window.location.href = "auth.html";
    }

    const gotoPomodoroBtn = document.getElementById('gotoPomodoroBtn');
    if (gotoPomodoroBtn) {
        gotoPomodoroBtn.onclick = function() {
            sessionStorage.setItem('canAccessPomodoro', 'yes');
            window.location.href = "index.html";
        };
    }
});