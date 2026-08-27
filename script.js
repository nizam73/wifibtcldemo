let selectedPackageData = null;
let purchasedSubscriptions = [];
let activeSubscriptionIndex = null;
let historyLogs = [];
let timerInterval = null;
let freeTimerInterval = null;
let userSessionType = null; // 'free' or 'premium'
let freeWifiSeconds = 12 * 60; // 12 Minutes

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

/* Free Wi-Fi Flow */
function handleFreeWifi() {
    userSessionType = 'free';
    navigateTo('screen-ad');
    let timeLeft = 10;
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
    const purchaseTimeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    purchasedSubscriptions.push({
        id: Date.now(),
        name: selectedPackageData.name,
        price: selectedPackageData.price,
        durationSeconds: selectedPackageData.durationSeconds,
        remainingSeconds: selectedPackageData.durationSeconds,
        purchaseTime: purchaseTimeString,
        isActivated: false
    });

    historyLogs.push({
        name: selectedPackageData.name,
        price: selectedPackageData.price,
        date: purchaseTimeString
    });
    renderHistory();

    navigateTo('screen-dashboard');
}

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return (
        String(hours).padStart(2, '0') + ':' +
        String(minutes).padStart(2, '0') + ':' +
        String(seconds).padStart(2, '0')
    );
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

        return `
            <div class="sub-card">
                <div class="sub-card-top">
                    <span class="sub-title">${sub.name} | ${sub.price} Taka</span>
                    <span class="sub-timer" id="sub-timer-${index}">${formatTime(sub.remainingSeconds)}</span>
                </div>
                <div class="sub-card-bottom">
                    <span class="sub-details-text" onclick="showPackageDetails(${index})">Details</span>
                    <button class="${btnClass}" onclick="handleSubscriptionClick(${index})">${btnLabel}</button>
                </div>
            </div>
        `;
    }).join('');
}

function handleSubscriptionClick(index) {
    userSessionType = 'premium';
    const targetSub = purchasedSubscriptions[index];

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

    const formatted = formatTime(currentSub.remainingSeconds);
    
    // Update main connection page counter
    document.getElementById('session-timer').innerText = formatted;

    // Update in-card timer if visible
    const cardTimerEl = document.getElementById(`sub-timer-${index}`);
    if (cardTimerEl) {
        cardTimerEl.innerText = formatted;
    }
}

/* Package Details Modal View */
function showPackageDetails(index) {
    const sub = purchasedSubscriptions[index];
    if (!sub) return;

    document.getElementById('detail-name').innerText = sub.name;
    document.getElementById('detail-price').innerText = `${sub.price} Taka`;
    document.getElementById('detail-time').innerText = sub.purchaseTime;
    document.getElementById('detail-duration').innerText = formatTime(sub.durationSeconds);
    document.getElementById('detail-status').innerText = sub.isActivated ? "Active & Running" : "Not Activated";
    document.getElementById('detail-remaining').innerText = formatTime(sub.remainingSeconds);

    document.getElementById('modal-details').classList.add('active');
}

function closeDetailsModal() {
    document.getElementById('modal-details').classList.remove('active');
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
