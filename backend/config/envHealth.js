/**
 * Health check for Environment Variables
 * This script ensures required security keys are present and valid on boot.
 * It does NOT change any application behavior or business logic.
 */

const requiredVars = {
    MONGO_URI: "Database connection string is missing",
    JWT_SECRET: "JWT secret is missing or too short",
    SESSION_SECRET: "Session secret is missing",
    ENCRYPTION_KEY: "Data encryption key is missing"
};

const checkEnv = () => {
    console.log('📡 Security: Running environment health check...');

    const missing = [];

    for (const [key, description] of Object.entries(requiredVars)) {
        if (!process.env[key]) {
            missing.push(`❌ ${key}: ${description}`);
        }

        // Safety check for length (secrets should be at least 32 chars)
        if (['JWT_SECRET', 'SESSION_SECRET', 'ENCRYPTION_KEY'].includes(key)) {
            const val = process.env[key];
            if (val && val.length < 20) {
                missing.push(`⚠️ ${key} is too weak (less than 20 characters)`);
            }
        }
    }

    if (missing.length > 0) {
        console.error('\n🛑 CRITICAL SECURITY ERROR: Environment is not configured correctly!');
        missing.forEach(msg => console.error(msg));
        console.error('Please fix your .env file before running in production.\n');

        if (process.env.NODE_ENV === 'production') {
            process.exit(1); // Force stop if in production for safety
        }
    } else {
        console.log('✅ Security: Environment health check passed.\n');
    }
};

module.exports = checkEnv;
