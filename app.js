// State Management
let transactions = [];
let savingsGoals = [];
let budgets = [];
let activeTab = 'dashboard';
let userEmail = '';

// Charts references
let categoryChart = null;
let trendChart = null;

// Form State
let selectedFormType = 'expense';
let authAction = 'login'; // 'login' or 'register'

// Filters & Sorting state
let filterState = {
    search: '',
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: ''
};
let sortState = {
    key: 'date',
    direction: 'desc'
};

// Category constants
const CATEGORIES = {
    income: ['Salary', 'Investments', 'Side Hustle', 'Funding', 'Other'],
    expense: ['Food', 'Rent', 'Utilities', 'Entertainment', 'Shopping', 'Travel', 'Other']
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    
    // Check if user is logged in
    checkAuthSession();
    
    // Default dates for form
    document.getElementById('tx-date').valueAsDate = new Date();
    
    // Set up event listeners for inputs
    setupEventListeners();
});

function setupEventListeners() {
    // Real-time filtering listeners
    document.getElementById('search-input').addEventListener('input', (e) => {
        filterState.search = e.target.value;
        renderTransactionsTable();
    });
    
    document.getElementById('filter-type').addEventListener('change', (e) => {
        filterState.type = e.target.value;
        renderTransactionsTable();
    });
    
    document.getElementById('filter-category').addEventListener('change', (e) => {
        filterState.category = e.target.value;
        renderTransactionsTable();
    });
    
    document.getElementById('filter-start-date').addEventListener('change', (e) => {
        filterState.startDate = e.target.value;
        renderTransactionsTable();
    });
    
    document.getElementById('filter-end-date').addEventListener('change', (e) => {
        filterState.endDate = e.target.value;
        renderTransactionsTable();
    });
}

// Check Authentication local state
function checkAuthSession() {
    const savedEmail = localStorage.getItem('finflow_email');
    const loginScreen = document.getElementById('login-screen');
    
    if (savedEmail) {
        userEmail = savedEmail;
        loginScreen.classList.add('hidden');
        
        // Update user profile info
        updateUserProfileDisplay();
        
        // Load user data
        loadAllData();
    } else {
        loginScreen.classList.remove('hidden');
    }
}

// Update Profile sidebar display
function updateUserProfileDisplay() {
    document.getElementById('user-profile-email').innerText = userEmail;
    
    // Set first letter of email as avatar character
    const avatar = document.getElementById('user-profile-avatar');
    if (avatar && userEmail) {
        avatar.innerText = userEmail.charAt(0).toUpperCase();
    }
}

// Helper for API Headers
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail
    };
}

// Fetch all scoped resources
async function loadAllData() {
    try {
        await Promise.all([
            fetchTransactions(),
            fetchSavingsGoals(),
            fetchBudgets(),
            fetchDashboardSummary()
        ]);
        
        // Populate category filters dropdown
        populateCategoryFilters();
        
        // Render content
        refreshActiveTab();
    } catch (err) {
        console.error("Error loading data: ", err);
    }
}

// API Fetching Functions
async function fetchTransactions() {
    const res = await fetch('/api/transactions', { headers: getHeaders() });
    if (res.status === 401) return handleLogout();
    transactions = await res.json();
}

async function fetchSavingsGoals() {
    const res = await fetch('/api/savings_goals', { headers: getHeaders() });
    if (res.status === 401) return handleLogout();
    savingsGoals = await res.json();
}

async function fetchBudgets() {
    const res = await fetch('/api/budgets', { headers: getHeaders() });
    if (res.status === 401) return handleLogout();
    budgets = await res.json();
}

