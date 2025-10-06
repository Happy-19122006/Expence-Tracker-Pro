// Expense Tracker Pro - Main JavaScript File
class ExpenseTracker {
    constructor() {
        this.currentUser = null;
        this.transactions = [];
        this.categories = [
            { id: 'food', name: 'Food & Dining', icon: 'fas fa-utensils', color: '#f59e0b' },
            { id: 'transport', name: 'Transportation', icon: 'fas fa-car', color: '#3b82f6' },
            { id: 'shopping', name: 'Shopping', icon: 'fas fa-shopping-bag', color: '#8b5cf6' },
            { id: 'bills', name: 'Bills & Utilities', icon: 'fas fa-file-invoice', color: '#ef4444' },
            { id: 'entertainment', name: 'Entertainment', icon: 'fas fa-film', color: '#10b981' },
            { id: 'health', name: 'Health & Fitness', icon: 'fas fa-heartbeat', color: '#f97316' },
            { id: 'education', name: 'Education', icon: 'fas fa-graduation-cap', color: '#06b6d4' },
            { id: 'travel', name: 'Travel', icon: 'fas fa-plane', color: '#84cc16' },
            { id: 'other', name: 'Other', icon: 'fas fa-ellipsis-h', color: '#6b7280' }
        ];
        this.charts = {};
        this.currentFilter = 'all';
        this.editingTransaction = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.initializeTheme();
        this.showLoadingScreen();
        
        // Simulate loading time
        setTimeout(() => {
            this.hideLoadingScreen();
            this.checkAuthentication();
        }, 2000);
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.remove('hidden');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('hidden');
    }

