/**
 * User Model for ExpenseTracker Pro
 * Handles user authentication, OAuth, and profile data
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // Basic user information
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Don't include password in queries by default
    },
    
    // Profile information
    avatar: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null,
        match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer-not-to-say'],
        default: 'prefer-not-to-say'
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    
    // Account status and verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: null
    },
    emailVerificationExpires: {
        type: Date,
        default: null
    },
    
    // Password reset
    passwordResetToken: {
        type: String,
        default: null
    },
    passwordResetExpires: {
        type: Date,
        default: null
    },
    
    // OAuth providers
    googleId: {
        type: String,
        default: null
    },
    facebookId: {
        type: String,
        default: null
    },
    
    // Account preferences
    preferences: {
        currency: {
            type: String,
            default: 'INR',
            enum: ['USD', 'INR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
        },
        theme: {
            type: String,
            default: 'light',
            enum: ['light', 'dark', 'auto']
        },
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'hi', 'es', 'fr', 'de']
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            },
            sms: {
                type: Boolean,
                default: false
            }
        }
    },
    
    // Security and activity
    lastLogin: {
        type: Date,
        default: Date.now
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Guest access
    isGuest: {
        type: Boolean,
        default: false
    },
    guestData: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ facebookId: 1 });
userSchema.index({ 'preferences.currency': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    // Only hash password if it's been modified (or is new)
    if (!this.isModified('password')) return next();
    
    try {
        // Hash password with cost of 12
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-save middleware to clean up sensitive data
userSchema.pre('save', function(next) {
    // Clear password reset tokens if password is changed
    if (this.isModified('password') && !this.isNew) {
        this.passwordResetToken = undefined;
        this.passwordResetExpires = undefined;
    }
    
    // Clear email verification token if email is verified
    if (this.isModified('isEmailVerified') && this.isEmailVerified) {
        this.emailVerificationToken = undefined;
        this.emailVerificationExpires = undefined;
    }
    
    next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

// Instance method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    this.emailVerificationToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');
    
    this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    
    return verificationToken;
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Static method to find user by email or OAuth ID
userSchema.statics.findByCredentials = async function(identifier, password) {
    let user;
    
    // Check if identifier is an email or OAuth ID
    if (identifier.includes('@')) {
        user = await this.findOne({ email: identifier }).select('+password');
    } else {
        // Could be Google ID, Facebook ID, etc.
        user = await this.findOne({
            $or: [
                { googleId: identifier },
                { facebookId: identifier }
            ]
        }).select('+password');
    }
    
    if (!user) {
        throw new Error('Invalid credentials');
    }
    
    if (user.isLocked) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
    }
    
    if (!user.isActive) {
        throw new Error('Account is deactivated');
    }
    
    if (password && !await user.comparePassword(password)) {
        await user.incLoginAttempts();
        throw new Error('Invalid credentials');
    }
    
    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    return user;
};

// Static method to create guest user
userSchema.statics.createGuestUser = function(guestData = {}) {
    return this.create({
        name: 'Guest User',
        email: `guest_${Date.now()}@expensetracker.local`,
        isGuest: true,
        guestData: guestData,
        isEmailVerified: true, // Skip email verification for guests
        preferences: {
            currency: guestData.currency || 'INR',
            theme: guestData.theme || 'light'
        }
    });
};

module.exports = mongoose.model('User', userSchema);