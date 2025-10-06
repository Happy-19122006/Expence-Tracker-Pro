/**
 * Authentication Middleware for ExpenseTracker Pro
 * Handles JWT authentication, OAuth, and guest access
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Access token required'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token - user not found'
            });
        }
        
        if (!user.isActive) {
            return res.status(401).json({
                status: 'error',
                message: 'Account is deactivated'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired'
            });
        }
        
        return res.status(500).json({
            status: 'error',
            message: 'Authentication error'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (user && user.isActive) {
                req.user = user;
            }
        }
        
        next();
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
};

/**
 * Check if user is guest
 */
const requireGuest = (req, res, next) => {
    if (!req.user || !req.user.isGuest) {
        return res.status(403).json({
            status: 'error',
            message: 'Guest access required'
        });
    }
    next();
};

/**
 * Check if user is authenticated (not guest)
 */
const requireAuth = (req, res, next) => {
    if (!req.user || req.user.isGuest) {
        return res.status(403).json({
            status: 'error',
            message: 'Authenticated user access required'
        });
    }
    next();
};

/**
 * Check if user email is verified
 */
const requireEmailVerification = (req, res, next) => {
    if (!req.user || !req.user.isEmailVerified) {
        return res.status(403).json({
            status: 'error',
            message: 'Email verification required'
        });
    }
    next();
};

/**
 * Generate JWT tokens
 */
const generateTokens = (user) => {
    const payload = {
        userId: user._id,
        email: user.email,
        isGuest: user.isGuest || false
    };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
    
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
    });
    
    return { accessToken, refreshToken };
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid refresh token');
    }
};

/**
 * Rate limiting for authentication endpoints
 */
const authRateLimit = (req, res, next) => {
    const key = req.ip;
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;
    
    // This would typically use Redis or similar
    // For now, we'll rely on express-rate-limit middleware
    next();
};

/**
 * Check user permissions
 */
const checkPermissions = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
        }
        
        // For now, all authenticated users have access
        // In the future, implement role-based permissions
        next();
    };
};

/**
 * Sanitize user data for responses
 */
const sanitizeUser = (user) => {
    // Handle both Mongoose documents and plain objects
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;
    delete userObj.passwordResetToken;
    delete userObj.passwordResetExpires;
    delete userObj.emailVerificationToken;
    delete userObj.emailVerificationExpires;
    delete userObj.loginAttempts;
    delete userObj.lockUntil;
    
    return userObj;
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireGuest,
    requireAuth,
    requireEmailVerification,
    generateTokens,
    verifyRefreshToken,
    authRateLimit,
    checkPermissions,
    sanitizeUser
};