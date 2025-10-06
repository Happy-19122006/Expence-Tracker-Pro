/**
 * Global Error Handler for ExpenseTracker Pro API
 * Handles all errors and provides consistent error responses
 */

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', err);

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = {
            status: 'error',
            message,
            statusCode: 404
        };
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = {
            status: 'error',
            message,
            statusCode: 400
        };
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            status: 'error',
            message,
            statusCode: 400
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = {
            status: 'error',
            message,
            statusCode: 401
        };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = {
            status: 'error',
            message,
            statusCode: 401
        };
    }

    // Rate limiting error
    if (err.name === 'TooManyRequestsError') {
        const message = 'Too many requests, please try again later';
        error = {
            status: 'error',
            message,
            statusCode: 429
        };
    }

    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large';
        error = {
            status: 'error',
            message,
            statusCode: 400
        };
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server Error';

    res.status(statusCode).json({
        status: 'error',
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;