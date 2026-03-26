const winston = require('winston');
require('winston-mongodb');

// 1. Define sensitive keys to hide
const SENSITIVE_KEYS = ['password', 'token', 'refreshToken', 'creditCard', 'cvv', 'otp'];

// 2. Custom format to redact secrets
const redactSecrets = winston.format((info) => {
    const mask = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        for (const key in obj) {
            if (SENSITIVE_KEYS.includes(key)) {
                obj[key] = '***REDACTED***';
            } else if (typeof obj[key] === 'object') {
                mask(obj[key]);
            }
        }
        return obj;
    };
    return mask(info);
});

// 3. Create the Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        redactSecrets(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // A. Console Log (Always active)
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),

        // B. MongoDB Log (Capped Collection)
        // Stores logs in 'logs' collection. 
        // Auto-deletes old logs when size > 10MB to stay Free.
        new winston.transports.MongoDB({
            db: process.env.MONGO_URI,
            collection: 'logs',
            options: { },
            capped: true,
            cappedSize: 10000000, // 10MB Limit
            tryReconnect: true,
            leaveConnectionOpen: false
        })
    ],
});

module.exports = logger;
