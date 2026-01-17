const session = require('express-session');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key', // Fallback prevents crash if .env missing
  name: 'setkarr.sid',
  resave: false,
  saveUninitialized: false,
  // store: ... // Commented out to use MemoryStore (Prevents crash)
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
  rolling: true,
});

module.exports = sessionConfig;