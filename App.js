// Ініціалізація Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.enableClosingConfirmation();

// Застосування теми Telegram
document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e');
document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#aaaaaa');
document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#667eea');

// Глобальні змінні
let userData = {
    balance: 0,
    referralCount: 0,
    referralEarnings: 0,
    transactions: [],
    isBusinessConnected: false
};

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
    updateUI();
    startBalanceAnimation();
});

// Завантаження даних користувача
async function loadUserData() {
    try {
        // Отримання даних через API бота
        const initData = tg.initData;
        const response = await fetch(`/api/user-data?init_data=${initData}`);
        
        if (response.ok) {
            const data = await response.json();
            userData = {
                balance: data.balance || 0,
                referralCount: data.referral_count || 0,
                referralEarnings: data.referral_earnings || 0,
                transactions: data.transactions || [],
                isBusinessConnected: data.is_business_connected || false
            };
        } else {
            // Якщо сервер не відповідає, використовуємо тестові дані
            userData = {
                balance: 100,
                referralCount: 3,
                referralEarnings: 150,
                transactions: [
                    {
                        id: 1,
                        type: 'bonus',
                        title: 'Стартовий бонус',
                        amount: 100,
                        date: new Date().toISOString()
                    }
                ],
                isBusinessConnected: false
            };
        }
    } catch (error) {
        console.error('Помилка завантаження даних:', error);
        tg.showAlert('Помилка завантаження даних. Спробуйте пізніше.');
    }
}

// Оновлення інтерфейсу
function updateUI() {
    // Оновлення балансу
    const balanceEl = document.getElementById('balance');
    if (balanceEl) {
        animateNumber(balanceEl, 0, userData.balance, 1000);
    }
    
    // Оновлення реферальної статистики
    const refCountEl = document.getElementById('referralCount');
    const refEarningsEl = document.getElementById('referralEarnings');
    
    if (refCountEl) refCountEl.textContent = userData.referralCount;
    if (refEarningsEl) refEarningsEl.textContent = `${userData.referralEarnings} ⭐`;
    
    // Оновлення статусу підключення
    updateConnectionStatus();
    
    // Оновлення транзакцій
    updateTransactionsList();
}

// Анімація числа
function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Анімація балансу при завантаженні
function startBalanceAnimation() {
    const balanceAmount = document.querySelector('.balance-amount');
    if (balanceAmount) {
        balanceAmount.style.animation = 'pulse 2s ease-in-out infinite';
    }
}

// Оновлення статусу підключення бізнес-аккаунту
function updateConnectionStatus() {
    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) return;
    
    const badge = statusEl.querySelector('.status-badge');
    if (userData.isBusinessConnected) {
        badge.textContent = 'Підключено';
        badge.classList.remove('disconnected');
        badge.classList.add('connected');
    } else {
        badge.textContent = 'Не підключено';
        badge.classList.remove('connected');
        badge.classList.add('disconnected');
    }
}

