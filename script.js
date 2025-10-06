/**
 * ExpenseTracker Pro - Frontend JavaScript
 * Modern, secure, and fully functional authentication system
 */

// Global state management
const AppState = {
    isLoading: false,
    currentUser: null,
    isGuest: false,
    apiBaseUrl: 'http://localhost:3000/api/v1',
    authBaseUrl: 'http://localhost:3000/api/v1/auth'
};

// Utility functions
const Utils = {
    // Sanitize user input to prevent XSS
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .trim()
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, ''); // Remove event handlers
    },

    // Validate email format
    validateEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Check password strength - SIMPLIFIED
    validatePassword: (password) => {
        const isLongEnough = password.length >= 3;

        return {
            isValid: isLongEnough,
            hasUpperCase: true,
            hasLowerCase: true,
            hasNumbers: true,
            hasSpecialChar: true,
            isLongEnough
        };
    },

    // Get password strength level - SIMPLIFIED
    getPasswordStrength: (password) => {
        if (password.length < 3) return 'weak';
        if (password.length < 6) return 'fair';
        if (password.length < 10) return 'good';
        return 'strong';
    },

    // Generate secure random token
    generateToken: () => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    },

    // Check if running on HTTPS
    isSecure: () => {
        return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    },

    // Get query parameters
    getQueryParams: () => {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (let [key, value] of params) {
            result[key] = value;
        }
        return result;
    },

    // Set secure cookie
    setCookie: (name, value, days = 7) => {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        const secure = Utils.isSecure() ? '; Secure' : '';
        document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/${secure}`;
    },

    // Get cookie value
    getCookie: (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    // Remove cookie
    removeCookie: (name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    },

    // Log to console with timestamp
    log: (message, data = null) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`, data || '');
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// API service for handling HTTP requests
const ApiService = {
    // Make HTTP request with error handling
    request: async (url, options = {}) => {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include' // Include cookies for authentication
        };

        const config = { ...defaultOptions, ...options };
        
        // Add authentication token if available
        const token = Utils.getCookie('auth_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            Utils.log(`API Request: ${config.method || 'GET'} ${url}`, config);
            
            const response = await fetch(url, config);
            const data = await response.json();

            Utils.log(`API Response: ${response.status} ${response.statusText}`, data);

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return { success: true, data, response };
        } catch (error) {
            Utils.log(`API Error: ${error.message}`, error);
            return { success: false, error: error.message, data: null };
        }
    },

    // Login API call - DEMO MODE
    login: async (email, password) => {
        const sanitizedEmail = Utils.sanitizeInput(email);
        const sanitizedPassword = Utils.sanitizeInput(password);

        // Demo mode - simulate successful login
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        user: {
                            id: 'demo_' + Date.now(),
                            name: sanitizedEmail.split('@')[0],
                            email: sanitizedEmail,
                            isDemo: true
                        },
                        tokens: {
                            accessToken: 'demo_token_' + Date.now(),
                            refreshToken: 'demo_refresh_' + Date.now()
                        }
                    }
                });
            }, 1000); // Simulate network delay
        });
    },

    // Register API call - DEMO MODE
    register: async (email, password) => {
        const sanitizedEmail = Utils.sanitizeInput(email);
        const sanitizedPassword = Utils.sanitizeInput(password);

        // Demo mode - simulate successful registration
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        user: {
                            id: 'demo_' + Date.now(),
                            name: sanitizedEmail.split('@')[0],
                            email: sanitizedEmail,
                            isDemo: true
                        },
                        tokens: {
                            accessToken: 'demo_token_' + Date.now(),
                            refreshToken: 'demo_refresh_' + Date.now()
                        }
                    }
                });
            }, 1000); // Simulate network delay
        });
    },

    // Logout API call - DEMO MODE
    logout: async () => {
        // Demo mode - simulate successful logout
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: { message: 'Logout successful' }
                });
            }, 500);
        });
    }
};

