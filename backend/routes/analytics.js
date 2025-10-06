/**
 * Analytics Routes for ExpenseTracker Pro
 * Handles analytics and reporting endpoints
 */

const express = require('express');
const Transaction = require('../models/Transaction');

const router = express.Router();

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get dashboard analytics
 * @access  Private
 */
router.get('/dashboard', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        // Calculate date range based on period
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const filter = {
            user: req.user._id,
            date: { $gte: startDate, $lte: now }
        };

        // Get dashboard statistics
        const [incomeStats, expenseStats, monthlyTrends, categoryBreakdown] = await Promise.all([
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
            
            // Monthly trends
            Transaction.aggregate([
                { $match: { ...filter } },
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
            ]),
            
            // Category breakdown
            Transaction.aggregate([
                { $match: { ...filter, type: 'expense' } },
                {
                    $group: {
                        _id: '$category',
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                        percentage: { $sum: '$amount' }
                    }
                },
                { $sort: { total: -1 } },
                { $limit: 10 }
            ])
        ]);

        // Calculate percentages for category breakdown
        const totalExpenses = expenseStats[0]?.total || 0;
        categoryBreakdown.forEach(category => {
            category.percentage = totalExpenses > 0 ? (category.total / totalExpenses) * 100 : 0;
        });

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
                trends: {
                    monthly: monthlyTrends
                },
                categories: categoryBreakdown
            }
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get dashboard analytics'
        });
    }
});

/**
 * @route   GET /api/v1/analytics/reports
 * @desc    Generate financial reports
 * @access  Private
 */
router.get('/reports', async (req, res) => {
    try {
        const { 
            startDate, 
            endDate, 
            type = 'all',
            format = 'json'
        } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Start date and end date are required'
            });
        }

        const filter = {
            user: req.user._id,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        if (type !== 'all') {
            filter.type = type;
        }

        // Get transactions for the period
        const transactions = await Transaction.find(filter)
            .sort({ date: -1 });

        // Generate summary statistics
        const summary = await Transaction.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 },
                    average: { $avg: '$amount' }
                }
            }
        ]);

        // Generate category breakdown
        const categoryBreakdown = await Transaction.aggregate([
            { $match: { ...filter, type: 'expense' } },
            {
                $group: {
                    _id: '$category',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);

        // Calculate totals
        const incomeData = summary.find(s => s._id === 'income') || { total: 0, count: 0, average: 0 };
        const expenseData = summary.find(s => s._id === 'expense') || { total: 0, count: 0, average: 0 };
        const balance = incomeData.total - expenseData.total;

        const reportData = {
            period: {
                startDate: new Date(startDate).toISOString().split('T')[0],
                endDate: new Date(endDate).toISOString().split('T')[0]
            },
            summary: {
                totalIncome: incomeData.total,
                totalExpense: expenseData.total,
                balance,
                incomeCount: incomeData.count,
                expenseCount: expenseData.count,
                incomeAverage: incomeData.average,
                expenseAverage: expenseData.average
            },
            categoryBreakdown,
            transactions: transactions.slice(0, 100) // Limit to 100 transactions for performance
        };

        if (format === 'csv') {
            // Generate CSV format
            const csv = generateCSV(reportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="expense-report-${Date.now()}.csv"`);
            res.send(csv);
        } else {
            res.json({
                status: 'success',
                data: reportData
            });
        }

    } catch (error) {
        console.error('Generate report error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to generate report'
        });
    }
});

/**
 * @route   GET /api/v1/analytics/insights
 * @desc    Get spending insights and recommendations
 * @access  Private
 */
router.get('/insights', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        // Calculate date range
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const filter = {
            user: req.user._id,
            date: { $gte: startDate, $lte: now }
        };

        // Get insights data
        const [spendingPatterns, topCategories, monthlyComparison] = await Promise.all([
            // Spending patterns by day of week
            Transaction.aggregate([
                { $match: { ...filter, type: 'expense' } },
                {
                    $group: {
                        _id: { $dayOfWeek: '$date' },
                        total: { $sum: '$amount' },
                        count: { $sum: 1 },
                        average: { $avg: '$amount' }
                    }
                },
                { $sort: { '_id': 1 } }
            ]),
            
            // Top spending categories
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
                { $limit: 5 }
            ]),
            
            // Monthly comparison
            Transaction.aggregate([
                { $match: { user: req.user._id, type: 'expense' } },
                {
                    $group: {
                        _id: {
                            month: { $month: '$date' },
                            year: { $year: '$date' }
                        },
                        total: { $sum: '$amount' }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 }
            ])
        ]);

        // Generate insights and recommendations
        const insights = generateInsights(spendingPatterns, topCategories, monthlyComparison);

        res.json({
            status: 'success',
            data: {
                insights,
                patterns: {
                    dayOfWeek: spendingPatterns,
                    topCategories,
                    monthlyComparison
                }
            }
        });

    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get insights'
        });
    }
});

// Helper function to generate CSV
function generateCSV(data) {
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const rows = [headers.join(',')];
    
    data.transactions.forEach(transaction => {
        const row = [
            transaction.date.toISOString().split('T')[0],
            transaction.type,
            transaction.category,
            transaction.amount,
            `"${transaction.description}"`
        ];
        rows.push(row.join(','));
    });
    
    return rows.join('\n');
}

// Helper function to generate insights
function generateInsights(spendingPatterns, topCategories, monthlyComparison) {
    const insights = [];
    
    // Analyze spending patterns
    if (spendingPatterns.length > 0) {
        const highestDay = spendingPatterns.reduce((max, day) => 
            day.total > max.total ? day : max
        );
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        insights.push({
            type: 'pattern',
            title: 'Highest Spending Day',
            message: `You spend most on ${dayNames[highestDay._id - 1]}s. Consider planning your budget for this day.`,
            value: highestDay.total
        });
    }
    
    // Analyze top categories
    if (topCategories.length > 0) {
        const topCategory = topCategories[0];
        insights.push({
            type: 'category',
            title: 'Top Spending Category',
            message: `${topCategory._id} accounts for your highest expenses. Review if this aligns with your financial goals.`,
            value: topCategory.total,
            category: topCategory._id
        });
    }
    
    // Analyze monthly trends
    if (monthlyComparison.length >= 2) {
        const current = monthlyComparison[0];
        const previous = monthlyComparison[1];
        const change = ((current.total - previous.total) / previous.total) * 100;
        
        if (Math.abs(change) > 10) {
            insights.push({
                type: 'trend',
                title: 'Spending Trend',
                message: `Your spending has ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% compared to last month.`,
                value: change
            });
        }
    }
    
    return insights;
}

module.exports = router;