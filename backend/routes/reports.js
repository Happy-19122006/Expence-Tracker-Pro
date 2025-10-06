const express = require('express');
const { authenticate } = require('../middleware/auth');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');

const router = express.Router();

// @desc    Generate monthly report
// @route   POST /api/reports/generate
// @access  Private
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, period = 'custom' } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({
        status: 'error',
        message: 'Start date must be before end date'
      });
    }

    // Generate report
    const report = await Report.generateReport(req.user._id, start, end, period);

    res.status(201).json({
      status: 'success',
      message: 'Report generated successfully',
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate report',
      error: error.message
    });
  }
});

// @desc    Get report by ID
// @route   GET /api/reports/:id
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('categoryBreakdown.category', 'name icon color')
      .populate('topTransactions');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report',
      error: error.message
    });
  }
});

// @desc    Get latest report
// @route   GET /api/reports/latest
// @access  Private
router.get('/latest/:period?', authenticate, async (req, res) => {
  try {
    const period = req.params.period || 'monthly';
    
    const report = await Report.getLatestReport(req.user._id, period);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'No report found for the specified period'
      });
    }

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch latest report',
      error: error.message
    });
  }
});

// @desc    Get report history
// @route   GET /api/reports
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const reports = await Report.getReportHistory(req.user._id, parseInt(limit));

    res.json({
      status: 'success',
      data: { reports }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report history',
      error: error.message
    });
  }
});

// @desc    Generate quick monthly summary
// @route   GET /api/reports/monthly-summary
// @access  Private
router.get('/monthly-summary', authenticate, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const currentDate = new Date();
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

    // Get monthly statistics
    const stats = await Transaction.getMonthlySummary(req.user._id, targetYear, targetMonth);

    // Format response
    const summary = {
      year: targetYear,
      month: targetMonth,
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      transactionCount: 0,
      averageIncome: 0,
      averageExpense: 0
    };

    stats.forEach(stat => {
      summary[`total${stat._id.charAt(0).toUpperCase() + stat._id.slice(1)}`] = stat.total;
      summary[`average${stat._id.charAt(0).toUpperCase() + stat._id.slice(1)}`] = stat.average;
    });

    summary.netBalance = summary.totalIncome - summary.totalExpense;

    // Get category breakdown for expenses
    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: {
            $gte: new Date(targetYear, targetMonth - 1, 1),
            $lte: new Date(targetYear, targetMonth, 0, 23, 59, 59)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          category: {
            name: '$category.name',
            icon: '$category.icon',
            color: '$category.color'
          },
          amount: 1,
          count: 1,
          percentage: {
            $multiply: [
              { $divide: ['$amount', summary.totalExpense] },
              100
            ]
          }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Get top transactions
    const topTransactions = await Transaction.find({
      user: req.user._id,
      date: {
        $gte: new Date(targetYear, targetMonth - 1, 1),
        $lte: new Date(targetYear, targetMonth, 0, 23, 59, 59)
      },
      status: 'completed'
    })
      .populate('category', 'name icon color')
      .sort({ amount: -1 })
      .limit(10);

    res.json({
      status: 'success',
      data: {
        summary,
        categoryBreakdown,
        topTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate monthly summary',
      error: error.message
    });
  }
});

// @desc    Export report as CSV
// @route   GET /api/reports/:id/export/csv
// @access  Private
router.get('/:id/export/csv', authenticate, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('topTransactions');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Generate CSV content
    let csvContent = 'ExpenseTracker Pro - Monthly Report\n';
    csvContent += `Generated: ${report.generatedAt.toISOString()}\n`;
    csvContent += `Period: ${report.startDate.toISOString().split('T')[0]} to ${report.endDate.toISOString().split('T')[0]}\n\n`;
    
    // Summary section
    csvContent += 'SUMMARY\n';
    csvContent += `Total Income,${report.summary.totalIncome}\n`;
    csvContent += `Total Expense,${report.summary.totalExpense}\n`;
    csvContent += `Net Balance,${report.summary.netBalance}\n`;
    csvContent += `Total Transactions,${report.summary.transactionCount}\n\n`;
    
    // Category breakdown
    csvContent += 'CATEGORY BREAKDOWN\n';
    csvContent += 'Category,Amount,Count,Percentage\n';
    report.categoryBreakdown.forEach(cat => {
      csvContent += `${cat.category.name},${cat.amount},${cat.count},${cat.percentage.toFixed(2)}%\n`;
    });
    
    csvContent += '\nTOP TRANSACTIONS\n';
    csvContent += 'Date,Category,Description,Amount,Type\n';
    report.topTransactions.forEach(tx => {
      csvContent += `${tx.date.toISOString().split('T')[0]},${tx.category.name},${tx.description},${tx.amount},${tx.type}\n`;
    });

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expense-report-${report.startDate.toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to export report as CSV',
      error: error.message
    });
  }
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete report',
      error: error.message
    });
  }
});

// @desc    Generate auto-reports (for cron jobs)
// @route   POST /api/reports/auto-generate
// @access  Private (Admin only - for future use)
router.post('/auto-generate', authenticate, async (req, res) => {
  try {
    // This endpoint can be used for automated report generation
    // For now, it generates a monthly report for the previous month
    
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Check if report already exists for this period
    const existingReport = await Report.findOne({
      user: req.user._id,
      startDate: lastMonth,
      endDate: endOfLastMonth,
      period: 'monthly'
    });

    if (existingReport) {
      return res.json({
        status: 'success',
        message: 'Report already exists for this period',
        data: { report: existingReport }
      });
    }

    // Generate new report
    const report = await Report.generateReport(
      req.user._id,
      lastMonth,
      endOfLastMonth,
      'monthly'
    );

    res.status(201).json({
      status: 'success',
      message: 'Auto-report generated successfully',
      data: { report }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate auto-report',
      error: error.message
    });
  }
});

module.exports = router;
