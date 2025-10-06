/**
 * Transaction Routes for ExpenseTracker Pro
 * Handles transaction CRUD operations
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');

const router = express.Router();

/**
 * @route   GET /api/v1/transactions
 * @desc    Get user transactions with filtering and pagination
 * @access  Private
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = { user: req.user._id };
        
        if (req.query.type) {
            filter.type = req.query.type;
        }
        
        if (req.query.category) {
            filter.category = req.query.category;
        }
        
        if (req.query.startDate && req.query.endDate) {
            filter.date = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // Get transactions
        const transactions = await Transaction.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Transaction.countDocuments(filter);

        res.json({
            status: 'success',
            data: {
                transactions,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    itemsPerPage: limit
                }
            }
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get transactions'
        });
    }
});

/**
 * @route   POST /api/v1/transactions
 * @desc    Create a new transaction
 * @access  Private
 */
router.post('/', [
    body('type')
        .isIn(['income', 'expense'])
        .withMessage('Type must be income or expense'),
    body('amount')
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
    body('category')
        .notEmpty()
        .withMessage('Category is required'),
    body('description')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Description must be between 1 and 500 characters'),
    body('date')
        .isISO8601()
        .withMessage('Date must be a valid date')
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

        const transactionData = {
            ...req.body,
            user: req.user._id
        };

        const transaction = new Transaction(transactionData);
        await transaction.save();

        res.status(201).json({
            status: 'success',
            message: 'Transaction created successfully',
            data: {
                transaction
            }
        });

    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create transaction'
        });
    }
});

/**
 * @route   GET /api/v1/transactions/:id
 * @desc    Get a specific transaction
 * @access  Private
 */
router.get('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        res.json({
            status: 'success',
            data: {
                transaction
            }
        });

    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get transaction'
        });
    }
});

/**
 * @route   PUT /api/v1/transactions/:id
 * @desc    Update a transaction
 * @access  Private
 */
router.put('/:id', [
    body('type')
        .optional()
        .isIn(['income', 'expense'])
        .withMessage('Type must be income or expense'),
    body('amount')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Amount must be a positive number'),
    body('category')
        .optional()
        .notEmpty()
        .withMessage('Category cannot be empty'),
    body('description')
        .optional()
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Description must be between 1 and 500 characters'),
    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid date')
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

        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Transaction updated successfully',
            data: {
                transaction
            }
        });

    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update transaction'
        });
    }
});

/**
 * @route   DELETE /api/v1/transactions/:id
 * @desc    Delete a transaction
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!transaction) {
            return res.status(404).json({
                status: 'error',
                message: 'Transaction not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Transaction deleted successfully'
        });

    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to delete transaction'
        });
    }
});

/**
 * @route   GET /api/v1/transactions/stats/summary
 * @desc    Get transaction summary statistics
 * @access  Private
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Build date filter
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                date: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        }

        const filter = { user: req.user._id, ...dateFilter };

        // Get summary statistics
        const [incomeStats, expenseStats, categoryStats] = await Promise.all([
            // Income statistics
            Transaction.aggregate([
                { $match: { ...filter, type: 'income' } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                        average: { $avg: '$amount' }
                    }
                }
            ]),
            
            // Expense statistics
            Transaction.aggregate([
                { $match: { ...filter, type: 'expense' } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                        average: { $avg: '$amount' }
                    }
                }
            ]),
            
            // Category statistics
            Transaction.aggregate([
                { $match: { ...filter, type: 'expense' } },
                {
                    $group: {
                        _id: '$category',
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { total: -1 } },
                { $limit: 10 }
            ])
        ]);

        const totalIncome = incomeStats[0]?.total || 0;
        const totalExpense = expenseStats[0]?.total || 0;
        const balance = totalIncome - totalExpense;

        res.json({
            status: 'success',
            data: {
                summary: {
                    totalIncome,
                    totalExpense,
                    balance,
                    incomeCount: incomeStats[0]?.count || 0,
                    expenseCount: expenseStats[0]?.count || 0,
                    incomeAverage: incomeStats[0]?.average || 0,
                    expenseAverage: expenseStats[0]?.average || 0
                },
                categoryBreakdown: categoryStats
            }
        });

    } catch (error) {
        console.error('Get transaction stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get transaction statistics'
        });
    }
});

module.exports = router;