const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        details: errorMessage
      });
    }
    
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot be more than 50 characters'
      }),
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .lowercase()
      .required()
      .messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email'
      }),
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    name: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .optional(),
    preferences: Joi.object({
      currency: Joi.string()
        .valid('USD', 'INR', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD')
        .optional(),
      theme: Joi.string()
        .valid('light', 'dark', 'auto')
        .optional(),
      notifications: Joi.boolean()
        .optional()
    }).optional()
  })
};

// Transaction validation schemas
const transactionSchemas = {
  create: Joi.object({
    amount: Joi.number()
      .positive()
      .precision(2)
      .required()
      .messages({
        'number.base': 'Amount must be a number',
        'number.positive': 'Amount must be positive',
        'any.required': 'Amount is required'
      }),
    type: Joi.string()
      .valid('income', 'expense')
      .required()
      .messages({
        'any.only': 'Type must be either income or expense',
        'any.required': 'Type is required'
      }),
    category: Joi.string()
      .required()
      .messages({
        'string.empty': 'Category is required',
        'any.required': 'Category is required'
      }),
    description: Joi.string()
      .trim()
      .min(1)
      .max(200)
      .required()
      .messages({
        'string.empty': 'Description is required',
        'string.min': 'Description is required',
        'string.max': 'Description cannot be more than 200 characters'
      }),
    note: Joi.string()
      .trim()
      .max(500)
      .optional()
      .messages({
        'string.max': 'Note cannot be more than 500 characters'
      }),
    date: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.base': 'Date must be a valid date',
        'date.max': 'Date cannot be in the future'
      }),
    tags: Joi.array()
      .items(Joi.string().trim().lowercase())
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 tags'
      }),
    recurring: Joi.object({
      isRecurring: Joi.boolean().optional(),
      frequency: Joi.string()
        .valid('daily', 'weekly', 'monthly', 'yearly')
        .optional(),
      endDate: Joi.date().optional()
    }).optional(),
    status: Joi.string()
      .valid('pending', 'completed', 'cancelled')
      .optional()
  }),

  update: Joi.object({
    amount: Joi.number()
      .positive()
      .precision(2)
      .optional(),
    type: Joi.string()
      .valid('income', 'expense')
      .optional(),
    category: Joi.string().optional(),
    description: Joi.string()
      .trim()
      .min(1)
      .max(200)
      .optional(),
    note: Joi.string()
      .trim()
      .max(500)
      .optional(),
    date: Joi.date()
      .max('now')
      .optional(),
    tags: Joi.array()
      .items(Joi.string().trim().lowercase())
      .max(10)
      .optional(),
    recurring: Joi.object({
      isRecurring: Joi.boolean().optional(),
      frequency: Joi.string()
        .valid('daily', 'weekly', 'monthly', 'yearly')
        .optional(),
      endDate: Joi.date().optional()
    }).optional(),
    status: Joi.string()
      .valid('pending', 'completed', 'cancelled')
      .optional()
  })
};

// Category validation schemas
const categorySchemas = {
  create: Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .required()
      .messages({
        'string.empty': 'Category name is required',
        'string.min': 'Category name is required',
        'string.max': 'Category name cannot be more than 50 characters'
      }),
    icon: Joi.string()
      .trim()
      .optional(),
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .required()
      .messages({
        'string.pattern.base': 'Color must be a valid hex color (e.g., #FF0000)',
        'any.required': 'Color is required'
      }),
    type: Joi.string()
      .valid('income', 'expense', 'both')
      .required()
      .messages({
        'any.only': 'Type must be income, expense, or both',
        'any.required': 'Type is required'
      }),
    description: Joi.string()
      .trim()
      .max(200)
      .optional()
      .messages({
        'string.max': 'Description cannot be more than 200 characters'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .trim()
      .min(1)
      .max(50)
      .optional(),
    icon: Joi.string()
      .trim()
      .optional(),
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional(),
    type: Joi.string()
      .valid('income', 'expense', 'both')
      .optional(),
    description: Joi.string()
      .trim()
      .max(200)
      .optional(),
    isActive: Joi.boolean().optional()
  })
};

// Query parameter validation
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    sort: Joi.string().optional(),
    order: Joi.string().valid('asc', 'desc').optional()
  }),

  transactionFilters: Joi.object({
    type: Joi.string().valid('income', 'expense').optional(),
    category: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    status: Joi.string().valid('pending', 'completed', 'cancelled').optional(),
    search: Joi.string().trim().max(100).optional()
  }),

  reportFilters: Joi.object({
    period: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly', 'custom').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  })
};

// Sanitize input middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
};

module.exports = {
  validate,
  userSchemas,
  transactionSchemas,
  categorySchemas,
  querySchemas,
  sanitizeInput
};
