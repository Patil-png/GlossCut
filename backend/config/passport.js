const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const AuditLogger = require('../middleware/auditMiddleware');
const { createHMAC } = require('../utils/EncryptionService');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Passport.js Configuration for Google OAuth 2.0
 * Handles user authentication and registration with encrypted fields
 */

// Serialize user for session storage
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Passport deserialize error:', error);
    done(error, null);
  }
});

// Google OAuth 2.0 Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // 👇 Uses the dynamic URL from .env (Works for both Mobile & Web)
    callbackURL: process.env.CALLBACK_URL, 
    passReqToCallback: true,
    scope: ['profile', 'email']
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth profile data:', {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName
      });

      // Extract user info from Google profile
      const googleId = profile.id;
      const email = profile.emails[0].value;
      const name = profile.displayName;
      const profilePicture = profile.photos[0]?.value;

      // Create email hash for database lookup
      const emailHash = createHMAC(email);

      // Check if user exists by googleId or emailHash
      let user = await User.findOne({
        $or: [
          { googleId: googleId },
          { emailHash: emailHash }
        ]
      });

      if (user) {
        // Existing user - update Google info if needed
        console.log('Existing user found:', user.email);

        let updated = false;
        if (!user.googleId) {
          user.googleId = googleId;
          updated = true;
        }
        if (!user.profilePicture && profilePicture) {
          user.profilePicture = profilePicture;
          updated = true;
        }
        if (!user.isEmailVerified) {
          user.isEmailVerified = true; // Google verified emails
          user.emailVerificationToken = undefined;
          user.emailVerificationExpires = undefined;
          updated = true;
        }

        // If we fetched a phone number and user has no phone, set and save it
        // Phone number retrieval via People API removed for login-only flows.

        if (updated) {
          user.lastLogin = new Date();
          user.loginCount = (user.loginCount || 0) + 1;
          await user.save();
          console.log('User profile updated with Google info');
        }

        // Log successful login (FIXED: Changed 'USER_LOGIN' to 'LOGIN' to match Schema)
        await AuditLogger.log({
          userId: user._id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user._id,
          changes: { method: 'google_oauth', success: true },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        return done(null, user);
      }

      // BEFORE CREATING: Respect 'login-only' requests encoded into state
      const rawState = req.query?.state || '';
      const loginOnly = rawState.includes('login_only=1') || rawState.includes('login_only=true');
      if (!user && loginOnly) {
        console.log('Login-only Google OAuth attempt; no existing user. Aborting user creation.');
        return done(null, false, { message: 'signup_not_allowed' });
      }

      // New user - create account
      console.log('Creating new user from Google OAuth');

      const newUser = new User({
        name: name,
        email: email, // Will be encrypted by pre-save middleware
        googleId: googleId,
        profilePicture: profilePicture,
        isEmailVerified: true, // Google verified emails
        role: 'customer', // Default role
        lastLogin: new Date(),
        loginCount: 1
      });

      // Set audit context for tracking
      newUser._auditUserId = newUser._id;

      await newUser.save();

      console.log('New user created from Google OAuth:', newUser._id);

      // Log user registration (FIXED: Changed 'USER_REGISTER' to 'REGISTER')
      await AuditLogger.log({
        userId: newUser._id,
        action: 'REGISTER',
        entity: 'User',
        entityId: newUser._id,
        changes: { method: 'google_oauth', success: true },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return done(null, newUser);

    } catch (error) {
      console.error('Google OAuth strategy error:', error);

      // Log failed authentication attempt
      try {
        await AuditLogger.log({
          action: 'LOGIN_FAILED', // FIXED: Standardized Enum
          entity: 'User',
          changes: {
            method: 'google_oauth',
            error: error.message,
            email: profile.emails?.[0]?.value
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      } catch (logError) {
        console.error('Audit logging failed during error handling:', logError);
      }

      return done(error, null);
    }
  }
));

module.exports = passport;