// Оновлення списку транзакцій
function updateTransactionsList() {
    const listEl = document.getElementById('transactionsList');
    if (!listEl) return;
    
    if (userData.transactions.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">Поки що немає операцій</div>
            </div>
        `;
        return;
    }
    
    // Відображаємо останні 5 транзакцій
    const recentTransactions = userData.transactions.slice(0, 5);
    listEl.innerHTML = recentTransactions.map(tx => createTransactionItem(tx)).join('');
}

// Створення елемента транзакції
function createTransactionItem(transaction) {
    const icons = {
        bonus: '🎁',
        purchase: '💳',
        withdrawal: '💸',
        referral: '👥',
        check: '📨',
        transfer: '💫'
    };
    
    const icon = icons[transaction.type] || '💰';
    const isPositive = transaction.amount > 0;
    const amountClass = isPositive ? 'positive' : 'negative';
    const sign = isPositive ? '+' : '-';
    
    const date = new Date(transaction.date);
    const formattedDate = date.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon">${icon}</div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.title}</div>
                    <div class="transaction-date">${formattedDate}</div>
                </div>
            </div>
            <div class="transaction-amount ${amountClass}">
                ${sign}${Math.abs(transaction.amount)} ⭐
            </div>
        </div>
    `;
}

// Відкрити магазин
function openShop() {
    tg.showPopup({
        title: '🛒 Магазин',
        message: 'Виберіть пакет для покупки:\n\n💎 100 ⭐ - 50₴\n💎 500 ⭐ - 200₴\n💎 1000 ⭐ - 350₴',
        buttons: [
            {id: 'buy_100', type: 'default', text: '100 ⭐'},
            {id: 'buy_500', type: 'default', text: '500 ⭐'},
            {id: 'buy_1000', type: 'default', text: '1000 ⭐'},
            {type: 'cancel'}
        ]
    }, (buttonId) => {
        if (buttonId.startsWith('buy_')) {
            const amount = buttonId.split('_')[1];
            purchaseStars(amount);
        }
    });
}

// Купівля зірок
function purchaseStars(amount) {
    tg.sendData(JSON.stringify({
        action: 'purchase',
        amount: parseInt(amount)
    }));
    tg.showAlert(`Обробка покупки ${amount} зірок...`);
}

// Виведення зірок
function withdraw() {
    if (userData.balance < 100) {
        tg.showAlert('Мінімальна сума для виведення - 100 ⭐');
        return;
    }
    
    tg.showPopup({
        title: '💸 Виведення зірок',
        message: `Ваш баланс: ${userData.balance} ⭐\n\nДля виведення необхідно зареєструватись на Fragment.\n\nКомісія: 10%`,
        buttons: [
            {id: 'open_fragment', type: 'default', text: 'Перейти на Fragment'},
            {id: 'confirm_withdraw', type: 'default', text: 'Я зареєстрований'},
            {type: 'cancel'}
        ]
    }, (buttonId) => {
        if (buttonId === 'open_fragment') {
            tg.openLink('https://fragment.com');
        } else if (buttonId === 'confirm_withdraw') {
            processWithdrawal();
        }
    });
}

// Обробка виведення
function processWithdrawal() {
    tg.sendData(JSON.stringify({
        action: 'withdraw',
        amount: userData.balance
    }));
}

// Створення чеку
function createCheck() {
    tg.showPopup({
        title: '🎁 Створити чек',
        message: 'Введіть суму чеку (максимум 10000 ⭐)',
        buttons: [
            {id: 'check_100', type: 'default', text: '100 ⭐'},
            {id: 'check_500', type: 'default', text: '500 ⭐'},
            {id: 'check_1000', type: 'default', text: '1000 ⭐'},
            {type: 'cancel'}
        ]
    }, (buttonId) => {
        if (buttonId.startsWith('check_')) {
            const amount = parseInt(buttonId.split('_')[1]);
            if (userData.balance < amount) {
                tg.showAlert('Недостатньо коштів на балансі');
                return;
            }
            
            tg.sendData(JSON.stringify({
                action: 'create_check',
                amount: amount
            }));
        }
    });
}

// Показати історію
function showHistory() {
    tg.sendData(JSON.stringify({
        action: 'show_history'
    }));
}

// Поділитись реферальним посиланням
function shareReferral() {
    const userId = tg.initDataUnsafe?.user?.id;
    const botUsername = 'YourBotUsername'; // Замініть на username вашого бота
    const referralLink = `https://t.me/${botUsername}?start=ref${userId}`;
    
    const shareText = `🌟 Приєднуйся до SendCheck!\n\nОтримай 50 зірок за реєстрацію!\n${referralLink}`;
    
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`);
}

// Підключити бізнес-аккаунт
function connectBusiness() {
    tg.showPopup({
        title: '🔗 Підключення',
        message: 'Для підключення бізнес-аккаунту:\n\n1. Відкрийте налаштування бота\n2. Виберіть "Business Connection"\n3. Підключіть свій аккаунт',
        buttons: [
            {id: 'open_settings', type: 'default', text: 'Відкрити налаштування'},
            {type: 'cancel'}
        ]
    }, (buttonId) => {
        if (buttonId === 'open_settings') {
            tg.close();
        }
    });
}

// Додати CSS анімацію
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);
