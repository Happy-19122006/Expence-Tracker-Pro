/**
 * Transaction Model for ExpenseTracker Pro
 * Handles income and expense transactions
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    // User reference
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Transaction must belong to a user']
    },
    
    // Transaction details
    type: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: ['income', 'expense'],
        lowercase: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0.01, 'Amount must be greater than 0']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        trim: true,
        maxlength: [50, 'Category cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    date: {
        type: Date,
        required: [true, 'Transaction date is required'],
        default: Date.now
    },
    
    // Additional details
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    location: {
        name: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    receipt: {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        url: String
    },
    
    // Recurring transaction
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringPattern: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly'],
            default: 'monthly'
        },
        interval: {
            type: Number,
            default: 1,
            min: 1
        },
        endDate: Date,
        nextDueDate: Date
    },
    
    // Status and metadata
    status: {
        type: String,
        enum: ['active', 'cancelled', 'pending'],
        default: 'active'
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    
    // System fields
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });
transactionSchema.index({ user: 1, 'recurringPattern.nextDueDate': 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
    return this.amount.toFixed(2);
});

// Virtual for transaction status
transactionSchema.virtual('isOverdue').get(function() {
    if (!this.isRecurring || !this.recurringPattern.nextDueDate) {
        return false;
    }
    return this.recurringPattern.nextDueDate < new Date();
});

// Pre-save middleware to update next due date for recurring transactions
transactionSchema.pre('save', function(next) {
    if (this.isRecurring && this.isNew) {
        this.updateNextDueDate();
    }
    this.updatedAt = new Date();
    next();
});

// Instance method to update next due date
transactionSchema.methods.updateNextDueDate = function() {
    if (!this.isRecurring || !this.recurringPattern) {
        return;
    }
    
    const { frequency, interval } = this.recurringPattern;
    const currentDate = this.recurringPattern.nextDueDate || this.date;
    let nextDate = new Date(currentDate);
    
    switch (frequency) {
        case 'daily':
            nextDate.setDate(nextDate.getDate() + interval);
            break;
        case 'weekly':
            nextDate.setDate(nextDate.getDate() + (7 * interval));
            break;
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + interval);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + interval);
            break;
    }
    
    this.recurringPattern.nextDueDate = nextDate;
};

// Instance method to generate next recurring transaction
transactionSchema.methods.generateNextRecurring = function() {
    if (!this.isRecurring) {
        return null;
    }
    
    // Check if we should stop (end date reached)
    if (this.recurringPattern.endDate && 
        this.recurringPattern.nextDueDate > this.recurringPattern.endDate) {
        return null;
    }
    
    // Create new transaction based on this one
    const nextTransaction = new this.constructor({
        user: this.user,
        type: this.type,
        amount: this.amount,
        category: this.category,
        description: this.description,
        date: this.recurringPattern.nextDueDate,
        tags: this.tags,
        location: this.location,
        isRecurring: this.isRecurring,
        recurringPattern: this.recurringPattern,
        notes: this.notes
    });
    
    return nextTransaction;
};

// Static method to get user's transaction summary
transactionSchema.statics.getUserSummary = async function(userId, startDate, endDate) {
    const matchStage = { user: mongoose.Types.ObjectId(userId) };
    
    if (startDate && endDate) {
        matchStage.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    const summary = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
                average: { $avg: '$amount' }
            }
        }
    ]);
    
    const incomeData = summary.find(s => s._id === 'income') || { total: 0, count: 0, average: 0 };
    const expenseData = summary.find(s => s._id === 'expense') || { total: 0, count: 0, average: 0 };
    
    return {
        income: incomeData,
        expense: expenseData,
        balance: incomeData.total - expenseData.total
    };
};

// Static method to get category breakdown
transactionSchema.statics.getCategoryBreakdown = async function(userId, startDate, endDate, type = 'expense') {
    const matchStage = { 
        user: mongoose.Types.ObjectId(userId),
        type: type
    };
    
    if (startDate && endDate) {
        matchStage.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    return await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 },
                average: { $avg: '$amount' }
            }
        },
        { $sort: { total: -1 } }
    ]);
};

// Static method to get monthly trends
transactionSchema.statics.getMonthlyTrends = async function(userId, months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    return await this.aggregate([
        {
            $match: {
                user: mongoose.Types.ObjectId(userId),
                date: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$date' },
                    year: { $year: '$date' },
                    type: '$type'
                },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
};

// Static method to process recurring transactions
transactionSchema.statics.processRecurringTransactions = async function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find transactions that are due today
    const dueTransactions = await this.find({
        isRecurring: true,
        'recurringPattern.nextDueDate': {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        },
        status: 'active'
    });
    
    const newTransactions = [];
    
    for (const transaction of dueTransactions) {
        const nextTransaction = transaction.generateNextRecurring();
        if (nextTransaction) {
            newTransactions.push(nextTransaction);
            // Update the original transaction's next due date
            transaction.updateNextDueDate();
            await transaction.save();
        }
    }
    
    if (newTransactions.length > 0) {
        await this.insertMany(newTransactions);
    }
    
    return newTransactions;
};

module.exports = mongoose.model('Transaction', transactionSchema);