async function fetchDashboardSummary() {
    const res = await fetch('/api/dashboard/summary', { headers: getHeaders() });
    if (res.status === 401) return handleLogout();
    const data = await res.json();
    
    // Update summary metrics
    document.getElementById('stat-income').innerText = formatCurrency(data.summary.total_income);
    document.getElementById('stat-expenses').innerText = formatCurrency(data.summary.total_expense);
    document.getElementById('stat-balance').innerText = formatCurrency(data.summary.net_balance);
    document.getElementById('stat-goals').innerText = data.summary.active_goals_count;
    
    // Render charts
    renderCategoryChart(data.category_spending);
    renderTrendChart(data.monthly_trend);
    
    // Update recent transactions list on Dashboard
    renderRecentTransactions();
}

// Navigation / View Switching
function switchTab(tabId) {
    const tabs = ['dashboard', 'transactions', 'budgets', 'goals'];
    tabs.forEach(t => {
        const btn = document.getElementById(`nav-${t}`);
        const view = document.getElementById(`view-${t}`);
        
        if (t === tabId) {
            btn.classList.add('active');
            view.classList.remove('hidden');
            view.classList.add('block');
        } else {
            btn.classList.remove('active');
            view.classList.remove('block');
            view.classList.add('hidden');
        }
    });

    activeTab = tabId;
    
    const titles = {
        dashboard: 'Dashboard',
        transactions: 'Transactions Ledger',
        budgets: 'Monthly Budgets & Alerts',
        goals: 'Savings & Funding Targets'
    };
    document.getElementById('page-title').innerText = titles[tabId];
    
    refreshActiveTab();
}

function refreshActiveTab() {
    if (activeTab === 'dashboard') {
        fetchDashboardSummary();
    } else if (activeTab === 'transactions') {
        renderTransactionsTable();
    } else if (activeTab === 'budgets') {
        renderBudgetsView();
    } else if (activeTab === 'goals') {
        renderGoalsView();
    }
}

// Helper: Format currency representation (INR)
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Render Recent Transactions (Dashboard)
function renderRecentTransactions() {
    const listElement = document.getElementById('recent-transactions-list');
    listElement.innerHTML = '';
    
    const topRecent = transactions.slice(0, 5);
    
    if (topRecent.length === 0) {
        listElement.innerHTML = `
            <tr>
                <td colspan="5" class="py-4 text-center text-slate-500 text-xs">No records available</td>
            </tr>
        `;
        return;
    }
    
    topRecent.forEach(t => {
        const isExpense = t.type === 'expense';
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-800/10 border-b border-slate-800/30";
        row.innerHTML = `
            <td class="py-3 px-4 text-slate-400 text-xs font-medium">${t.date}</td>
            <td class="py-3 px-4">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold ${isExpense ? 'text-rose-400' : 'text-emerald-400'}">
                    <span class="w-1.5 h-1.5 rounded-full ${isExpense ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
                    ${t.category}
                </span>
            </td>
            <td class="py-3 px-4 text-slate-400 text-xs">${t.payment_method}</td>
            <td class="py-3 px-4 text-slate-300 text-xs truncate max-w-[200px]" title="${t.notes || ''}">${t.notes || '-'}</td>
            <td class="py-3 px-4 text-right font-semibold text-xs ${isExpense ? 'text-rose-400' : 'text-emerald-400'}">
                ${isExpense ? '-' : '+'}${formatCurrency(t.amount)}
            </td>
        `;
        listElement.appendChild(row);
    });
}

// Populate Category Filter select
function populateCategoryFilters() {
    const filterSelect = document.getElementById('filter-category');
    filterSelect.innerHTML = '<option value="all">All Categories</option>';
    
    const allCategories = new Set([...CATEGORIES.income, ...CATEGORIES.expense]);
    allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        filterSelect.appendChild(opt);
    });
}

