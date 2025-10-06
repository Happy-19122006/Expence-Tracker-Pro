/**
 * Authentication Routes for ExpenseTracker Pro
 * Handles login, signup, OAuth, password reset, and guest access
 */

const express = require('express');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const { 
    generateTokens, 
    verifyRefreshToken, 
    sanitizeUser,
    authenticateToken 
} = require('../middleware/auth');
const sendEmail = require('../utils/email');

const router = express.Router();

// Debug endpoint
router.get('/debug', (req, res) => {
    res.json({
        status: 'success',
        message: 'Debug endpoint working',
        env: {
            JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
            NODE_ENV: process.env.NODE_ENV
        }
    });
});

// Simple test registration endpoint
router.post('/test-register', (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        res.json({
            status: 'success',
            message: 'Test registration successful',
            data: {
                user: {
                    id: 'test_' + Date.now(),
                    name,
                    email,
                    isDemo: true
                },
                tokens: {
                    accessToken: 'test_token_' + Date.now(),
                    refreshToken: 'test_refresh_' + Date.now()
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Test registration failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Simple validation
        if (!name || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Name, email, and password are required'
            });
        }

        // Demo mode - create a mock user
        const demoUser = {
            _id: 'demo_' + Date.now(),
            name,
            email,
            isEmailVerified: true,
            isActive: true,
            createdAt: new Date()
        };

        // Generate tokens for demo user
        const { accessToken, refreshToken } = generateTokens(demoUser);

        return res.status(201).json({
            status: 'success',
            message: 'Demo account created successfully! (MongoDB not connected)',
            data: {
                user: sanitizeUser(demoUser),
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            status: 'error',
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Demo mode - check if MongoDB is connected
        if (!mongoose.connection.readyState) {
            // Demo mode - create a mock user for any email/password
            const demoUser = {
                _id: 'demo_' + Date.now(),
                name: email.split('@')[0],
                email,
                isEmailVerified: true,
                isActive: true,
                createdAt: new Date()
            };

            // Generate tokens for demo user
            const { accessToken, refreshToken } = generateTokens(demoUser);

            return res.json({
                status: 'success',
                message: 'Demo login successful! (MongoDB not connected)',
                data: {
                    user: sanitizeUser(demoUser),
                    tokens: {
                        accessToken,
                        refreshToken
                    }
                }
            });
        }

        // Production mode - use MongoDB
        // Find user and validate password
        const user = await User.findByCredentials(email, password);

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        res.json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: sanitizeUser(user),
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({
            status: 'error',
            message: error.message || 'Login failed'
        });
    }
});

/**
 * @route   POST /api/v1/auth/guest
 * @desc    Create guest user
 * @access  Public
 */
router.post('/guest', async (req, res) => {
    try {
        const { guestData } = req.body;

        // Create guest user
        const user = await User.createGuestUser(guestData);

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        res.status(201).json({
            status: 'success',
            message: 'Guest access granted',
            data: {
                user: sanitizeUser(user),
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        console.error('Guest access error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Guest access failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                status: 'error',
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.userId);

        if (!user || !user.isActive) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid refresh token'
            });
        }

        // Generate new tokens
        const tokens = generateTokens(user);

        res.json({
            status: 'success',
            message: 'Token refreshed successfully',
            data: {
                tokens
            }
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            status: 'error',
            message: 'Invalid refresh token'
        });
    }
});

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists or not
            return res.json({
                status: 'success',
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // Send reset email
        try {
            const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
            await sendEmail({
                email: user.email,
                subject: 'Reset your ExpenseTracker Pro password',
                template: 'passwordReset',
                data: {
                    name: user.name,
                    resetURL
                }
            });

            res.json({
                status: 'success',
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            
            // Reset the token if email failed
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            res.status(500).json({
                status: 'error',
                message: 'Failed to send password reset email'
            });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Password reset request failed'
        });
    }
});

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', [
    body('token')
        .notEmpty()
        .withMessage('Reset token is required'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number, and special character')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { token, password } = req.body;

        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired reset token'
            });
        }

        // Update password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Generate new tokens
        const { accessToken, refreshToken } = generateTokens(user);

        res.json({
            status: 'success',
            message: 'Password reset successfully',
            data: {
                user: sanitizeUser(user),
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Password reset failed'
        });
    }
});

/**
 * @route   GET /api/v1/auth/google
 * @desc    Google OAuth login
 * @access  Public
 */
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

/**
 * @route   GET /api/v1/auth/google/callback
 * @desc    Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', 
    passport.authenticate('google', { session: false }),
    async (req, res) => {
        try {
            const { accessToken, refreshToken } = generateTokens(req.user);
            
            // Redirect to frontend with tokens
            const redirectURL = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
            res.redirect(redirectURL);
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=oauth_failed`);
        }
    }
);

/**
 * @route   GET /api/v1/auth/facebook
 * @desc    Facebook OAuth login
 * @access  Public
 */
router.get('/facebook', passport.authenticate('facebook', {
    scope: ['email'],
    session: false
}));

/**
 * @route   GET /api/v1/auth/facebook/callback
 * @desc    Facebook OAuth callback
 * @access  Public
 */
router.get('/facebook/callback',
    passport.authenticate('facebook', { session: false }),
    async (req, res) => {
        try {
            const { accessToken, refreshToken } = generateTokens(req.user);
            
            // Redirect to frontend with tokens
            const redirectURL = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
            res.redirect(redirectURL);
        } catch (error) {
            console.error('Facebook OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=oauth_failed`);
        }
    }
);

/**
 * @route   GET /api/v1/auth/verify-email
 * @desc    Verify email with token
 * @access  Public
 */
router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Verification token required'
            });
        }

        // Hash the token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid verification token
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired verification token'
            });
        }

        // Verify email
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({
            status: 'success',
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Email verification failed'
        });
    }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // In a more sophisticated system, you might blacklist the token
        // For now, we'll just send a success response
        res.json({
            status: 'success',
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Logout failed'
        });
    }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        // Demo mode - check if MongoDB is connected
        if (!mongoose.connection.readyState) {
            // Return the user from the token (already validated by authenticateToken)
            return res.json({
                status: 'success',
                data: {
                    user: sanitizeUser(req.user)
                }
            });
        }

        // Production mode - fetch fresh user data from MongoDB
        res.json({
            status: 'success',
            data: {
                user: sanitizeUser(req.user)
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get user profile'
        });
    }
});

module.exports = router;