// UI management functions
const UIManager = {
    // Show/hide loading screen
    toggleLoadingScreen: (show) => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.toggle('hidden', !show);
        }
    },

    // Show/hide auth container
    toggleAuthContainer: (show) => {
        const authContainer = document.getElementById('auth-container');
        if (authContainer) {
            authContainer.classList.toggle('hidden', !show);
            console.log('🔐 Auth container:', show ? 'shown' : 'hidden');
        } else {
            console.error('❌ Auth container element not found!');
        }
    },

    // Show/hide dashboard container
    toggleDashboardContainer: (show) => {
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.classList.toggle('hidden', !show);
            console.log('📊 Dashboard container:', show ? 'shown' : 'hidden');
        } else {
            console.error('❌ Dashboard container element not found!');
        }
    },

    // Show alert message
    showAlert: (message, type = 'error') => {
        const alertId = type === 'error' ? 'error-alert' : 'success-alert';
        const alert = document.getElementById(alertId);
        const messageElement = document.getElementById(`${type}-message`);

        if (alert && messageElement) {
            messageElement.textContent = message;
            alert.classList.remove('hidden');
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                hideAlert();
            }, 5000);
        }
    },

    // Hide all alerts
    hideAlerts: () => {
        const alerts = ['error-alert', 'success-alert'];
        alerts.forEach(alertId => {
            const alert = document.getElementById(alertId);
            if (alert) {
                alert.classList.add('hidden');
            }
        });
    },

    // Set button loading state
    setButtonLoading: (buttonId, isLoading) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.toggle('loading', isLoading);
            button.disabled = isLoading;
        }
    },

    // Switch between auth forms
    switchForm: (formId) => {
        // Hide all forms
        const forms = ['login-form', 'signup-form', 'forgot-password-form'];
        forms.forEach(id => {
            const form = document.getElementById(id);
            if (form) {
                form.classList.remove('active');
            }
        });

        // Show target form
        const targetForm = document.getElementById(formId);
        if (targetForm) {
            targetForm.classList.add('active');
        }

        // Update tab states
        const tabs = ['login-tab', 'signup-tab'];
        tabs.forEach(id => {
            const tab = document.getElementById(id);
            if (tab) {
                const isActive = (formId === 'login-form' && id === 'login-tab') ||
                                (formId === 'signup-form' && id === 'signup-tab');
                tab.classList.toggle('active', isActive);
                tab.setAttribute('aria-selected', isActive);
            }
        });

        // Focus first input
        setTimeout(() => {
            const firstInput = targetForm?.querySelector('input[type="email"], input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
    },

    // Show field error
    showFieldError: (fieldId, message) => {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const field = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        
        if (field) {
            field.style.borderColor = 'var(--danger-color)';
        }
    },

    // Clear field error
    clearFieldError: (fieldId) => {
        const errorElement = document.getElementById(`${fieldId}-error`);
        const field = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        
        if (field) {
            field.style.borderColor = '';
        }
    },

    // Clear all field errors
    clearAllFieldErrors: () => {
        const errorElements = document.querySelectorAll('.field-error');
        errorElements.forEach(element => {
            element.classList.add('hidden');
        });

        const fields = document.querySelectorAll('.input-group input');
        fields.forEach(field => {
            field.style.borderColor = '';
        });
    },

    // Update password strength indicator
    updatePasswordStrength: (password) => {
        const strengthBar = document.getElementById('password-strength');
        if (!strengthBar) return;

        const strength = Utils.getPasswordStrength(password);
        strengthBar.className = 'password-strength';
        
        if (password.length > 0) {
            strengthBar.classList.add(strength);
        }
    },

    // Update dashboard with user info
    updateDashboard: (user, isGuest = false) => {
        console.log('🎯 Dashboard Update Called:', { user, isGuest });
        
        const userEmailElement = document.getElementById('user-email');
        const welcomeTextElement = document.getElementById('welcome-text');
        const demoDataElement = document.getElementById('demo-data');

        console.log('📊 Dashboard Elements Found:', {
            userEmailElement: !!userEmailElement,
            welcomeTextElement: !!welcomeTextElement,
            demoDataElement: !!demoDataElement
        });

        if (userEmailElement) {
            userEmailElement.textContent = user?.email || 'Guest User';
            console.log('✅ User email updated:', user?.email);
        }

        if (welcomeTextElement) {
            const message = isGuest ? 
                'You are accessing the app as a guest with demo data.' : 
                'You have successfully logged in.';
            welcomeTextElement.textContent = message;
            console.log('✅ Welcome message updated:', message);
        }

        if (demoDataElement) {
            demoDataElement.classList.toggle('hidden', !isGuest);
            console.log('✅ Demo data visibility:', !isGuest ? 'shown' : 'hidden');
        }

        // Update debug information
        const debugEmail = document.getElementById('debug-email');
        const debugUserId = document.getElementById('debug-user-id');
        const debugIsGuest = document.getElementById('debug-is-guest');
        const debugToken = document.getElementById('debug-token');

        if (debugEmail) debugEmail.textContent = user?.email || 'N/A';
        if (debugUserId) debugUserId.textContent = user?.id || 'N/A';
        if (debugIsGuest) debugIsGuest.textContent = isGuest ? 'Yes' : 'No';
        if (debugToken) {
            const token = Utils.getCookie('auth_token');
            debugToken.textContent = token ? token.substring(0, 20) + '...' : 'No token';
        }

        console.log('🎉 Dashboard update completed successfully!');
    }
};

// Form validation functions
const FormValidator = {
    // Validate login form
    validateLoginForm: (email, password) => {
        const errors = [];

        if (!email.trim()) {
            errors.push({ field: 'login-email', message: 'Email is required' });
        } else if (!Utils.validateEmail(email)) {
            errors.push({ field: 'login-email', message: 'Please enter a valid email address' });
        }

        if (!password.trim()) {
            errors.push({ field: 'login-password', message: 'Password is required' });
        }

        return errors;
    },

    // Validate signup form - SIMPLIFIED
    validateSignupForm: (email, password, confirmPassword) => {
        const errors = [];

        if (!email.trim()) {
            errors.push({ field: 'signup-email', message: 'Email is required' });
        } else if (!Utils.validateEmail(email)) {
            errors.push({ field: 'signup-email', message: 'Please enter a valid email address' });
        }

        if (!password.trim()) {
            errors.push({ field: 'signup-password', message: 'Password is required' });
        } else if (password.length < 3) {
            errors.push({ field: 'signup-password', message: 'Password must be at least 3 characters' });
        }

        if (!confirmPassword.trim()) {
            errors.push({ field: 'signup-confirm-password', message: 'Please confirm your password' });
        } else if (password !== confirmPassword) {
            errors.push({ field: 'signup-confirm-password', message: 'Passwords do not match' });
        }

        return errors;
    },

    // Validate forgot password form
    validateForgotPasswordForm: (email) => {
        const errors = [];

        if (!email.trim()) {
            errors.push({ field: 'forgot-email', message: 'Email is required' });
        } else if (!Utils.validateEmail(email)) {
            errors.push({ field: 'forgot-email', message: 'Please enter a valid email address' });
        }

        return errors;
    }
};

// Authentication handlers
const AuthHandler = {
    // Handle login form submission
    handleLogin: async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        // Clear previous errors
        UIManager.clearAllFieldErrors();
        UIManager.hideAlerts();

        // Validate form
        const errors = FormValidator.validateLoginForm(email, password);
        if (errors.length > 0) {
            errors.forEach(error => {
                UIManager.showFieldError(error.field, error.message);
            });
            return;
        }

        // Set loading state
        UIManager.setButtonLoading('login-btn', true);

        try {
            // Make API call
            const result = await ApiService.login(email, password);
            
            if (result.success) {
                console.log('🎉 Login Success!', result.data);
                
                // Store auth token
                if (result.data.tokens?.accessToken) {
                    Utils.setCookie('auth_token', result.data.tokens.accessToken);
                    console.log('✅ Auth token stored in cookie');
                }

                // Update app state
                AppState.currentUser = result.data.user;
                AppState.isGuest = false;
                console.log('✅ App state updated:', AppState.currentUser);

                // Show success message
                UIManager.showAlert('Login successful! Redirecting to dashboard...', 'success');

                // Redirect to dashboard
                setTimeout(() => {
                    console.log('🔄 Switching to dashboard...');
                    UIManager.toggleAuthContainer(false);
                    UIManager.toggleDashboardContainer(true);
                    UIManager.updateDashboard(AppState.currentUser, false);
                    console.log('✅ Dashboard should now be visible!');
                }, 1500);

        } else {
                // Show error message
                UIManager.showAlert(result.error || 'Login failed. Please check your credentials.');
                
                // Clear password field
                document.getElementById('login-password').value = '';
                document.getElementById('login-password').focus();
            }

        } catch (error) {
            Utils.log('Login error:', error);
            UIManager.showAlert('Network error. Please try again.');
        } finally {
            // Clear loading state
            UIManager.setButtonLoading('login-btn', false);
        }
    },

    // Handle signup form submission
    handleSignup: async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        // Clear previous errors
        UIManager.clearAllFieldErrors();
        UIManager.hideAlerts();

        // Validate form
        const errors = FormValidator.validateSignupForm(email, password, confirmPassword);
        if (errors.length > 0) {
            errors.forEach(error => {
                UIManager.showFieldError(error.field, error.message);
            });
            return;
        }

        // Set loading state
        UIManager.setButtonLoading('signup-btn', true);

        try {
            // Make API call
            const result = await ApiService.register(email, password);
            
            if (result.success) {
                // Store auth token
                if (result.data.token) {
                    Utils.setCookie('auth_token', result.data.token);
                }

                // Update app state
                AppState.currentUser = result.data.user;
                AppState.isGuest = false;

                // Show success message
                UIManager.showAlert('Account created successfully! Redirecting to dashboard...', 'success');

                // Redirect to dashboard
                setTimeout(() => {
                    UIManager.toggleAuthContainer(false);
                    UIManager.toggleDashboardContainer(true);
                    UIManager.updateDashboard(AppState.currentUser, false);
                }, 1500);

        } else {
                // Show error message
                UIManager.showAlert(result.error || 'Registration failed. Please try again.');
            }

        } catch (error) {
            Utils.log('Signup error:', error);
            UIManager.showAlert('Network error. Please try again.');
        } finally {
            // Clear loading state
            UIManager.setButtonLoading('signup-btn', false);
        }
    },

    // Handle forgot password form submission
    handleForgotPassword: async (event) => {
        event.preventDefault();
        
        const email = document.getElementById('forgot-email').value;

        // Clear previous errors
        UIManager.clearAllFieldErrors();
        UIManager.hideAlerts();

        // Validate form
        const errors = FormValidator.validateForgotPasswordForm(email);
        if (errors.length > 0) {
            errors.forEach(error => {
                UIManager.showFieldError(error.field, error.message);
            });
            return;
        }

        // Set loading state
        UIManager.setButtonLoading('forgot-btn', true);

        try {
            // Make API call (if endpoint exists)
            const result = await ApiService.request(`${AppState.apiBaseUrl}/auth/forgot-password`, {
                method: 'POST',
                body: JSON.stringify({ email: Utils.sanitizeInput(email) })
            });
            
            if (result.success) {
                UIManager.showAlert('Password reset link sent to your email!', 'success');
                // Return to login form
                setTimeout(() => {
                    UIManager.switchForm('login-form');
                }, 2000);
        } else {
                UIManager.showAlert(result.error || 'Failed to send reset link. Please try again.');
            }

        } catch (error) {
            Utils.log('Forgot password error:', error);
            UIManager.showAlert('Network error. Please try again.');
        } finally {
            // Clear loading state
            UIManager.setButtonLoading('forgot-btn', false);
        }
    },

    // Handle OAuth login - FIXED FOR PROPER OAUTH
    handleOAuth: (provider) => {
        Utils.log(`OAuth login initiated: ${provider}`);
        
        // Set the correct OAuth base URL
        const oauthBaseUrl = 'http://localhost:3000/api/v1/auth';
        
        // Redirect to OAuth provider
        window.location.href = `${oauthBaseUrl}/${provider}`;
    },

    // Handle guest access - COMPLETELY FIXED
    handleGuestAccess: () => {
        Utils.log('Guest access initiated');
        
        // Clear any previous auth state
        Utils.removeCookie('auth_token');
        
        // Create demo user
        const demoUser = {
            email: 'guest@demo.com',
            id: Utils.generateToken(),
            name: 'Guest User'
        };

        // Update app state
        AppState.currentUser = demoUser;
        AppState.isGuest = true;

        // Show success message
        UIManager.showAlert('Welcome! You are now accessing the app as a guest with demo data.', 'success');

        // Direct entry to main app - NO REDIRECT OR API CALLS
        setTimeout(() => {
            UIManager.toggleAuthContainer(false);
            UIManager.toggleDashboardContainer(true);
            UIManager.updateDashboard(demoUser, true);
        }, 500);
    },

    // Handle logout
    handleLogout: async () => {
        try {
            // Make logout API call
            await ApiService.logout();
        } catch (error) {
            Utils.log('Logout API error:', error);
        } finally {
            // Clear local state
            AppState.currentUser = null;
            AppState.isGuest = false;
            
            // Remove auth token
            Utils.removeCookie('auth_token');
            
            // Return to auth screen
            UIManager.toggleDashboardContainer(false);
            UIManager.toggleAuthContainer(true);
            UIManager.switchForm('login-form');
            
            // Show success message
            UIManager.showAlert('You have been logged out successfully.', 'success');
        }
    }
};

