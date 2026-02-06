/**
 * Personal Finance Tracker Logic
 * Using LocalStorage to simulate backend database
 */

// --- State Management ---
// Use relative path since we are serving this file from the same server
const API_URL = '/api';

const App = {
    data: {
        currentUser: JSON.parse(localStorage.getItem('lumina_current_user')) || null,
        categories: [
            { id: 1, name: 'Salary', type: 'income', icon: 'fa-money-bill-wave' },
            { id: 2, name: 'Freelance', type: 'income', icon: 'fa-laptop' },
            { id: 3, name: 'Investment', type: 'income', icon: 'fa-chart-line' },
            { id: 4, name: 'Groceries', type: 'expense', icon: 'fa-shopping-basket' },
            { id: 5, name: 'Rent', type: 'expense', icon: 'fa-home' },
            { id: 6, name: 'Utilities', type: 'expense', icon: 'fa-bolt' },
            { id: 7, name: 'Entertainment', type: 'expense', icon: 'fa-film' },
            { id: 8, name: 'Transportation', type: 'expense', icon: 'fa-bus' },
            { id: 9, name: 'Health', type: 'expense', icon: 'fa-heartbeat' }
        ]
    },

    // Auth Methods
    async register(username, email, password) {
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            return data;
        } catch (err) {
            throw new Error('Network/Server Error: ' + err.message);
        }
    },

    async login(email, password) {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');

            this.data.currentUser = data;
            localStorage.setItem('lumina_current_user', JSON.stringify(data));
            return data;
        } catch (err) {
            throw new Error('Network/Server Error: ' + err.message);
        }
    },

    async updateProfile(username, email, password) {
        try {
            const body = { username, email };
            if (password) body.password = password;

            const res = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': this.data.currentUser.id
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');

            this.data.currentUser = { ...this.data.currentUser, ...data };
            localStorage.setItem('lumina_current_user', JSON.stringify(this.data.currentUser));
            return data;
        } catch (err) {
            throw new Error('Network/Server Error: ' + err.message);
        }
    },

    logout() {
        this.data.currentUser = null;
        localStorage.removeItem('lumina_current_user');
    },

    // Transaction Methods
    async addTransaction(transaction) {
        const res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': this.data.currentUser.id
            },
            body: JSON.stringify(transaction)
        });
        if (!res.ok) throw new Error('Failed to add transaction');
        return await res.json();
    },

    async deleteTransaction(id) {
        await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: { 'user-id': this.data.currentUser.id }
        });
    },

    async getTransactions() {
        if (!this.data.currentUser) return [];
        const res = await fetch(`${API_URL}/transactions`, {
            headers: { 'user-id': this.data.currentUser.id }
        });
        return await res.json();
    },

    // Budget Methods
    async setBudget(categoryId, limit) {
        await fetch(`${API_URL}/budgets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'user-id': this.data.currentUser.id
            },
            body: JSON.stringify({ categoryId, limit })
        });
    },

    async getBudgets() {
        if (!this.data.currentUser) return [];
        const res = await fetch(`${API_URL}/budgets`, {
            headers: { 'user-id': this.data.currentUser.id }
        });
        return await res.json();
    }
};

// --- UI Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    checkAuth();
    setupEventListeners();

    // Set Date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
});

function checkAuth() {
    if (App.data.currentUser) {
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('auth-view').classList.remove('hidden');
    document.getElementById('app-view').classList.add('hidden');
}

function showApp() {
    document.getElementById('auth-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');
    document.getElementById('nav-username').textContent = App.data.currentUser.username;

    // Initial Load
    refreshDashboard();
    renderTransactionsTable();
    renderBudgets();
}

function setupEventListeners() {
    // Auth Forms
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Login submitted");
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        try {
            console.log("Attempting login...");
            await App.login(email, pass);
            console.log("Login success");
            showApp();
        } catch (err) {
            console.error("Login error:", err);
            alert("Login Error: " + err.message);
        }
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Register submitted");
        const user = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-password').value;
        try {
            console.log("Attempting register...");
            await App.register(user, email, pass);
            alert('Registration Successful! Please sign in.');
            document.getElementById('show-login').click();
        } catch (err) {
            console.error("Register error:", err);
            alert("Register Error: " + err.message);
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        App.logout();
        showAuth();
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            // Update Nav State
            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Switch View
            const viewId = btn.dataset.view;
            switchView(viewId);
        });
    });

    // Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    document.getElementById('add-transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('t-type').value;
        const amount = parseFloat(document.getElementById('t-amount').value);
        const categoryId = parseInt(document.getElementById('t-category').value);
        const date = document.getElementById('t-date').value;
        const desc = document.getElementById('t-desc').value;

        await App.addTransaction({ type, amount, categoryId, date, description: desc });

        closeModal();
        e.target.reset();
        refreshAll();
    });

    document.getElementById('add-budget-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const categoryId = parseInt(document.getElementById('b-category').value);
        const limit = parseFloat(document.getElementById('b-limit').value);

        await App.setBudget(categoryId, limit);
        closeModal();
        e.target.reset();
        refreshAll();
    });

    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('p-username').value;
        const email = document.getElementById('p-email').value;
        const password = document.getElementById('p-password').value;

        try {
            await App.updateProfile(username, email, password);
            alert('Profile Updated Successfully!');
            closeModal();
            showApp(); // Refresh UI with new name
        } catch (err) {
            alert('Update Error: ' + err.message);
        }
    });
}

// --- Helpers ---
function switchView(viewId) {
    document.querySelectorAll('.content-view').forEach(v => v.classList.add('hidden'));
    document.getElementById(viewId).classList.remove('hidden');

    // Refresh specific section data
    if (viewId === 'dashboard') refreshDashboard();
    if (viewId === 'transactions') renderTransactionsTable();
    if (viewId === 'budgets') renderBudgets();
}

function refreshAll() {
    refreshDashboard();
    renderTransactionsTable();
    renderBudgets();
}

function getCategory(id) {
    return App.data.categories.find(c => c.id == id) || { name: 'Unknown', icon: 'fa-question' };
}

// --- Dashboard Logic ---
async function refreshDashboard() {
    const transactions = await App.getTransactions();

    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
    });

    const balance = income - expense;

    // Animate Numbers
    animateValue('dash-income', income);
    animateValue('dash-expense', expense);
    animateValue('dash-balance', balance);

    // Render Recent Transactions
    const recentList = document.getElementById('recent-transactions-list');
    recentList.innerHTML = '';

    transactions.slice(0, 4).forEach(t => {
        const cat = getCategory(t.categoryId);
        const div = document.createElement('div');
        div.className = 'transaction-row';
        div.innerHTML = `
            <div style="display:flex; align-items:center">
                <div class="t-icon"><i class="fas ${cat.icon}"></i></div>
                <div class="t-info">
                    <span class="t-title">${t.description || cat.name}</span>
                    <span class="t-date">${new Date(t.date).toLocaleDateString()}</span>
                </div>
            </div>
            <span class="t-amount ${t.type}">${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}</span>
        `;
        recentList.appendChild(div);
    });

    // Render Budget Summary (Compact)
    await renderBudgetList(document.getElementById('budget-summary-container'), true);
}

function animateValue(id, end) {
    const obj = document.getElementById(id);
    const start = 0; // Simple animation, always from 0 for demo
    const duration = 1000;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = `₹${(progress * end).toFixed(2)}`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// --- Transactions Logic ---
async function renderTransactionsTable() {
    const tbody = document.getElementById('all-transactions-body');
    tbody.innerHTML = '';
    const transactions = await App.getTransactions();

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No transactions found.</td></tr>';
        return;
    }

    transactions.forEach(t => {
        const cat = getCategory(t.categoryId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div style="display:flex; align-items:center; gap:0.8rem;">
                    <i class="fas ${cat.icon}" style="color:var(--text-muted)"></i>
                    ${cat.name}
                </div>
            </td>
            <td>${new Date(t.date).toLocaleDateString()}</td>
            <td>${t.description || '-'}</td>
            <td class="t-amount ${t.type}">₹${t.amount.toFixed(2)}</td>
            <td><i class="fas fa-trash icon-delete" onclick="deleteItem(${t.id})"></i></td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteItem(id) {
    if (confirm('Delete this transaction?')) {
        await App.deleteTransaction(id);
        refreshAll();
    }
}
window.deleteItem = deleteItem; // Expose to global scope for onclick

function openTransactionModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('transaction-modal');
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
    document.getElementById('t-date').valueAsDate = new Date();
    updateCategories(); // Init categories
}
window.openTransactionModal = openTransactionModal;

function updateCategories() {
    const type = document.getElementById('t-type').value;
    const select = document.getElementById('t-category');
    select.innerHTML = '';
    App.data.categories.filter(c => c.type === type).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}
window.updateCategories = updateCategories;

// --- Budget Logic ---
function openBudgetModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('budget-modal');
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    // Populate Categories (Expense only)
    const select = document.getElementById('b-category');
    select.innerHTML = '';
    App.data.categories.filter(c => c.type === 'expense').forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}
window.openBudgetModal = openBudgetModal;

window.openBudgetModal = openBudgetModal;

function openProfileModal() {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('profile-modal');
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    const user = App.data.currentUser;
    document.getElementById('p-username').value = user.username;
    document.getElementById('p-email').value = user.email;
    document.getElementById('p-password').value = '';
}
window.openProfileModal = openProfileModal;

async function renderBudgets() {
    const grid = document.getElementById('all-budgets-grid');
    grid.innerHTML = '';
    await renderBudgetList(grid, false);
}

async function renderBudgetList(container, isCompact) {
    const budgets = await App.getBudgets();
    const transactions = await App.getTransactions(); // Need all to calculate spent

    container.innerHTML = '';

    if (budgets.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding:1rem;">No budgets set. click "Set Budget" to start.</div>';
        return;
    }

    budgets.forEach(b => {
        const cat = getCategory(b.categoryId);
        // Calculate spent for this category (All time for demo simplicty, usually monthly)
        const spent = transactions
            .filter(t => t.categoryId === b.categoryId)
            .reduce((sum, t) => sum + t.amount, 0);

        const percent = Math.min((spent / b.limit) * 100, 100);
        let color = '#34d399'; // Green
        if (percent > 70) color = '#fbbf24'; // Yellow
        if (percent > 90) color = '#f87171'; // Red

        const el = document.createElement('div');
        el.className = isCompact ? 'budget-item' : 'glass-card budget-card animate-up';

        if (isCompact) {
            el.innerHTML = `
                <div class="budget-top">
                    <span class="b-category">${cat.name}</span>
                    <span class="b-amount">₹${spent.toFixed(0)} / ₹${b.limit}</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${percent}%; background: ${color}"></div>
                </div>
            `;
        } else {
            el.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:1rem;">
                    <div style="display:flex; align-items:center; gap:0.8rem;">
                        <div class="t-icon"><i class="fas ${cat.icon}"></i></div>
                        <h3>${cat.name}</h3>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:1.2rem; font-weight:600;">₹${spent.toFixed(2)}</span>
                        <div style="color:var(--text-muted); font-size:0.8rem;">of ₹${b.limit}</div>
                    </div>
                </div>
                <div class="progress-track" style="height:10px;">
                    <div class="progress-fill" style="width: ${percent}%; background: ${color}"></div>
                </div>
                <p style="margin-top:0.8rem; font-size:0.9rem; color:var(--text-muted);">${(100 - percent).toFixed(0)}% remaining</p>
            `;
        }
        container.appendChild(el);
    });
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}
window.closeModal = closeModal;
