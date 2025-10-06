/**
 * User Routes for ExpenseTracker Pro
 * Handles user profile management and settings
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { sanitizeUser } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', async (req, res) => {
    try {
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

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('phone')
        .optional()
        .matches(/^[\+]?[1-9][\d]{0,15}$/)
        .withMessage('Please enter a valid phone number'),
    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please enter a valid date'),
    body('gender')
        .optional()
        .isIn(['male', 'female', 'other', 'prefer-not-to-say'])
        .withMessage('Invalid gender selection')
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

        const allowedUpdates = ['name', 'phone', 'dateOfBirth', 'gender', 'address'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            data: {
                user: sanitizeUser(user)
            }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update profile'
        });
    }
});

/**
 * @route   PUT /api/v1/users/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', [
    body('currency')
        .optional()
        .isIn(['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'])
        .withMessage('Invalid currency'),
    body('theme')
        .optional()
        .isIn(['light', 'dark', 'auto'])
        .withMessage('Invalid theme'),
    body('language')
        .optional()
        .isIn(['en', 'hi', 'es', 'fr', 'de'])
        .withMessage('Invalid language')
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

        const allowedUpdates = ['currency', 'theme', 'language', 'notifications'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[`preferences.${field}`] = req.body[field];
            }
        });

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        );

        res.json({
            status: 'success',
            message: 'Preferences updated successfully',
            data: {
                user: sanitizeUser(user)
            }
        });

    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update preferences'
        });
    }
});

/**
 * @route   PUT /api/v1/users/password
 * @desc    Change user password
 * @access  Private
 */
router.put('/password', [
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('New password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain uppercase, lowercase, number, and special character'),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
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

        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Check current password
        if (!await user.comparePassword(currentPassword)) {
            return res.status(400).json({
                status: 'error',
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            status: 'success',
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to change password'
        });
    }
});

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', [
    body('password')
        .notEmpty()
        .withMessage('Password is required to delete account')
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

        const { password } = req.body;

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Check password
        if (!await user.comparePassword(password)) {
            return res.status(400).json({
                status: 'error',
                message: 'Password is incorrect'
            });
        }

        // Deactivate account instead of deleting
        user.isActive = false;
        await user.save();

        res.json({
            status: 'success',
            message: 'Account deactivated successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete account'
        });
    }
});

/**
 * @route   POST /api/v1/users/upgrade-guest
 * @desc    Upgrade guest account to full account
 * @access  Private
 */
router.post('/upgrade-guest', [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
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

        // Check if user is actually a guest
        if (!req.user.isGuest) {
            return res.status(400).json({
                status: 'error',
                message: 'Account is already upgraded'
            });
        }

        const { name, email, password } = req.body;

        // Check if email is already taken
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is already registered'
            });
        }

        // Update guest user to full account
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                name,
                email,
                password,
                isGuest: false,
                isEmailVerified: false
            },
            { new: true, runValidators: true }
        );

        // Generate email verification token
        const verificationToken = user.createEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        // TODO: Send verification email

        res.json({
            status: 'success',
            message: 'Account upgraded successfully. Please verify your email.',
            data: {
                user: sanitizeUser(user)
            }
        });

    } catch (error) {
        console.error('Upgrade guest error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to upgrade account'
        });
    }
});

module.exports = router;