// Render Transactions Ledger Table
function renderTransactionsTable() {
    const listElement = document.getElementById('transactions-list');
    const emptyElement = document.getElementById('transactions-empty');
    listElement.innerHTML = '';
    
    let filtered = transactions.filter(t => {
        const searchLower = filterState.search.toLowerCase();
        const matchesSearch = !filterState.search || 
            t.category.toLowerCase().includes(searchLower) || 
            (t.notes && t.notes.toLowerCase().includes(searchLower)) ||
            t.amount.toString().includes(searchLower);
            
        const matchesType = filterState.type === 'all' || t.type === filterState.type;
        const matchesCategory = filterState.category === 'all' || t.category === filterState.category;
        const matchesStartDate = !filterState.startDate || t.date >= filterState.startDate;
        const matchesEndDate = !filterState.endDate || t.date <= filterState.endDate;
        
        return matchesSearch && matchesType && matchesCategory && matchesStartDate && matchesEndDate;
    });
    
    filtered.sort((a, b) => {
        let valA = a[sortState.key];
        let valB = b[sortState.key];
        
        if (sortState.key === 'amount') {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        } else {
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
        }
        
        if (valA < valB) return sortState.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    updateSortIcons();
    
    if (filtered.length === 0) {
        emptyElement.classList.remove('hidden');
        return;
    }
    
    emptyElement.classList.add('hidden');
    
    filtered.forEach(t => {
        const isExpense = t.type === 'expense';
        const row = document.createElement('tr');
        row.className = "hover:bg-slate-800/20 border-b border-slate-800/40 transition duration-150";
        row.innerHTML = `
            <td class="py-4 px-6 text-slate-300 text-xs font-semibold">${t.date}</td>
            <td class="py-4 px-6">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${isExpense ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
                    ${t.type.toUpperCase()}
                </span>
            </td>
            <td class="py-4 px-6 text-slate-200 text-xs font-medium">${t.category}</td>
            <td class="py-4 px-6 text-slate-400 text-xs">${t.payment_method}</td>
            <td class="py-4 px-6 text-slate-300 text-xs max-w-[220px] truncate" title="${t.notes || ''}">${t.notes || '-'}</td>
            <td class="py-4 px-6 text-right font-display font-bold text-sm ${isExpense ? 'text-rose-400' : 'text-emerald-400'}">
                ${isExpense ? '-' : '+'}${formatCurrency(t.amount)}
            </td>
            <td class="py-4 px-6 text-center">
                <div class="flex items-center justify-center gap-2">
                    <button onclick="openTransactionModal(${JSON.stringify(t).replace(/"/g, '&quot;')})" class="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition" title="Edit">
                        <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                    </button>
                    <button onclick="deleteTransaction(${t.id})" class="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition" title="Delete">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </td>
        `;
        listElement.appendChild(row);
    });
    
    lucide.createIcons();
}

function setSort(key) {
    if (sortState.key === key) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.key = key;
        sortState.direction = 'asc';
    }
    renderTransactionsTable();
}

function updateSortIcons() {
    const keys = ['date', 'type', 'category', 'payment_method', 'amount'];
    keys.forEach(k => {
        const icon = document.getElementById(`sort-${k}-icon`);
        if (!icon) return;
        
        if (sortState.key === k) {
            icon.className = `w-3.5 h-3.5 text-emerald-400 ${sortState.direction === 'asc' ? 'rotate-180' : ''}`;
        } else {
            icon.className = "w-3.5 h-3.5 text-slate-500";
        }
    });
}

function clearFilters() {
    filterState = {
        search: '',
        type: 'all',
        category: 'all',
        startDate: '',
        endDate: ''
    };
    
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = 'all';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    
    renderTransactionsTable();
}

// Render Budgets progress View
function renderBudgetsView() {
    const grid = document.getElementById('budgets-progress-grid');
    const emptyElement = document.getElementById('budgets-empty');
    grid.innerHTML = '';
    
    if (budgets.length === 0) {
        emptyElement.classList.remove('hidden');
        return;
    }
    
    emptyElement.classList.add('hidden');
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const categoryExpenses = {};
    transactions.forEach(t => {
        if (t.type === 'expense' && t.date.startsWith(currentMonth)) {
            categoryExpenses[t.category] = (categoryExpenses[t.category] || 0.0) + t.amount;
        }
    });
    
    budgets.forEach(b => {
        const spent = categoryExpenses[b.category] || 0.0;
        const limit = b.limit_amount;
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        
        let barColor = 'bg-emerald-500';
        let textColor = 'text-emerald-400';
        let bgGlow = 'from-emerald-500/5 to-teal-500/5';
        let borderHighlight = 'border-slate-800/80';
        
        if (pct > 100) {
            barColor = 'bg-rose-500 animate-pulse';
            textColor = 'text-rose-400';
            bgGlow = 'from-rose-500/5 to-red-500/5';
            borderHighlight = 'border-rose-500/30';
        } else if (pct > 70) {
            barColor = 'bg-amber-500';
            textColor = 'text-amber-400';
            bgGlow = 'from-amber-500/5 to-yellow-500/5';
            borderHighlight = 'border-amber-500/20';
        }
        
        const card = document.createElement('div');
        card.className = `card p-6 bg-gradient-to-tr ${bgGlow} border ${borderHighlight} backdrop-blur-md rounded-2xl relative overflow-hidden flex flex-col justify-between`;
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-4">
                    <h5 class="font-display font-bold text-base text-white">${b.category}</h5>
                    <div class="flex items-center gap-1.5">
                        <button onclick="editBudget(${JSON.stringify(b).replace(/"/g, '&quot;')})" class="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition" title="Modify Limit">
                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="deleteBudget(${b.id})" class="p-1 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-md transition" title="Delete">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex items-baseline justify-between mb-2">
                    <span class="text-xs text-slate-400">Spent this month</span>
                    <span class="text-xs font-semibold ${textColor}">${pct.toFixed(0)}% Used</span>
                </div>
                
                <div class="flex items-baseline justify-between mb-4">
                    <span class="font-display text-lg font-bold text-white">${formatCurrency(spent)}</span>
                    <span class="text-xs text-slate-500">of ${formatCurrency(limit)} Limit</span>
                </div>
            </div>
            
            <div>
                <div class="w-full bg-slate-950/60 rounded-full h-2 overflow-hidden border border-slate-800/40">
                    <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${Math.min(pct, 100)}%"></div>
                </div>
                ${pct > 100 ? `<p class="text-[10px] text-rose-400 font-medium mt-2 flex items-center gap-1">
                    <i data-lucide="alert-triangle" class="w-3 h-3"></i> Budget Limit Exceeded!
                </p>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
    
    lucide.createIcons();
}

// Render Goals view
function renderGoalsView() {
    const grid = document.getElementById('goals-grid');
    const emptyElement = document.getElementById('goals-empty');
    grid.innerHTML = '';
    
    if (savingsGoals.length === 0) {
        emptyElement.classList.remove('hidden');
        return;
    }
    
    emptyElement.classList.add('hidden');
    
    savingsGoals.forEach(g => {
        const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0;
        
        const card = document.createElement('div');
        card.className = "card p-6 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl flex flex-col justify-between h-[230px]";
        card.innerHTML = `
            <div>
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                            <i data-lucide="target" class="w-4 h-4"></i>
                        </div>
                        <h5 class="font-display font-bold text-base text-white">${g.name}</h5>
                    </div>
                    <div class="flex items-center gap-1">
                        <button onclick="openGoalProgressModal(${g.id}, ${g.current_amount})" class="p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition" title="Quick Update Progress">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i>
                        </button>
                        <button onclick="editGoal(${JSON.stringify(g).replace(/"/g, '&quot;')})" class="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition" title="Edit details">
                            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
                        </button>
                        <button onclick="deleteGoal(${g.id})" class="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition" title="Delete">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex items-baseline justify-between mb-1">
                    <span class="text-xs text-slate-400">Target goal progress</span>
                    <span class="text-xs font-semibold text-emerald-400">${pct.toFixed(0)}%</span>
                </div>
                
                <div class="flex items-baseline justify-between mb-4">
                    <span class="font-display text-lg font-bold text-white">${formatCurrency(g.current_amount)}</span>
                    <span class="text-xs text-slate-500">of ${formatCurrency(g.target_amount)}</span>
                </div>
            </div>
            
            <div>
                <div class="w-full bg-slate-950/60 rounded-full h-2.5 overflow-hidden border border-slate-800/40">
                    <div class="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500" style="width: ${Math.min(pct, 100)}%"></div>
                </div>
                <div class="flex justify-between items-center mt-2.5">
                    <span class="text-[10px] text-slate-500 font-medium">Target Date:</span>
                    <span class="text-[10px] text-slate-300 font-semibold">${g.target_date}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    lucide.createIcons();
}

