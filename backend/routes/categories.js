const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validate, categorySchemas, sanitizeInput } = require('../middleware/validation');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

const router = express.Router();

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public (for frontend compatibility)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    
    const categories = await Category.getByType(type);

    res.json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    res.json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch category',
      error: error.message
    });
  }
});

// @desc    Create new category
// @route   POST /api/categories
// @access  Private
router.post('/', authenticate, sanitizeInput, validate(categorySchemas.create), async (req, res) => {
  try {
    // Check if category name already exists
    const existingCategory = await Category.findOne({ 
      name: req.body.name,
      isActive: true 
    });

    if (existingCategory) {
      return res.status(400).json({
        status: 'error',
        message: 'Category with this name already exists'
      });
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: { category }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create category',
      error: error.message
    });
  }
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
router.put('/:id', authenticate, sanitizeInput, validate(categorySchemas.update), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    // Check if new name conflicts with existing category
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: req.body.name,
        _id: { $ne: req.params.id },
        isActive: true 
      });

      if (existingCategory) {
        return res.status(400).json({
          status: 'error',
          message: 'Category with this name already exists'
        });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({
      status: 'success',
      message: 'Category updated successfully',
      data: { category: updatedCategory }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update category',
      error: error.message
    });
  }
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    // Check if category is default (cannot be deleted)
    if (category.isDefault) {
      return res.status(400).json({
        status: 'error',
        message: 'Default categories cannot be deleted'
      });
    }

    // Check if category has transactions
    const transactionCount = await Transaction.countDocuments({ category: req.params.id });

    if (transactionCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete category with ${transactionCount} transactions. Deactivate instead.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete category',
      error: error.message
    });
  }
});

// @desc    Deactivate category
// @route   PATCH /api/categories/:id/deactivate
// @access  Private
router.patch('/:id/deactivate', authenticate, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    if (category.isDefault) {
      return res.status(400).json({
        status: 'error',
        message: 'Default categories cannot be deactivated'
      });
    }

    category.isActive = false;
    await category.save();

    res.json({
      status: 'success',
      message: 'Category deactivated successfully',
      data: { category }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to deactivate category',
      error: error.message
    });
  }
});

// @desc    Activate category
// @route   PATCH /api/categories/:id/activate
// @access  Private
router.patch('/:id/activate', authenticate, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    category.isActive = true;
    await category.save();

    res.json({
      status: 'success',
      message: 'Category activated successfully',
      data: { category }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate category',
      error: error.message
    });
  }
});

// @desc    Get popular categories
// @route   GET /api/categories/popular
// @access  Public
router.get('/stats/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const popularCategories = await Category.getPopularCategories(parseInt(limit));

    res.json({
      status: 'success',
      data: { categories: popularCategories }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch popular categories',
      error: error.message
    });
  }
});

// @desc    Get category statistics
// @route   GET /api/categories/:id/stats
// @access  Public
router.get('/:id/stats', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    const stats = await category.getStats();

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch category statistics',
      error: error.message
    });
  }
});

// @desc    Initialize default categories
// @route   POST /api/categories/initialize
// @access  Private (Admin only - for development)
router.post('/initialize', authenticate, async (req, res) => {
  try {
    // Check if user is admin (you can implement admin role later)
    // For now, allow any authenticated user to initialize defaults
    
    await Category.initializeDefaults();

    const defaultCategories = await Category.find({ isDefault: true });

    res.json({
      status: 'success',
      message: 'Default categories initialized',
      data: { categories: defaultCategories }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize default categories',
      error: error.message
    });
  }
});

module.exports = router;
