/**
 * AppError Class
 * A custom error class for handling operational errors in a standardized way.
 * Common in advanced startup architectures like Zomato and Blinkit.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Key for distinguishing from programming bugs

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
