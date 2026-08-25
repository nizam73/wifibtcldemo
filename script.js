let selectedPackageData = null;

function navigateTo(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function handleFreeWifi() {
    navigateTo('screen-ad');
    let timeLeft = 5;
    const timerElement = document.getElementById('ad-timer');
    
    const countdown = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft + 's';
        if (timeLeft <= 0) {
            clearInterval(countdown);
            navigateTo('screen-connected');
            timerElement.innerText = '5s';
        }
    }, 1000);
}

function selectPackage(name, price) {
    selectedPackageData = { name, price };
    document.getElementById('bkash-amount-label').innerText = `Amount: ${price} Taka`;
    navigateTo('screen-bkash');
}

function processPayment() {
    if(!selectedPackageData) return;

    const container = document.getElementById('subscription-container');
    
    container.innerHTML = `
        <div class="sub-card">
            <div class="sub-details">
                <h4>${selectedPackageData.name} | ${selectedPackageData.price} Taka</h4>
                <p>Details Active</p>
            </div>
            <button class="sub-action-btn" id="connect-pkg-btn" onclick="navigateTo('screen-connected')">Connect</button>
        </div>
    `;
    
    navigateTo('screen-dashboard');
}

function resetPortal() {
    selectedPackageData = null;
    document.getElementById('subscription-container').innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 10px 0;">No packages purchased yet.</p>
    `;
    navigateTo('screen-welcome');
}