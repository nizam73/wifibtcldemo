let selectedPackageData = null;
let purchasedSubscriptions = [];
let activeSubscriptionIndex = null;
let historyLogs = [];
let timerInterval = null;
let freeTimerInterval = null;
let userSessionType = null; // 'free' or 'premium'
let freeWifiSeconds = 12 * 60; // 12 Minutes = 720 seconds

function navigateTo(screenId) {
    closeDropdown();
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    if (screenId === 'screen-dashboard') {
        renderSubscriptionStack();
    }
}

/* Dropdown Navbar */
function toggleDropdown() {
    const menu = document.getElementById('dropdown-menu');
    menu.classList.toggle('show');
}

function closeDropdown() {
    const menu = document.getElementById('dropdown-menu');
    if (menu) menu.classList.remove('show');
}

function closeDropdownIfOpen(event) {
    if (!event.target.matches('.more-btn')) {
        closeDropdown();
    }
}

function logout() {
    userSessionType = null;
    navigateTo('screen-welcome');
}

/* Free Wi-Fi Flow (10s Ad + 12m Reverse Counter) */
function handleFreeWifi() {
    userSessionType = 'free';
    navigateTo('screen-ad');
    let timeLeft = 10; // 10-second Ad duration
    const timerElement = document.getElementById('ad-timer');
    timerElement.innerText = `Your internet session starts in ${timeLeft} sec`;
    
    const adCountdown = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            timerElement.innerText = `Your internet session starts in ${timeLeft} sec`;
        } else {
            clearInterval(adCountdown);
            timerElement.innerText = 'Your internet session starts in 10 sec';
            navigateTo('screen-connected');
            startFreeWifiTimer();
        }
    }, 1000);
}

function startFreeWifiTimer() {
    if (freeTimerInterval) clearInterval(freeTimerInterval);
    if (timerInterval) clearInterval(timerInterval);

    updateFreeWifiDisplay();
    freeTimerInterval = setInterval(() => {
        if (freeWifiSeconds > 0) {
            freeWifiSeconds--;
            updateFreeWifiDisplay();
        } else {
            clearInterval(freeTimerInterval);
            document.getElementById('session-timer').innerText = "EXPIRED";
        }
    }, 1000);
}

function updateFreeWifiDisplay() {
    const hours = Math.floor(freeWifiSeconds / 3600);
    const minutes = Math.floor((freeWifiSeconds % 3600) / 60);
    const seconds = freeWifiSeconds % 60;

    const formatted = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');

    document.getElementById('session-timer').innerText = formatted;
}

function handleGoToHome() {
    if (userSessionType === 'free') {
        navigateTo('screen-welcome');
    } else {
        navigateTo('screen-dashboard');
    }
}

/* Premium Payments & Stacking Logic */
function selectPackage(name, price, durationSeconds) {
    selectedPackageData = { name, price, durationSeconds };
    document.getElementById('bkash-amount-label').innerText = `Amount: ${price} Taka`;
    navigateTo('screen-bkash');
}

function processPayment() {
    if (!selectedPackageData) return;

    userSessionType = 'premium';

    purchasedSubscriptions.push({
        id: Date.now(),
        name: selectedPackageData.name,
        price: selectedPackageData.price,
        durationSeconds: selectedPackageData.durationSeconds,
        remainingSeconds: selectedPackageData.durationSeconds,
        isActivated: false
    });

    historyLogs.push({
        name: selectedPackageData.name,
        price: selectedPackageData.price,
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderHistory();

    navigateTo('screen-dashboard');
}

function renderSubscriptionStack() {
    const container = document.getElementById('subscription-container');
    
    if (purchasedSubscriptions.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 10px 0;">No active packages purchased yet.</p>`;
        return;
    }

    container.innerHTML = purchasedSubscriptions.map((sub, index) => {
        const isActivated = sub.isActivated;
        const btnClass = isActivated ? "sub-action-btn btn-connect" : "sub-action-btn btn-activate";
        const btnLabel = isActivated ? "Connect" : "Activate";
        const statusText = isActivated ? "Active Session Running" : "Ready for Activation";

        return `
            <div class="sub-card">
                <div class="sub-details">
                    <h4>${sub.name} | ${sub.price} Taka</h4>
                    <p>${statusText}</p>
                </div>
                <button class="${btnClass}" onclick="handleSubscriptionClick(${index})">${btnLabel}</button>
            </div>
        `;
    }).join('');
}

function handleSubscriptionClick(index) {
    userSessionType = 'premium';
    const targetSub = purchasedSubscriptions[index];

    // Show popup if trying to activate a second package while one is active
    if (activeSubscriptionIndex !== null && activeSubscriptionIndex !== index && targetSub.remainingSeconds > 0) {
        showModal("You already have an active package");
        return;
    }

    if (!targetSub.isActivated) {
        if (freeTimerInterval) clearInterval(freeTimerInterval);
        targetSub.isActivated = true;
        activeSubscriptionIndex = index;
        startReverseCounter(index);
    }

    renderSubscriptionStack();
    navigateTo('screen-connected');
}

function startReverseCounter(index) {
    if (timerInterval) clearInterval(timerInterval);

    updateTimerDisplay(index);
    timerInterval = setInterval(() => {
        const currentSub = purchasedSubscriptions[index];
        if (currentSub && currentSub.remainingSeconds > 0) {
            currentSub.remainingSeconds--;
            updateTimerDisplay(index);
        } else {
            clearInterval(timerInterval);
            if(currentSub) currentSub.isActivated = false;
            activeSubscriptionIndex = null;
            document.getElementById('session-timer').innerText = "EXPIRED";
            renderSubscriptionStack();
        }
    }, 1000);
}

function updateTimerDisplay(index) {
    const currentSub = purchasedSubscriptions[index];
    if (!currentSub) return;

    const total = currentSub.remainingSeconds;
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;

    const formatted = 
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0');

    document.getElementById('session-timer').innerText = formatted;
}

function renderHistory() {
    const historyContainer = document.getElementById('history-container');
    if (historyLogs.length === 0) {
        historyContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 20px 0;">No previous history found.</p>`;
        return;
    }

    historyContainer.innerHTML = historyLogs.map(item => `
        <div class="history-card">
            <div class="history-details">
                <h4>${item.name} Package</h4>
                <p>Purchased at ${item.date}</p>
            </div>
            <div style="font-weight: 700; color: var(--primary-yellow);">${item.price} Taka</div>
        </div>
    `).join('');
}

/* Modal Helpers */
function showModal(msg) {
    document.getElementById('modal-message').innerText = msg;
    document.getElementById('modal-alert').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-alert').classList.remove('active');
}
