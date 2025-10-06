/**
 * ExpenseTracker Pro - Simple Backend Server (Without MongoDB)
 * For demo and development purposes
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com"]
        }
    }
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    }
});

app.use('/api/v1/', limiter);

// CORS configuration
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'ExpenseTracker Pro API is running (Demo Mode)',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0-demo',
        mode: 'demo-without-mongodb'
    });
});

// Demo Auth Routes
app.post('/api/v1/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Demo validation
    if (!email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Email and password are required'
        });
    }
    
    // Demo user
    const demoUser = {
        id: 'demo-user-123',
        name: 'Demo User',
        email: email,
        isGuest: false
    };
    
    res.json({
        status: 'success',
        message: 'Login successful (Demo Mode)',
        data: {
            user: demoUser,
            tokens: {
                accessToken: 'demo-access-token-' + Date.now(),
                refreshToken: 'demo-refresh-token-' + Date.now()
            }
        }
    });
});

app.post('/api/v1/auth/register', (req, res) => {
    const { email, password } = req.body;
    
    // Demo validation
    if (!email || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Email and password are required'
        });
    }
    
    // Demo user
    const demoUser = {
        id: 'demo-user-' + Date.now(),
        name: 'Demo User',
        email: email,
        isGuest: false
    };
    
    res.status(201).json({
        status: 'success',
        message: 'Account created successfully (Demo Mode)',
        data: {
            user: demoUser,
            tokens: {
                accessToken: 'demo-access-token-' + Date.now(),
                refreshToken: 'demo-refresh-token-' + Date.now()
            }
        }
    });
});

app.post('/api/v1/auth/logout', (req, res) => {
    res.json({
        status: 'success',
        message: 'Logout successful (Demo Mode)'
    });
});

app.get('/api/v1/auth/validate-token', (req, res) => {
    // Demo token validation
    const demoUser = {
        id: 'demo-user-123',
        name: 'Demo User',
        email: 'demo@example.com',
        isGuest: false
    };
    
    res.json({
        status: 'success',
        data: {
            user: demoUser
        }
    });
});

// Demo OAuth Routes
app.get('/api/v1/auth/google', (req, res) => {
    res.json({
        status: 'info',
        message: 'Google OAuth not configured. Please set up Google OAuth credentials.',
        setup_guide: 'https://console.developers.google.com/',
        demo_mode: true
    });
});

app.get('/api/v1/auth/facebook', (req, res) => {
    res.json({
        status: 'info',
        message: 'Facebook OAuth not configured. Please set up Facebook OAuth credentials.',
        setup_guide: 'https://developers.facebook.com/',
        demo_mode: true
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to ExpenseTracker Pro API (Demo Mode)',
        version: '1.0.0-demo',
        mode: 'demo-without-mongodb',
        documentation: '/api/v1/docs',
        health: '/health',
        note: 'This is a demo version running without MongoDB. Install MongoDB for full functionality.'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: `Route ${req.originalUrl} not found`,
        demo_mode: true
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        demo_mode: true
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ExpenseTracker Pro API running on port ${PORT} (Demo Mode)`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 API base: http://localhost:${PORT}/api/v1`);
    console.log(`⚠️  Demo Mode: MongoDB not required`);
    console.log(`📝 Install MongoDB for full functionality`);
});

module.exports = app;