// TRANSACTION MODAL EVENTS (Modals open/close bug fix applied by toggling both active and hidden classes)
function openTransactionModal(tx = null) {
    const modal = document.getElementById('transaction-modal');
    const form = document.getElementById('transaction-form');
    
    form.reset();
    document.getElementById('tx-date').valueAsDate = new Date();
    
    if (tx) {
        document.getElementById('tx-modal-title').innerText = "Edit Transaction";
        document.getElementById('tx-id').value = tx.id;
        document.getElementById('tx-amount').value = tx.amount;
        document.getElementById('tx-date').value = tx.date;
        document.getElementById('tx-notes').value = tx.notes || '';
        document.getElementById('tx-payment-method').value = tx.payment_method;
        setFormType(tx.type);
        document.getElementById('tx-category').value = tx.category;
    } else {
        document.getElementById('tx-modal-title').innerText = "New Transaction";
        document.getElementById('tx-id').value = '';
        setFormType('expense');
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeTransactionModal() {
    const modal = document.getElementById('transaction-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

function setFormType(type) {
    selectedFormType = type;
    const btnExpense = document.getElementById('type-btn-expense');
    const btnIncome = document.getElementById('type-btn-income');
    
    if (type === 'expense') {
        btnExpense.className = "py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold text-sm transition";
        btnIncome.className = "py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-sm transition";
    } else {
        btnIncome.className = "py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold text-sm transition";
        btnExpense.className = "py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-slate-400 font-semibold text-sm transition";
    }
    
    const catSelect = document.getElementById('tx-category');
    catSelect.innerHTML = '<option value="">Select Category</option>';
    CATEGORIES[type].forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        catSelect.appendChild(opt);
    });
}

async function saveTransaction(event) {
    event.preventDefault();
    
    const id = document.getElementById('tx-id').value;
    const payload = {
        amount: parseFloat(document.getElementById('tx-amount').value),
        type: selectedFormType,
        category: document.getElementById('tx-category').value,
        date: document.getElementById('tx-date').value,
        notes: document.getElementById('tx-notes').value || null,
        payment_method: document.getElementById('tx-payment-method').value
    };
    
    try {
        let res;
        if (id) {
            res = await fetch(`/api/transactions/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch('/api/transactions', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
        }
        
        if (res.ok) {
            closeTransactionModal();
            loadAllData();
        } else {
            const err = await res.json();
            alert(`Error saving transaction: ${err.detail}`);
        }
    } catch (err) {
        console.error("Error saving transaction: ", err);
    }
}

async function deleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this transaction record?")) return;
    
    try {
        const res = await fetch(`/api/transactions/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) {
            loadAllData();
        }
    } catch (err) {
        console.error("Error deleting transaction: ", err);
    }
}

// SAVINGS GOALS EVENTS
function openGoalModal() {
    const modal = document.getElementById('goal-modal');
    const form = document.getElementById('goal-form');
    form.reset();
    document.getElementById('goal-modal-title').innerText = "New Savings Goal";
    document.getElementById('goal-id').value = '';
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function editGoal(goal) {
    const modal = document.getElementById('goal-modal');
    document.getElementById('goal-modal-title').innerText = "Edit Savings Goal";
    document.getElementById('goal-id').value = goal.id;
    document.getElementById('goal-name').value = goal.name;
    document.getElementById('goal-target').value = goal.target_amount;
    document.getElementById('goal-current').value = goal.current_amount;
    document.getElementById('goal-date').value = goal.target_date;
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeGoalModal() {
    const modal = document.getElementById('goal-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

async function saveGoal(event) {
    event.preventDefault();
    
    const id = document.getElementById('goal-id').value;
    const payload = {
        name: document.getElementById('goal-name').value,
        target_amount: parseFloat(document.getElementById('goal-target').value),
        current_amount: parseFloat(document.getElementById('goal-current').value),
        target_date: document.getElementById('goal-date').value
    };
    
    try {
        let res;
        if (id) {
            res = await fetch(`/api/savings_goals/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch('/api/savings_goals', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
        }
        
        if (res.ok) {
            closeGoalModal();
            loadAllData();
        }
    } catch (err) {
        console.error("Error saving goal: ", err);
    }
}

function openGoalProgressModal(id, currentAmount) {
    const modal = document.getElementById('goal-progress-modal');
    document.getElementById('goal-progress-id').value = id;
    document.getElementById('goal-progress-amount').value = currentAmount;
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeGoalProgressModal() {
    const modal = document.getElementById('goal-progress-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

async function saveGoalProgress(event) {
    event.preventDefault();
    const id = document.getElementById('goal-progress-id').value;
    const amount = parseFloat(document.getElementById('goal-progress-amount').value);
    
    try {
        const res = await fetch(`/api/savings_goals/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ current_amount: amount })
        });
        if (res.ok) {
            closeGoalProgressModal();
            loadAllData();
        }
    } catch (err) {
        console.error("Error updating goal progress: ", err);
    }
}

async function deleteGoal(id) {
    if (!confirm("Delete this savings goal?")) return;
    
    try {
        const res = await fetch(`/api/savings_goals/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) {
            loadAllData();
        }
    } catch (err) {
        console.error("Error deleting goal: ", err);
    }
}

// BUDGETS EVENTS
function openBudgetModal() {
    const modal = document.getElementById('budget-modal');
    const form = document.getElementById('budget-form');
    form.reset();
    document.getElementById('budget-id').value = '';
    document.getElementById('budget-category').disabled = false;
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function editBudget(budget) {
    const modal = document.getElementById('budget-modal');
    document.getElementById('budget-id').value = budget.id;
    document.getElementById('budget-category').value = budget.category;
    document.getElementById('budget-category').disabled = true;
    document.getElementById('budget-limit').value = budget.limit_amount;
    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeBudgetModal() {
    const modal = document.getElementById('budget-modal');
    modal.classList.remove('active');
    modal.classList.add('hidden');
}

async function saveBudget(event) {
    event.preventDefault();
    
    const id = document.getElementById('budget-id').value;
    const payload = {
        category: document.getElementById('budget-category').value,
        limit_amount: parseFloat(document.getElementById('budget-limit').value)
    };
    
    try {
        let res;
        if (id) {
            res = await fetch(`/api/budgets/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify({ limit_amount: payload.limit_amount })
            });
        } else {
            res = await fetch('/api/budgets', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
        }
        
        if (res.ok) {
            closeBudgetModal();
            loadAllData();
        } else {
            const err = await res.json();
            alert(`Error: ${err.detail}`);
        }
    } catch (err) {
        console.error("Error saving budget: ", err);
    }
}

async function deleteBudget(id) {
    if (!confirm("Are you sure you want to remove this category budget limit?")) return;
    
    try {
        const res = await fetch(`/api/budgets/${id}`, { 
            method: 'DELETE',
            headers: getHeaders()
        });
        if (res.ok) {
            loadAllData();
        }
    } catch (err) {
        console.error("Error deleting budget: ", err);
    }
}

// CSV EXPORT CALL (passing email query parameter for direct download)
function exportTransactions() {
    window.location.href = `/api/transactions/export?email=${encodeURIComponent(userEmail)}`;
}

// AUTH SCREEN HANDLING
function toggleAuthTab(action) {
    authAction = action;
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const submitBtn = document.getElementById('auth-submit-btn');
    const errorMsg = document.getElementById('auth-error-msg');
    
    errorMsg.classList.add('hidden');
    document.getElementById('auth-form').reset();
    
    if (action === 'login') {
        tabLogin.className = "py-2 rounded-xl text-sm font-semibold text-emerald-400 bg-slate-800/40 border border-slate-700/30 transition";
        tabRegister.className = "py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 transition";
        submitBtn.innerText = "Sign In";
        document.getElementById('auth-action').value = 'login';
    } else {
        tabRegister.className = "py-2 rounded-xl text-sm font-semibold text-emerald-400 bg-slate-800/40 border border-slate-700/30 transition";
        tabLogin.className = "py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 transition";
        submitBtn.innerText = "Register & Sign Up";
        document.getElementById('auth-action').value = 'register';
    }
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('auth-email').value;
    const passwordInput = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error-msg');
    const action = document.getElementById('auth-action').value;
    
    errorMsg.classList.add('hidden');
    
    const url = action === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailInput, password: passwordInput })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            // Store session
            localStorage.setItem('finflow_email', emailInput);
            userEmail = emailInput;
            
            // Hide login screen
            document.getElementById('login-screen').classList.add('hidden');
            
            // Update UI profile & Load data
            updateUserProfileDisplay();
            loadAllData();
        } else {
            errorMsg.innerText = data.detail || 'An error occurred during authentication.';
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Auth error: ", err);
        errorMsg.innerText = 'Unable to connect to the backend server.';
        errorMsg.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem('finflow_email');
    userEmail = '';
    
    // Clear in-memory listings
    transactions = [];
    savingsGoals = [];
    budgets = [];
    
    // Clear DOM content
    document.getElementById('recent-transactions-list').innerHTML = '';
    document.getElementById('transactions-list').innerHTML = '';
    document.getElementById('budgets-progress-grid').innerHTML = '';
    document.getElementById('goals-grid').innerHTML = '';
    
    // Destroy charts
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }
    if (trendChart) {
        trendChart.destroy();
        trendChart = null;
    }
    
    // Display login screen overlay
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('auth-form').reset();
    toggleAuthTab('login');
}

// CHART.JS DRAWING
function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const emptyNotice = document.getElementById('categoryChartEmpty');
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    if (labels.length === 0) {
        if (categoryChart) categoryChart.destroy();
        emptyNotice.classList.remove('hidden');
        return;
    }
    
    emptyNotice.classList.add('hidden');
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    const colors = [
        'rgba(244, 63, 94, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(6, 182, 212, 0.8)',
        'rgba(100, 116, 139, 0.8)'
    ];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#0f172a',
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 11 },
                        padding: 15,
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            cutout: '68%'
        }
    });
}

function renderTrendChart(data) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    const labels = Object.keys(data);
    const incomeData = labels.map(m => data[m].income);
    const expenseData = labels.map(m => data[m].expense);
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.map(m => {
                const parts = m.split('-');
                if (parts.length === 2) {
                    const date = new Date(parts[0], parts[1] - 1, 1);
                    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
                }
                return m;
            }),
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.75)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(244, 63, 94, 0.75)',
                    borderColor: 'rgba(244, 63, 94, 1)',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(51, 65, 85, 0.15)' },
                    ticks: {
                        color: '#94a3b8',
                        font: { family: 'Inter', size: 10 },
                        callback: function(val) {
                            return '₹' + val.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
}