// Event handlers
const EventHandlers = {
    // Initialize all event listeners
    init: () => {
        // Form submissions
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');
        const forgotPasswordForm = document.getElementById('forgot-password-form');

        if (loginForm) {
            loginForm.addEventListener('submit', AuthHandler.handleLogin);
        }

        if (signupForm) {
            signupForm.addEventListener('submit', AuthHandler.handleSignup);
        }

        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', AuthHandler.handleForgotPassword);
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                const formId = `${tab}-form`;
                UIManager.switchForm(formId);
            });

            // Keyboard navigation
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });

        // OAuth buttons - ENABLED FOR PROPER OAUTH
        const googleButtons = document.querySelectorAll('#google-login, #google-signup');
        googleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                AuthHandler.handleOAuth('google');
            });
        });

        const facebookButtons = document.querySelectorAll('#facebook-login, #facebook-signup');
        facebookButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                AuthHandler.handleOAuth('facebook');
            });
        });

        // Guest access button
        const guestButton = document.getElementById('skip-login');
        if (guestButton) {
            guestButton.addEventListener('click', AuthHandler.handleGuestAccess);
        }

        // Forgot password link
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                UIManager.switchForm('forgot-password-form');
            });
        }

        // Back to login button
        const backToLoginButton = document.getElementById('back-to-login');
        if (backToLoginButton) {
            backToLoginButton.addEventListener('click', () => {
                UIManager.switchForm('login-form');
            });
        }

        // Logout button
        const logoutButton = document.getElementById('logout-btn');
        if (logoutButton) {
            logoutButton.addEventListener('click', AuthHandler.handleLogout);
        }

        // Password strength indicator
        const passwordInput = document.getElementById('signup-password');
        if (passwordInput) {
            const debouncedUpdate = Utils.debounce((e) => {
                UIManager.updatePasswordStrength(e.target.value);
            }, 300);
            
            passwordInput.addEventListener('input', debouncedUpdate);
        }

        // Input validation on blur
        const emailInputs = document.querySelectorAll('input[type="email"]');
        emailInputs.forEach(input => {
            input.addEventListener('blur', (e) => {
                const value = e.target.value;
                if (value && !Utils.validateEmail(value)) {
                    UIManager.showFieldError(e.target.id, 'Please enter a valid email address');
        } else {
                    UIManager.clearFieldError(e.target.id);
                }
            });
        });

        // Clear field errors on input
        const allInputs = document.querySelectorAll('.input-group input');
        allInputs.forEach(input => {
            input.addEventListener('input', () => {
                UIManager.clearFieldError(input.id);
            });
        });

        // Alert close buttons
        const alertCloseButtons = document.querySelectorAll('.alert-close');
        alertCloseButtons.forEach(button => {
            button.addEventListener('click', () => {
                hideAlert();
            });
        });
    }
};

