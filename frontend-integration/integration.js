/**
 * Frontend Integration Layer for ExpenseTracker Pro
 * This file seamlessly integrates the backend API with the existing frontend
 * without modifying the original frontend code
 */

class ExpenseTrackerIntegration {
    constructor() {
        this.api = window.ExpenseTrackerAPI;
        this.originalTracker = null;
        this.isIntegrated = false;
        
        console.log('🔗 ExpenseTracker Integration initialized');
        this.init();
    }

    init() {
        // Wait for the original ExpenseTracker to be available
        this.waitForTracker().then(() => {
            this.integrate();
        });
    }

    async waitForTracker() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.expenseTracker) {
                    this.originalTracker = window.expenseTracker;
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }

    integrate() {
        if (this.isIntegrated) return;

        console.log('🔧 Integrating backend API with frontend...');

        // Override key methods to use backend API
        this.overrideTransactionMethods();
        this.overrideCategoryMethods();
        this.overrideAnalyticsMethods();
        this.overrideAuthMethods();

        // Setup periodic sync
        this.setupPeriodicSync();

        // Setup offline/online handling
        this.setupOfflineHandling();

        this.isIntegrated = true;
        console.log('✅ Backend integration completed');
    }

    overrideTransactionMethods() {
        const tracker = this.originalTracker;

        // Override loadTransactions
        const originalLoadTransactions = tracker.loadTransactions.bind(tracker);
        tracker.loadTransactions = async function() {
            try {
                console.log('📡 Loading transactions from backend...');
                const backendTransactions = await this.api.getTransactions();
                
                // Convert backend format to frontend format
                const frontendTransactions = backendTransactions.map(tx => ({
                    id: tx._id,
                    amount: tx.amount,
                    type: tx.type,
                    category: tx.category?.name || 'Other',
                    date: tx.date,
                    note: tx.note || tx.description,
                    description: tx.description
                }));

                this.transactions = frontendTransactions;
                this.updateDashboard();
                this.renderTransactions();
                
                console.log(`✅ Loaded ${frontendTransactions.length} transactions from backend`);
            } catch (error) {
                console.error('❌ Failed to load transactions from backend:', error);
                // Fallback to original method
                return originalLoadTransactions();
            }
        };

        // Override addTransaction
        const originalAddTransaction = tracker.addTransaction.bind(tracker);
        tracker.addTransaction = async function(transactionData) {
            try {
                console.log('📡 Adding transaction to backend...');
                
                // Get category ID from name
                const categories = await this.api.getCategories();
                const category = categories.find(cat => cat.name === transactionData.category);
                
                const backendTransaction = {
                    amount: parseFloat(transactionData.amount),
                    type: transactionData.type,
                    category: category?._id || transactionData.category,
                    description: transactionData.note || transactionData.description || '',
                    note: transactionData.note || '',
                    date: new Date(transactionData.date)
                };

                const createdTransaction = await this.api.createTransaction(backendTransaction);
                
                // Convert to frontend format and add locally
                const frontendTransaction = {
                    id: createdTransaction._id,
                    amount: createdTransaction.amount,
                    type: createdTransaction.type,
                    category: createdTransaction.category?.name || transactionData.category,
                    date: createdTransaction.date,
                    note: createdTransaction.note || createdTransaction.description,
                    description: createdTransaction.description
                };

                this.transactions.unshift(frontendTransaction);
                this.updateDashboard();
                this.renderTransactions();
                
                console.log('✅ Transaction added to backend successfully');
                this.showNotification('Transaction added successfully!', 'success');
                
            } catch (error) {
                console.error('❌ Failed to add transaction to backend:', error);
                // Fallback to original method
                return originalAddTransaction(transactionData);
            }
        };

        // Override editTransaction
        const originalEditTransaction = tracker.editTransaction.bind(tracker);
        tracker.editTransaction = async function(id, updatedData) {
            try {
                console.log('📡 Updating transaction in backend...');
                
                const categories = await this.api.getCategories();
                const category = categories.find(cat => cat.name === updatedData.category);
                
                const backendUpdate = {
                    amount: parseFloat(updatedData.amount),
                    type: updatedData.type,
                    category: category?._id || updatedData.category,
                    description: updatedData.note || updatedData.description || '',
                    note: updatedData.note || '',
                    date: new Date(updatedData.date)
                };

                await this.api.updateTransaction(id, backendUpdate);
                
                // Update locally
                const index = this.transactions.findIndex(t => t.id === id);
                if (index !== -1) {
                    this.transactions[index] = { ...this.transactions[index], ...updatedData };
                    this.updateDashboard();
                    this.renderTransactions();
                }
                
                console.log('✅ Transaction updated in backend successfully');
                this.showNotification('Transaction updated successfully!', 'success');
                
            } catch (error) {
                console.error('❌ Failed to update transaction in backend:', error);
                // Fallback to original method
                return originalEditTransaction(id, updatedData);
            }
        };

        // Override deleteTransaction
        const originalDeleteTransaction = tracker.deleteTransaction.bind(tracker);
        tracker.deleteTransaction = async function(id) {
            try {
                console.log('📡 Deleting transaction from backend...');
                
                await this.api.deleteTransaction(id);
                
                // Remove locally
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.updateDashboard();
                this.renderTransactions();
                
                console.log('✅ Transaction deleted from backend successfully');
                this.showNotification('Transaction deleted successfully!', 'success');
                
            } catch (error) {
                console.error('❌ Failed to delete transaction from backend:', error);
                // Fallback to original method
                return originalDeleteTransaction(id);
            }
        };
    }

    overrideCategoryMethods() {
        const tracker = this.originalTracker;

        // Override populateCategories
        const originalPopulateCategories = tracker.populateCategories.bind(tracker);
        tracker.populateCategories = async function() {
            try {
                console.log('📡 Loading categories from backend...');
                const backendCategories = await this.api.getCategories();
                
                // Convert backend format to frontend format
                this.categories = backendCategories.map(cat => ({
                    id: cat._id,
                    name: cat.name,
                    icon: cat.icon,
                    color: cat.color
                }));

                this.updateCategorySelects();
                console.log(`✅ Loaded ${this.categories.length} categories from backend`);
                
            } catch (error) {
                console.error('❌ Failed to load categories from backend:', error);
                // Fallback to original method
                return originalPopulateCategories();
            }
        };
    }

    overrideAnalyticsMethods() {
        const tracker = this.originalTracker;

        // Override updateDashboard
        const originalUpdateDashboard = tracker.updateDashboard.bind(tracker);
        tracker.updateDashboard = async function() {
            try {
                // Get analytics from backend
                const analytics = await this.api.getDashboardAnalytics();
                
                if (analytics && analytics.summary) {
                    // Update dashboard with backend data
                    this.updateDashboardSummary(analytics.summary);
                    this.updateCategoryBreakdown(analytics.categoryBreakdown);
                    this.updateRecentTransactions(analytics.recentTransactions);
                } else {
                    // Fallback to original method
                    return originalUpdateDashboard();
                }
                
            } catch (error) {
                console.error('❌ Failed to update dashboard from backend:', error);
                // Fallback to original method
                return originalUpdateDashboard();
            }
        };

        // Add new method for dashboard summary
        tracker.updateDashboardSummary = function(summary) {
            const totalIncomeEl = document.getElementById('total-income');
            const totalExpenseEl = document.getElementById('total-expense');
            const balanceEl = document.getElementById('balance');

            if (totalIncomeEl) totalIncomeEl.textContent = this.formatCurrency(summary.totalIncome);
            if (totalExpenseEl) totalExpenseEl.textContent = this.formatCurrency(summary.totalExpense);
            if (balanceEl) balanceEl.textContent = this.formatCurrency(summary.netBalance);
        };

        // Add new method for category breakdown
        tracker.updateCategoryBreakdown = function(categoryBreakdown) {
            // Update pie chart if it exists
            if (this.charts && this.charts.pieChart) {
                const chartData = categoryBreakdown.map(cat => ({
                    label: cat.category.name,
                    value: cat.total,
                    color: cat.category.color
                }));
                
                this.updatePieChart(chartData);
            }
        };

        // Add new method for recent transactions
        tracker.updateRecentTransactions = function(recentTransactions) {
            // Update recent transactions display if it exists
            const recentContainer = document.getElementById('recent-transactions');
            if (recentContainer) {
                const html = recentTransactions.map(tx => `
                    <div class="recent-transaction">
                        <span class="category">${tx.category?.name || 'Unknown'}</span>
                        <span class="amount ${tx.type}">${this.formatCurrency(tx.amount)}</span>
                    </div>
                `).join('');
                
                recentContainer.innerHTML = html;
            }
        };
    }

    overrideAuthMethods() {
        const tracker = this.originalTracker;

        // Override handleLogin
        const originalHandleLogin = tracker.handleLogin.bind(tracker);
        tracker.handleLogin = async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                console.log('📡 Attempting login with backend...');
                const response = await this.api.login({ email, password });
                
                if (response.data.user) {
                    this.currentUser = {
                        email: response.data.user.email,
                        name: response.data.user.name,
                        id: response.data.user.id
                    };
                    
                    this.saveUserData();
                    this.showApp();
                    this.showNotification('Login successful!', 'success');
                    console.log('✅ Login successful with backend');
                }
                
            } catch (error) {
                console.error('❌ Backend login failed:', error);
                // Fallback to original method
                return originalHandleLogin(e);
            }
        };

        // Override handleSignup
        const originalHandleSignup = tracker.handleSignup.bind(tracker);
        tracker.handleSignup = async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            try {
                console.log('📡 Attempting signup with backend...');
                const response = await this.api.register({ name, email, password });
                
                if (response.data.user) {
                    this.currentUser = {
                        email: response.data.user.email,
                        name: response.data.user.name,
                        id: response.data.user.id
                    };
                    
                    this.saveUserData();
                    this.showApp();
                    this.showNotification('Account created successfully!', 'success');
                    console.log('✅ Signup successful with backend');
                }
                
            } catch (error) {
                console.error('❌ Backend signup failed:', error);
                // Fallback to original method
                return originalHandleSignup(e);
            }
        };

        // Override logout
        const originalLogout = tracker.logout.bind(tracker);
        tracker.logout = async function() {
            try {
                await this.api.logout();
                console.log('✅ Logout successful with backend');
            } catch (error) {
                console.error('❌ Backend logout failed:', error);
            }
            
            // Always clear local state
            this.currentUser = null;
            localStorage.removeItem('expenseTrackerCurrentUser');
            this.showAuth();
        };
    }

    setupPeriodicSync() {
        // Sync data every 5 minutes when online
        setInterval(async () => {
            if (this.api.isOnline && this.api.token) {
                try {
                    console.log('🔄 Periodic sync...');
                    await this.originalTracker.loadTransactions();
                    await this.originalTracker.populateCategories();
                    await this.originalTracker.updateDashboard();
                } catch (error) {
                    console.error('❌ Periodic sync failed:', error);
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    setupOfflineHandling() {
        // Show offline indicator
        const offlineIndicator = document.createElement('div');
        offlineIndicator.id = 'offline-indicator';
        offlineIndicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f59e0b;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 10000;
            display: none;
            font-size: 14px;
        `;
        offlineIndicator.textContent = '📴 Offline Mode';
        document.body.appendChild(offlineIndicator);

        // Update indicator based on connection status
        const updateIndicator = () => {
            const indicator = document.getElementById('offline-indicator');
            if (this.api.isOnline) {
                indicator.style.display = 'none';
            } else {
                indicator.style.display = 'block';
            }
        };

        window.addEventListener('online', updateIndicator);
        window.addEventListener('offline', updateIndicator);
        updateIndicator();
    }

    // Public methods for manual control
    async testConnection() {
        return await this.api.testConnection();
    }

    async syncData() {
        if (this.originalTracker) {
            await this.originalTracker.loadTransactions();
            await this.originalTracker.populateCategories();
            await this.originalTracker.updateDashboard();
        }
    }

    getConnectionStatus() {
        return {
            isOnline: this.api.isOnline,
            hasToken: !!this.api.token,
            apiURL: this.api.baseURL
        };
    }
}

// Initialize integration when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add API client script if not already loaded
    if (!window.ExpenseTrackerAPI) {
        const script = document.createElement('script');
        script.src = './frontend-integration/api-client.js';
        script.onload = () => {
            window.ExpenseTrackerIntegration = new ExpenseTrackerIntegration();
        };
        document.head.appendChild(script);
    } else {
        window.ExpenseTrackerIntegration = new ExpenseTrackerIntegration();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpenseTrackerIntegration;
}
