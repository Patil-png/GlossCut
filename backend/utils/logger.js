const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

// 1. Create Logtail client (if token exists)
let logtail;
if (process.env.LOGTAIL_SOURCE_TOKEN) {
    logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN);
}

// 2. Define sensitive keys to hide
const SENSITIVE_KEYS = ['password', 'token', 'refreshToken', 'creditCard', 'cvv', 'otp'];

// 3. Custom format to redact secrets
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

// 4. Create the Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        redactSecrets(),
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        // Always log to console
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ],
});

// 5. Add Cloud Transport if Token exists
if (logtail) {
    logger.add(new LogtailTransport(logtail));
}

module.exports = logger;