    setupEventListeners() {
        // Auth form events
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signup-form').addEventListener('submit', (e) => this.handleSignup(e));
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAuthTab(e));
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', (e) => {
            this.animateButtonClick(e.target);
            this.toggleTheme();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.navigateToSection(e));
        });

        // Transaction modal
        document.getElementById('add-transaction-btn').addEventListener('click', (e) => {
            this.animateButtonClick(e.target);
            this.openTransactionModal();
        });
        document.getElementById('transaction-form').addEventListener('submit', (e) => this.handleTransactionSubmit(e));
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-cancel').addEventListener('click', () => this.closeModal());

        // Type selector
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectTransactionType(e));
        });

        // Filters
        document.getElementById('type-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('category-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('date-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('dashboard-filter').addEventListener('change', () => this.updateDashboard());
        document.getElementById('analytics-filter').addEventListener('change', () => this.updateAnalytics());

        // Export buttons
        document.getElementById('export-pdf-btn').addEventListener('click', (e) => {
            this.animateButtonClick(e.target);
            this.exportToPDF();
        });
        document.getElementById('export-csv-btn').addEventListener('click', (e) => {
            this.animateButtonClick(e.target);
            this.exportToCSV();
        });

        // Settings
        document.getElementById('theme-setting').addEventListener('change', (e) => this.changeTheme(e.target.value));
        document.getElementById('add-category-btn').addEventListener('click', () => this.addCustomCategory());
        document.getElementById('export-data-btn').addEventListener('click', () => this.exportAllData());
        document.getElementById('import-data-btn').addEventListener('click', () => this.importData());
        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));
        document.getElementById('clear-data-btn').addEventListener('click', () => this.clearAllData());

        // Profile picture upload
        document.getElementById('dp-input').addEventListener('change', (e) => this.handleProfilePictureUpload(e));
        document.querySelector('.profile-picture-container').addEventListener('click', () => {
            document.getElementById('dp-input').click();
        });

        // Report period
        document.getElementById('report-period').addEventListener('change', (e) => this.updateReportPeriod(e.target.value));

        // Close modal on outside click
        document.getElementById('transaction-modal').addEventListener('click', (e) => {
            if (e.target.id === 'transaction-modal') {
                this.closeModal();
            }
        });
    }

    // Authentication Methods
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (this.validateCredentials(email, password)) {
            this.currentUser = { email, name: this.getUserName(email) };
            this.saveUserData();
            this.showApp();
            this.showNotification('Login successful!', 'success');
        } else {
            this.showNotification('Invalid credentials!', 'error');
        }
    }

    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (this.validateSignup(name, email, password)) {
            this.currentUser = { email, name };
            this.saveUserData();
            this.showApp();
            this.showNotification('Account created successfully!', 'success');
        } else {
            this.showNotification('Please fill all fields correctly!', 'error');
        }
    }

    validateCredentials(email, password) {
        const users = this.getStoredUsers();
        return users.some(user => user.email === email && user.password === password);
    }

    validateSignup(name, email, password) {
        return name.trim() && email.trim() && password.length >= 6;
    }

    getUserName(email) {
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email);
        return user ? user.name : 'User';
    }

    getStoredUsers() {
        return JSON.parse(localStorage.getItem('expenseTrackerUsers') || '[]');
    }

    saveUserData() {
        const users = this.getStoredUsers();
        const existingUserIndex = users.findIndex(u => u.email === this.currentUser.email);
        
        if (existingUserIndex >= 0) {
            users[existingUserIndex] = { ...users[existingUserIndex], ...this.currentUser };
        } else {
            users.push({ ...this.currentUser, password: document.getElementById('signup-password').value });
        }
        
        localStorage.setItem('expenseTrackerUsers', JSON.stringify(users));
        localStorage.setItem('expenseTrackerCurrentUser', JSON.stringify(this.currentUser));
    }

    loadUserData() {
        const storedUser = localStorage.getItem('expenseTrackerCurrentUser');
        if (storedUser) {
            this.currentUser = JSON.parse(storedUser);
        }

        // Load saved profile picture
        const savedProfilePicture = localStorage.getItem('profilePicture');
        if (savedProfilePicture) {
            const img = document.getElementById('dp-preview');
            if (img) {
                img.src = savedProfilePicture;
            }
        }
    }

    checkAuthentication() {
        if (this.currentUser) {
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        document.getElementById('user-name').textContent = this.currentUser.name;
        this.loadTransactions();
        this.updateDashboard();
        this.populateCategories();
        this.animateElements();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('expenseTrackerCurrentUser');
        this.showAuth();
        this.showNotification('Logged out successfully!', 'success');
    }

    switchAuthTab(e) {
        const tab = e.target.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(`${tab}-form`).classList.add('active');
    }

    // Theme Management
    initializeTheme() {
        const savedTheme = localStorage.getItem('expenseTrackerTheme') || 'light';
        this.setTheme(savedTheme);
        document.getElementById('theme-setting').value = savedTheme;
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('expenseTrackerTheme', theme);
        
        const themeIcon = document.querySelector('#theme-toggle i');
        themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    changeTheme(theme) {
        this.setTheme(theme);
    }

    // Navigation
    navigateToSection(e) {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
        
        e.currentTarget.classList.add('active');
        const targetSection = document.getElementById(section);
        targetSection.classList.add('active');
        
        // Add animation to the section
        this.animateSection(targetSection);
        
        // Update specific sections when navigated to
        if (section === 'analytics') {
            this.updateAnalytics();
        } else if (section === 'reports') {
            this.updateReports();
        }
    }

    // Transaction Management
    loadTransactions() {
        const stored = localStorage.getItem(`expenseTrackerTransactions_${this.currentUser.email}`);
        this.transactions = stored ? JSON.parse(stored) : [];
        this.renderTransactions();
    }

    saveTransactions() {
        localStorage.setItem(`expenseTrackerTransactions_${this.currentUser.email}`, JSON.stringify(this.transactions));
    }

    openTransactionModal(transaction = null) {
        this.editingTransaction = transaction;
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        const title = document.getElementById('modal-title');
        
        if (transaction) {
            title.textContent = 'Edit Transaction';
            document.getElementById('transaction-description').value = transaction.description;
            document.getElementById('transaction-amount').value = transaction.amount;
            document.getElementById('transaction-category').value = transaction.category;
            document.getElementById('transaction-date').value = transaction.date;
            
            // Set type
            document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-type="${transaction.type}"]`).classList.add('active');
        } else {
            title.textContent = 'Add Transaction';
            form.reset();
            document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-type="expense"]').classList.add('active');
            document.getElementById('transaction-date').value = new Date().toISOString().split('T')[0];
        }
        
        modal.classList.add('active');
        this.populateCategorySelect();
    }

    closeModal() {
        document.getElementById('transaction-modal').classList.remove('active');
        this.editingTransaction = null;
    }

    selectTransactionType(e) {
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const type = document.querySelector('.type-btn.active').dataset.type;
        const description = document.getElementById('transaction-description').value;
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const category = document.getElementById('transaction-category').value;
        const date = document.getElementById('transaction-date').value;

        if (!description || !amount || !category || !date) {
            this.showNotification('Please fill all fields!', 'error');
            return;
        }

        const transaction = {
            id: this.editingTransaction ? this.editingTransaction.id : Date.now().toString(),
            type,
            description,
            amount,
            category,
            date,
            createdAt: this.editingTransaction ? this.editingTransaction.createdAt : new Date().toISOString()
        };

        if (this.editingTransaction) {
            const index = this.transactions.findIndex(t => t.id === this.editingTransaction.id);
            this.transactions[index] = transaction;
            this.showNotification('Transaction updated successfully!', 'success');
        } else {
            this.transactions.unshift(transaction);
            this.showNotification('Transaction added successfully!', 'success');
        }

        this.saveTransactions();
        this.renderTransactions();
        this.updateDashboard();
        this.closeModal();
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.renderTransactions();
            this.updateDashboard();
            this.showNotification('Transaction deleted successfully!', 'success');
        }
    }

    renderTransactions() {
        const tbody = document.getElementById('transactions-table-body');
        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-receipt"></i>
                        <p>No transactions found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filteredTransactions.map(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            return `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>${transaction.description}</td>
                    <td>
                        <span class="transaction-type" style="background: ${category?.color}20; color: ${category?.color}">
                            <i class="${category?.icon}"></i>
                            ${category?.name || transaction.category}
                        </span>
                    </td>
                    <td>
                        <span class="transaction-type ${transaction.type}">
                            <i class="fas fa-arrow-${transaction.type === 'income' ? 'up' : 'down'}"></i>
                            ${transaction.type}
                        </span>
                    </td>
                    <td class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                    </td>
                    <td>
                        <div class="transaction-actions">
                            <button class="action-btn edit-btn" onclick="expenseTracker.openTransactionModal(${JSON.stringify(transaction).replace(/"/g, '&quot;')})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="expenseTracker.deleteTransaction('${transaction.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getFilteredTransactions() {
        let filtered = [...this.transactions];
        
        const typeFilter = document.getElementById('type-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        const dateFilter = document.getElementById('date-filter').value;
        
        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }
        
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }
        
        if (dateFilter) {
            filtered = filtered.filter(t => t.date === dateFilter);
        }
        
        return filtered;
    }

    applyFilters() {
        this.renderTransactions();
    }

    populateCategories() {
        const categorySelect = document.getElementById('category-filter');
        const transactionCategorySelect = document.getElementById('transaction-category');
        
        const populateSelect = (select) => {
            select.innerHTML = '<option value="all">All Categories</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        };
        
        populateSelect(categorySelect);
        populateSelect(transactionCategorySelect);
    }

    populateCategorySelect() {
        const select = document.getElementById('transaction-category');
        select.innerHTML = '<option value="">Select Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    addCustomCategory() {
        const input = document.getElementById('new-category');
        const name = input.value.trim();
        
        if (name && !this.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
            const newCategory = {
                id: name.toLowerCase().replace(/\s+/g, '_'),
                name: name,
                icon: 'fas fa-tag',
                color: this.getRandomColor()
            };
            
            this.categories.push(newCategory);
            this.populateCategories();
            input.value = '';
            this.showNotification('Category added successfully!', 'success');
        } else {
            this.showNotification('Category already exists or invalid name!', 'error');
        }
    }

    getRandomColor() {
        const colors = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f97316', '#06b6d4', '#84cc16'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Dashboard Updates
    updateDashboard() {
        const filter = document.getElementById('dashboard-filter').value;
        const filteredTransactions = this.getFilteredTransactionsByPeriod(filter);
        
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;
        
        document.getElementById('balance-amount').textContent = `$${balance.toFixed(2)}`;
        document.getElementById('income-amount').textContent = `$${income.toFixed(2)}`;
        document.getElementById('expense-amount').textContent = `$${expenses.toFixed(2)}`;
        document.getElementById('transaction-count').textContent = filteredTransactions.length;
        
        this.updateRecentTransactions(filteredTransactions);
        this.updateExpensePieChart(filteredTransactions);
    }

    getFilteredTransactionsByPeriod(period) {
        const now = new Date();
        let filtered = [...this.transactions];
        
        switch (period) {
            case 'month':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                filtered = filtered.filter(t => new Date(t.date) >= startOfMonth);
                break;
            case 'year':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                filtered = filtered.filter(t => new Date(t.date) >= startOfYear);
                break;
        }
        
        return filtered;
    }

    updateRecentTransactions(transactions) {
        const container = document.getElementById('recent-transactions-list');
        const recent = transactions.slice(0, 5);
        
        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions yet</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recent.map(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-icon" style="background: ${category?.color || '#6b7280'}">
                            <i class="${category?.icon || 'fas fa-tag'}"></i>
                        </div>
                        <div class="transaction-details">
                            <h4>${transaction.description}</h4>
                            <p>${category?.name || transaction.category}</p>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Charts
    updateExpensePieChart(transactions) {
        const ctx = document.getElementById('expense-pie-chart').getContext('2d');
        
        if (this.charts.expensePie) {
            this.charts.expensePie.destroy();
        }
        
        const expenseData = transactions.filter(t => t.type === 'expense');
        const categoryTotals = {};
        
        expenseData.forEach(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            const categoryName = category ? category.name : transaction.category;
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + transaction.amount;
        });
        
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        const colors = labels.map(label => {
            const category = this.categories.find(c => c.name === label);
            return category ? category.color : this.getRandomColor();
        });
        
        this.charts.expensePie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    updateAnalytics() {
        this.updateMonthlyTrendsChart();
        this.updateCategoryBarChart();
    }

    updateMonthlyTrendsChart() {
        const ctx = document.getElementById('monthly-trends-chart').getContext('2d');
        
        if (this.charts.monthlyTrends) {
            this.charts.monthlyTrends.destroy();
        }
        
        const filter = document.getElementById('analytics-filter').value;
        const transactions = this.getFilteredTransactionsByPeriod(filter);
        
        // Group by month
        const monthlyData = {};
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { income: 0, expense: 0 };
            }
            
            monthlyData[monthKey][transaction.type] += transaction.amount;
        });
        
        const months = Object.keys(monthlyData).sort();
        const incomeData = months.map(month => monthlyData[month].income);
        const expenseData = months.map(month => monthlyData[month].expense);
        
        this.charts.monthlyTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months.map(month => {
                    const [year, monthNum] = month.split('-');
                    return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Expenses',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    updateCategoryBarChart() {
        const ctx = document.getElementById('category-bar-chart').getContext('2d');
        
        if (this.charts.categoryBar) {
            this.charts.categoryBar.destroy();
        }
        
        const filter = document.getElementById('analytics-filter').value;
        const transactions = this.getFilteredTransactionsByPeriod(filter);
        const expenseData = transactions.filter(t => t.type === 'expense');
        
        const categoryTotals = {};
        expenseData.forEach(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            const categoryName = category ? category.name : transaction.category;
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + transaction.amount;
        });
        
        const labels = Object.keys(categoryTotals).slice(0, 8); // Top 8 categories
        const data = labels.map(label => categoryTotals[label]);
        const colors = labels.map(label => {
            const category = this.categories.find(c => c.name === label);
            return category ? category.color : this.getRandomColor();
        });
        
        this.charts.categoryBar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    // Reports
    updateReports() {
        this.updateReportSummary();
    }

    updateReportSummary() {
        const period = document.getElementById('report-period').value;
        let transactions = [...this.transactions];
        
        if (period === 'custom') {
            const startDate = document.getElementById('custom-start-date').value;
            const endDate = document.getElementById('custom-end-date').value;
            
            if (startDate && endDate) {
                transactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);
            }
        } else {
            transactions = this.getFilteredTransactionsByPeriod(period);
        }
        
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;
        
        document.getElementById('report-income').textContent = `$${income.toFixed(2)}`;
        document.getElementById('report-expenses').textContent = `$${expenses.toFixed(2)}`;
        document.getElementById('report-balance').textContent = `$${balance.toFixed(2)}`;
    }

    updateReportPeriod(period) {
        const customDateInputs = document.querySelectorAll('#custom-start-date, #custom-end-date');
        
        if (period === 'custom') {
            customDateInputs.forEach(input => input.classList.remove('hidden'));
        } else {
            customDateInputs.forEach(input => input.classList.add('hidden'));
        }
        
        this.updateReportSummary();
    }

    // Export Functions
    exportToPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Expense Report', 20, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
        
        // Add summary
        const period = document.getElementById('report-period').value;
        const transactions = this.getFilteredTransactionsByPeriod(period);
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expenses;
        
        doc.text(`Total Income: $${income.toFixed(2)}`, 20, 50);
        doc.text(`Total Expenses: $${expenses.toFixed(2)}`, 20, 60);
        doc.text(`Net Balance: $${balance.toFixed(2)}`, 20, 70);
        
        // Add transactions table
        doc.text('Transactions:', 20, 90);
        
        let y = 100;
        transactions.slice(0, 20).forEach(transaction => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            const category = this.categories.find(c => c.id === transaction.category);
            doc.text(`${this.formatDate(transaction.date)} - ${transaction.description} - $${transaction.amount.toFixed(2)}`, 20, y);
            y += 10;
        });
        
        doc.save('expense-report.pdf');
        this.showNotification('PDF exported successfully!', 'success');
    }

    exportToCSV() {
        const period = document.getElementById('report-period').value;
        const transactions = this.getFilteredTransactionsByPeriod(period);
        
        const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.date,
                `"${t.description}"`,
                t.category,
                t.type,
                t.amount
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'expense-report.csv';
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('CSV exported successfully!', 'success');
    }

    exportAllData() {
        const data = {
            user: this.currentUser,
            transactions: this.transactions,
            categories: this.categories,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'expense-tracker-backup.json';
        a.click();
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully!', 'success');
    }

    importData() {
        document.getElementById('import-file').click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (data.transactions) {
                    this.transactions = data.transactions;
                    this.saveTransactions();
                }
                
                if (data.categories) {
                    this.categories = [...this.categories, ...data.categories.filter(c => !this.categories.find(existing => existing.id === c.id))];
                }
                
                this.renderTransactions();
                this.updateDashboard();
                this.populateCategories();
                this.showNotification('Data imported successfully!', 'success');
            } catch (error) {
                this.showNotification('Invalid file format!', 'error');
            }
        };
        reader.readAsText(file);
    }

    handleProfilePictureUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select a valid image file!', 'error');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Image size should be less than 5MB!', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.getElementById('dp-preview');
            img.src = event.target.result;
            
            // Save to localStorage
            localStorage.setItem('profilePicture', event.target.result);
            
            this.showNotification('Profile picture updated successfully!', 'success');
        };
        reader.readAsDataURL(file);
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
            this.transactions = [];
            this.saveTransactions();
            this.renderTransactions();
            this.updateDashboard();
            this.showNotification('All data cleared!', 'success');
        }
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            transform: translateX(100%) scale(0.8);
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        `;
        
        document.body.appendChild(notification);
        
        // Animate in with bounce effect
        setTimeout(() => {
            notification.style.transform = 'translateX(0) scale(1)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%) scale(0.8)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 400);
        }, 3000);
    }

    // Animation Methods
    animateElements() {
        // Animate stat cards with stagger effect
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });

        // Animate navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.5s ease-out';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100);
        });

        // Animate header elements
        const headerElements = document.querySelectorAll('.header-content > *');
        headerElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.5s ease-out';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    animateSection(section) {
        const elements = section.querySelectorAll('.section-header, .stats-grid, .chart-container, .transactions-table-container, .settings-grid');
        
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease-out';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    animateTransactionRow(row) {
        row.style.opacity = '0';
        row.style.transform = 'translateX(-30px)';
        
        setTimeout(() => {
            row.style.transition = 'all 0.4s ease-out';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        }, 100);
    }

    animateButtonClick(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }

    addFloatingAnimation(element) {
        element.style.animation = 'float 3s ease-in-out infinite';
    }

    addPulseAnimation(element) {
        element.style.animation = 'pulse 2s ease-in-out infinite';
    }

    addGlowEffect(element) {
        element.style.animation = 'glow 2s ease-in-out infinite';
    }
}

// Initialize the application
let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
});

// Handle window resize for charts
window.addEventListener('resize', () => {
    if (expenseTracker && expenseTracker.charts) {
        Object.values(expenseTracker.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }
});