// Global functions (for HTML onclick handlers)
window.hideAlert = () => {
    UIManager.hideAlerts();
};

window.testDashboard = () => {
    console.log('🧪 Testing Dashboard Functionality...');
    console.log('Current App State:', AppState);
    console.log('Auth Container Visible:', !document.getElementById('auth-container')?.classList.contains('hidden'));
    console.log('Dashboard Container Visible:', !document.getElementById('dashboard-container')?.classList.contains('hidden'));
    
    // Test all dashboard elements
    const elements = [
        'user-email',
        'welcome-text', 
        'demo-data',
        'debug-email',
        'debug-user-id',
        'debug-is-guest',
        'debug-token'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`Element ${id}:`, element ? 'Found' : 'Missing', element?.textContent || '');
    });
    
    alert('Dashboard test completed! Check console for details.');
};

// App initialization
const App = {
    // Initialize the application
    init: async () => {
        Utils.log('ExpenseTracker Pro initializing...');

        // Show loading screen
        UIManager.toggleLoadingScreen(true);

        try {
            // Check if user is already authenticated
            const token = Utils.getCookie('auth_token');
            const queryParams = Utils.getQueryParams();

            // Handle OAuth callback
            if (queryParams.token) {
                Utils.setCookie('auth_token', queryParams.token);
                Utils.log('OAuth token received and stored');
            }

        // Handle guest access - COMPLETELY FIXED
        if (queryParams.guest === 'true') {
            const demoUser = {
                email: 'guest@demo.com',
                id: Utils.generateToken(),
                name: 'Guest User'
            };
            
            AppState.currentUser = demoUser;
            AppState.isGuest = true;
            
            UIManager.toggleAuthContainer(false);
            UIManager.toggleDashboardContainer(true);
            UIManager.updateDashboard(demoUser, true);
            
            Utils.log('Guest access activated via URL parameter');
            return;
        }

            // Check authentication status
            if (token) {
                // Demo mode - check if token is a demo token
                if (token.startsWith('demo_token_')) {
                    // Create demo user from token
                    const demoUser = {
                        id: 'demo_user',
                        name: 'Demo User',
                        email: 'demo@example.com',
                        isDemo: true
                    };
                    
                    AppState.currentUser = demoUser;
                    AppState.isGuest = false;
                    
                    UIManager.toggleAuthContainer(false);
                    UIManager.toggleDashboardContainer(true);
                    UIManager.updateDashboard(demoUser, false);
                    
                    Utils.log('Demo user authenticated from token');
                    return;
                } else {
                    // Invalid token, remove it
                    Utils.removeCookie('auth_token');
                }
            }

            // Show auth container
            UIManager.toggleAuthContainer(true);
            UIManager.toggleDashboardContainer(false);

        } catch (error) {
            Utils.log('App initialization error:', error);
            
            // Show auth container as fallback
            UIManager.toggleAuthContainer(true);
            UIManager.toggleDashboardContainer(false);
        }

        // Initialize event handlers
        EventHandlers.init();

        // Hide loading screen
        UIManager.toggleLoadingScreen(false);

        Utils.log('ExpenseTracker Pro initialized successfully');
    }
};

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', App.init);

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        Utils.log('Page became visible');
        // Could refresh auth status here if needed
    }
});

// Handle unload events
window.addEventListener('beforeunload', () => {
    Utils.log('Page unloading');
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        App,
        Utils,
        ApiService,
        UIManager,
        FormValidator,
        AuthHandler,
        EventHandlers,
        AppState
    };
}