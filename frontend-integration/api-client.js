/**
 * API Client for ExpenseTracker Pro Backend Integration
 * This file connects the frontend to the backend API without modifying existing frontend code
 */

class ExpenseTrackerAPI {
    constructor() {
        // Backend API configuration
        this.baseURL = this.getAPIBaseURL();
        this.token = this.getStoredToken();
        this.isOnline = navigator.onLine;
        
        // Setup online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('🌐 Backend connection restored');
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Backend connection lost - using offline mode');
        });
        
        // Initialize
        this.init();
    }

    getAPIBaseURL() {
        // Try to get from environment or use default
        const envURL = window.EXPENSE_TRACKER_API_URL;
        const defaultURL = 'https://expensetracker-backend.onrender.com/api';
        return envURL || defaultURL;
    }

    getStoredToken() {
        return localStorage.getItem('expenseTrackerToken');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('expenseTrackerToken', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('expenseTrackerToken');
    }

    init() {
        console.log('🚀 ExpenseTracker API Client initialized');
        console.log('📡 API Base URL:', this.baseURL);
        console.log('🔐 Token:', this.token ? 'Present' : 'Not found');
        console.log('🌐 Online:', this.isOnline);
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add authentication token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            if (!this.isOnline) {
                throw new Error('No internet connection');
            }

            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            
            // Return offline data if available
            if (!this.isOnline && options.fallback) {
                return this.getOfflineData(endpoint);
            }
            
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        try {
            const response = await this.makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (response.data.token) {
                this.setToken(response.data.token);
            }

            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            const response = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });

            if (response.data.token) {
                this.setToken(response.data.token);
            }

            return response;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.makeRequest('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            this.clearToken();
        }
    }

    async getCurrentUser() {
        try {
            const response = await this.makeRequest('/auth/me');
            return response.data.user;
        } catch (error) {
            console.error('Get current user failed:', error);
            throw error;
        }
    }

    // Transaction methods
    async getTransactions(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await this.makeRequest(`/transactions?${queryParams}`, {
                fallback: true
            });
            return response.data.transactions;
        } catch (error) {
            console.error('Get transactions failed:', error);
            return this.getOfflineData('/transactions');
        }
    }

    async createTransaction(transactionData) {
        try {
            const response = await this.makeRequest('/transactions', {
                method: 'POST',
                body: JSON.stringify(transactionData)
            });

            // Store in offline cache
            this.cacheTransaction(response.data.transaction);

            return response.data.transaction;
        } catch (error) {
            console.error('Create transaction failed:', error);
            
            // Store for later sync
            this.queueOfflineTransaction(transactionData);
            
            // Return the transaction with a temporary ID
            return {
                ...transactionData,
                _id: `temp_${Date.now()}`,
                user: 'temp_user',
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
    }

    async updateTransaction(id, transactionData) {
        try {
            const response = await this.makeRequest(`/transactions/${id}`, {
                method: 'PUT',
                body: JSON.stringify(transactionData)
            });

            // Update offline cache
            this.updateCachedTransaction(id, response.data.transaction);

            return response.data.transaction;
        } catch (error) {
            console.error('Update transaction failed:', error);
            throw error;
        }
    }

    async deleteTransaction(id) {
        try {
            await this.makeRequest(`/transactions/${id}`, {
                method: 'DELETE'
            });

            // Remove from offline cache
            this.removeCachedTransaction(id);

            return true;
        } catch (error) {
            console.error('Delete transaction failed:', error);
            
            // Mark for deletion when online
            this.queueTransactionDeletion(id);
            
            // Remove from local cache immediately
            this.removeCachedTransaction(id);
            
            return true;
        }
    }

    // Category methods
    async getCategories(type = null) {
        try {
            const query = type ? `?type=${type}` : '';
            const response = await this.makeRequest(`/categories${query}`, {
                fallback: true
            });
            return response.data.categories;
        } catch (error) {
            console.error('Get categories failed:', error);
            return this.getOfflineData('/categories');
        }
    }

    async createCategory(categoryData) {
        try {
            const response = await this.makeRequest('/categories', {
                method: 'POST',
                body: JSON.stringify(categoryData)
            });

            return response.data.category;
        } catch (error) {
            console.error('Create category failed:', error);
            throw error;
        }
    }

    // Analytics methods
    async getDashboardAnalytics(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters);
            const response = await this.makeRequest(`/analytics/dashboard?${queryParams}`, {
                fallback: true
            });
            return response.data;
        } catch (error) {
            console.error('Get dashboard analytics failed:', error);
            return this.getOfflineAnalytics();
        }
    }

    async getTrends(period = 'monthly', filters = {}) {
        try {
            const queryParams = new URLSearchParams({ period, ...filters });
            const response = await this.makeRequest(`/analytics/trends?${queryParams}`);
            return response.data;
        } catch (error) {
            console.error('Get trends failed:', error);
            throw error;
        }
    }

    // Report methods
    async generateReport(startDate, endDate, period = 'custom') {
        try {
            const response = await this.makeRequest('/reports/generate', {
                method: 'POST',
                body: JSON.stringify({ startDate, endDate, period })
            });
            return response.data.report;
        } catch (error) {
            console.error('Generate report failed:', error);
            throw error;
        }
    }

    async getLatestReport(period = 'monthly') {
        try {
            const response = await this.makeRequest(`/reports/latest/${period}`);
            return response.data.report;
        } catch (error) {
            console.error('Get latest report failed:', error);
            return null;
        }
    }

    // Offline data management
    getOfflineData(endpoint) {
        const cacheKey = `offline_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch (error) {
                console.error('Failed to parse offline data:', error);
            }
        }
        
        return [];
    }

    cacheData(endpoint, data) {
        const cacheKey = `offline_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
        localStorage.setItem(cacheKey, JSON.stringify(data));
    }

    cacheTransaction(transaction) {
        const transactions = this.getOfflineData('/transactions');
        transactions.unshift(transaction);
        this.cacheData('/transactions', transactions);
    }

    updateCachedTransaction(id, updatedTransaction) {
        const transactions = this.getOfflineData('/transactions');
        const index = transactions.findIndex(t => t._id === id);
        if (index !== -1) {
            transactions[index] = updatedTransaction;
            this.cacheData('/transactions', transactions);
        }
    }

    removeCachedTransaction(id) {
        const transactions = this.getOfflineData('/transactions');
        const filtered = transactions.filter(t => t._id !== id);
        this.cacheData('/transactions', filtered);
    }

    queueOfflineTransaction(transactionData) {
        const queue = JSON.parse(localStorage.getItem('offline_transaction_queue') || '[]');
        queue.push({
            ...transactionData,
            queuedAt: new Date().toISOString()
        });
        localStorage.setItem('offline_transaction_queue', JSON.stringify(queue));
    }

    queueTransactionDeletion(id) {
        const queue = JSON.parse(localStorage.getItem('offline_deletion_queue') || '[]');
        queue.push({
            id,
            queuedAt: new Date().toISOString()
        });
        localStorage.setItem('offline_deletion_queue', JSON.stringify(queue));
    }

    async syncOfflineData() {
        console.log('🔄 Syncing offline data...');
        
        try {
            // Sync queued transactions
            const transactionQueue = JSON.parse(localStorage.getItem('offline_transaction_queue') || '[]');
            for (const transaction of transactionQueue) {
                try {
                    await this.createTransaction(transaction);
                    console.log('✅ Synced transaction:', transaction.description);
                } catch (error) {
                    console.error('❌ Failed to sync transaction:', error);
                }
            }
            
            // Sync queued deletions
            const deletionQueue = JSON.parse(localStorage.getItem('offline_deletion_queue') || '[]');
            for (const deletion of deletionQueue) {
                try {
                    await this.deleteTransaction(deletion.id);
                    console.log('✅ Synced deletion:', deletion.id);
                } catch (error) {
                    console.error('❌ Failed to sync deletion:', error);
                }
            }
            
            // Clear queues after successful sync
            localStorage.removeItem('offline_transaction_queue');
            localStorage.removeItem('offline_deletion_queue');
            
            console.log('✅ Offline data sync completed');
        } catch (error) {
            console.error('❌ Offline data sync failed:', error);
        }
    }

    getOfflineAnalytics() {
        const transactions = this.getOfflineData('/transactions');
        const categories = this.getOfflineData('/categories');
        
        // Calculate basic analytics from offline data
        const summary = {
            totalIncome: 0,
            totalExpense: 0,
            netBalance: 0,
            totalTransactions: transactions.length
        };

        const categoryBreakdown = {};

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                summary.totalIncome += transaction.amount;
            } else {
                summary.totalExpense += transaction.amount;
            }

            // Category breakdown
            const categoryName = transaction.category?.name || 'Unknown';
            if (!categoryBreakdown[categoryName]) {
                categoryBreakdown[categoryName] = {
                    total: 0,
                    count: 0
                };
            }
            categoryBreakdown[categoryName].total += transaction.amount;
            categoryBreakdown[categoryName].count += 1;
        });

        summary.netBalance = summary.totalIncome - summary.totalExpense;

        return {
            summary,
            categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]) => ({
                category: { name },
                ...data
            })),
            monthlyTrends: [],
            recentTransactions: transactions.slice(0, 5)
        };
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.makeRequest('/health');
            return response.status === 'success';
        } catch (error) {
            return false;
        }
    }

    // Test connection
    async testConnection() {
        console.log('🔍 Testing backend connection...');
        
        try {
            const isHealthy = await this.healthCheck();
            if (isHealthy) {
                console.log('✅ Backend connection successful');
                return true;
            } else {
                console.log('❌ Backend health check failed');
                return false;
            }
        } catch (error) {
            console.log('❌ Backend connection failed:', error.message);
            return false;
        }
    }
}

// Initialize API client
window.ExpenseTrackerAPI = new ExpenseTrackerAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpenseTrackerAPI;
}
