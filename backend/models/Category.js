const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxlength: [50, 'Category name cannot be more than 50 characters']
  },
  icon: {
    type: String,
    required: [true, 'Icon is required'],
    trim: true,
    default: 'fas fa-tag'
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: {
      values: ['income', 'expense', 'both'],
      message: 'Type must be income, expense, or both'
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for category with transaction count
categorySchema.virtual('transactionCount', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'category',
  count: true
});

// Index for better query performance
categorySchema.index({ name: 1 });
categorySchema.index({ type: 1 });
categorySchema.index({ isActive: 1 });

// Pre-save middleware to increment usage count
categorySchema.pre('save', function(next) {
  if (this.isNew) {
    this.usageCount = 0;
  }
  next();
});

// Static method to get default categories
categorySchema.statics.getDefaultCategories = function() {
  return [
    // Expense categories
    { name: 'Food & Dining', icon: 'fas fa-utensils', color: '#f59e0b', type: 'expense', isDefault: true },
    { name: 'Transportation', icon: 'fas fa-car', color: '#3b82f6', type: 'expense', isDefault: true },
    { name: 'Shopping', icon: 'fas fa-shopping-bag', color: '#8b5cf6', type: 'expense', isDefault: true },
    { name: 'Bills & Utilities', icon: 'fas fa-file-invoice', color: '#ef4444', type: 'expense', isDefault: true },
    { name: 'Entertainment', icon: 'fas fa-film', color: '#10b981', type: 'expense', isDefault: true },
    { name: 'Health & Fitness', icon: 'fas fa-heartbeat', color: '#f97316', type: 'expense', isDefault: true },
    { name: 'Education', icon: 'fas fa-graduation-cap', color: '#06b6d4', type: 'expense', isDefault: true },
    { name: 'Travel', icon: 'fas fa-plane', color: '#84cc16', type: 'expense', isDefault: true },
    { name: 'Other', icon: 'fas fa-ellipsis-h', color: '#6b7280', type: 'expense', isDefault: true },
    
    // Income categories
    { name: 'Salary', icon: 'fas fa-money-bill-wave', color: '#22c55e', type: 'income', isDefault: true },
    { name: 'Freelance', icon: 'fas fa-laptop-code', color: '#eab308', type: 'income', isDefault: true },
    { name: 'Investments', icon: 'fas fa-chart-line', color: '#06b6d4', type: 'income', isDefault: true },
    { name: 'Gifts', icon: 'fas fa-gift', color: '#f472b6', type: 'income', isDefault: true },
    { name: 'Business', icon: 'fas fa-briefcase', color: '#8b5cf6', type: 'income', isDefault: true }
  ];
};

// Static method to initialize default categories
categorySchema.statics.initializeDefaults = async function() {
  try {
    const existingCategories = await this.countDocuments();
    if (existingCategories === 0) {
      const defaultCategories = this.getDefaultCategories();
      await this.insertMany(defaultCategories);
      console.log('✅ Default categories initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing default categories:', error);
  }
};

// Static method to get categories by type
categorySchema.statics.getByType = function(type) {
  const query = { isActive: true };
  if (type && type !== 'both') {
    query.type = { $in: [type, 'both'] };
  }
  return this.find(query).sort({ isDefault: -1, name: 1 });
};

// Static method to get popular categories
categorySchema.statics.getPopularCategories = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1, name: 1 })
    .limit(limit);
};

// Instance method to increment usage
categorySchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to get category statistics
categorySchema.methods.getStats = async function() {
  const Transaction = mongoose.model('Transaction');
  
  const stats = await Transaction.aggregate([
    { $match: { category: this._id } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        average: { $avg: '$amount' }
      }
    }
  ]);
  
  return {
    category: this,
    stats: stats.reduce((acc, stat) => {
      acc[stat._id] = {
        total: stat.total,
        count: stat.count,
        average: stat.average
      };
      return acc;
    }, {})
  };
};

module.exports = mongoose.model('Category', categorySchema);
